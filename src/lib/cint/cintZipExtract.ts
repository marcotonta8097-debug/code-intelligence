/**
 * CI ZIP → RepositoryTreeSnapshot (no third-party unzip dependency).
 * Supports stored + deflate PKZIP entries via central directory.
 */

import { inflateRawSync } from "node:zlib";
import type { RepoFileSnapshot, RepositoryTreeSnapshot } from "@/core/codeIntelligence/repositoryIntelligenceEngine";

export const CINT_ZIP_EXTRACT_VERSION = "cint.zip.extract.v1" as const;

export type CintZipExtractOptions = {
  repositoryId?: string;
  maxFiles?: number;
  maxFileBytes?: number;
  maxTotalBytes?: number;
};

export type CintZipExtractResult = {
  tree: RepositoryTreeSnapshot;
  skipped: number;
  bytesRead: number;
};

const SIG_EOCD = 0x06054b50;
const SIG_CEN = 0x02014b50;
const METHOD_STORE = 0;
const METHOD_DEFLATE = 8;

const SKIP_PREFIX = [/__macosx\//i, /^\.git\//i, /^node_modules\//i];
const TEXT_EXT =
  /\.(ts|tsx|js|jsx|mjs|cjs|json|md|txt|yml|yaml|toml|go|rs|py|java|kt|cs|css|scss|html|htm|xml|sql|sh|dockerfile|env|mod|sum|lock|gradle|properties|ini|cfg|conf)$/i;

function readU16(buf: Buffer, offset: number): number {
  return buf.readUInt16LE(offset);
}

function readU32(buf: Buffer, offset: number): number {
  return buf.readUInt32LE(offset);
}

function findEocd(buf: Buffer): number {
  // EOCD is at least 22 bytes; comment up to 64k — scan back from end.
  const min = Math.max(0, buf.length - 22 - 0xffff);
  for (let i = buf.length - 22; i >= min; i -= 1) {
    if (readU32(buf, i) === SIG_EOCD) return i;
  }
  throw new Error("zip_eocd_not_found");
}

function normalizeZipPath(name: string): string {
  return name.replace(/\\/g, "/").replace(/^\/+/, "").replace(/^\.\/+/, "");
}

function shouldSkip(pathName: string): boolean {
  if (!pathName || pathName.endsWith("/")) return true;
  const lower = pathName.toLowerCase();
  return SKIP_PREFIX.some((re) => re.test(lower));
}

function decodeText(data: Buffer): string | undefined {
  // Reject obvious binary (NUL in first 512).
  const sample = data.subarray(0, Math.min(512, data.length));
  if (sample.includes(0)) return undefined;
  return data.toString("utf8");
}

/** Build a tiny valid ZIP (store method) for tests. */
export function buildStoredZipFixture(
  files: ReadonlyArray<{ path: string; content: string }>,
): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const f of files) {
    const name = Buffer.from(f.path, "utf8");
    const data = Buffer.from(f.content, "utf8");
    const local = Buffer.alloc(30 + name.length + data.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(METHOD_STORE, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(0, 14); // crc ignored for store fixture
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    name.copy(local, 30);
    data.copy(local, 30 + name.length);
    locals.push(local);

    const central = Buffer.alloc(46 + name.length);
    central.writeUInt32LE(SIG_CEN, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(METHOD_STORE, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0, 14);
    central.writeUInt32LE(0, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    name.copy(central, 46);
    centrals.push(central);
    offset += local.length;
  }
  const centralDir = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(SIG_EOCD, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(centralDir.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);
  return Buffer.concat([...locals, centralDir, eocd]);
}

export function extractZipToRepositoryTree(
  input: Buffer | Uint8Array,
  options?: CintZipExtractOptions,
): CintZipExtractResult {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  if (buf.length < 22) throw new Error("zip_too_small");
  const maxFiles = options?.maxFiles ?? 400;
  const maxFileBytes = options?.maxFileBytes ?? 1_500_000;
  const maxTotalBytes = options?.maxTotalBytes ?? 8_000_000;
  const repositoryId = (options?.repositoryId || "zip-upload").trim() || "zip-upload";

  const eocd = findEocd(buf);
  const totalEntries = readU16(buf, eocd + 10);
  const centralSize = readU32(buf, eocd + 12);
  const centralOffset = readU32(buf, eocd + 16);
  if (centralOffset + centralSize > buf.length) throw new Error("zip_central_truncated");

  const files: RepoFileSnapshot[] = [];
  let skipped = 0;
  let bytesRead = 0;
  let cursor = centralOffset;

  for (let i = 0; i < totalEntries; i += 1) {
    if (readU32(buf, cursor) !== SIG_CEN) throw new Error("zip_central_corrupt");
    const method = readU16(buf, cursor + 10);
    const compSize = readU32(buf, cursor + 20);
    const uncompSize = readU32(buf, cursor + 24);
    const nameLen = readU16(buf, cursor + 28);
    const extraLen = readU16(buf, cursor + 30);
    const commentLen = readU16(buf, cursor + 32);
    const localHeaderOffset = readU32(buf, cursor + 42);
    const name = normalizeZipPath(buf.subarray(cursor + 46, cursor + 46 + nameLen).toString("utf8"));
    cursor += 46 + nameLen + extraLen + commentLen;

    if (shouldSkip(name)) {
      skipped += 1;
      continue;
    }
    if (files.length >= maxFiles) {
      skipped += 1;
      continue;
    }
    if (uncompSize > maxFileBytes || bytesRead + uncompSize > maxTotalBytes) {
      skipped += 1;
      continue;
    }
    if (method !== METHOD_STORE && method !== METHOD_DEFLATE) {
      skipped += 1;
      continue;
    }

    if (readU32(buf, localHeaderOffset) !== 0x04034b50) {
      skipped += 1;
      continue;
    }
    const localNameLen = readU16(buf, localHeaderOffset + 26);
    const localExtraLen = readU16(buf, localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
    const compressed = buf.subarray(dataStart, dataStart + compSize);
    let raw: Buffer;
    try {
      raw =
        method === METHOD_STORE
          ? Buffer.from(compressed)
          : inflateRawSync(compressed);
    } catch {
      skipped += 1;
      continue;
    }
    bytesRead += raw.length;
    const content =
      TEXT_EXT.test(name) || !name.includes(".")
        ? decodeText(raw)
        : decodeText(raw);
    files.push({
      path: name,
      bytes: raw.length,
      content,
    });
  }

  if (!files.length) throw new Error("zip_no_extractable_files");

  return {
    tree: { id: repositoryId, files },
    skipped,
    bytesRead,
  };
}
