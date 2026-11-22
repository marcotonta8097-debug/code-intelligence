/**
 * CI durable file KV — survives process restart when CINT Supabase is absent.
 * Used as fallback/backup for GitHub OAuth tokens and upload ledger.
 * Encrypts with AES-256-GCM when a state/secret key is available.
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export type CintDurableBackend = "supabase" | "file_encrypted" | "file_plaintext" | "memory";

const ROOT = path.join(process.cwd(), ".data", "cint");

function secretMaterial(): string | null {
  return (
    process.env.CINT_OAUTH_STATE_SECRET?.trim() ||
    process.env.INTEGRATIONS_OAUTH_STATE_SECRET?.trim() ||
    process.env.INTEGRATIONS_ENCRYPTION_KEY?.trim() ||
    process.env.CINT_SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    null
  );
}

function ensureRoot(): void {
  if (!existsSync(ROOT)) mkdirSync(ROOT, { recursive: true });
}

function filePath(namespace: string): string {
  const safe = namespace.replace(/[^\w.-]+/g, "_") || "default";
  return path.join(ROOT, `${safe}.json`);
}

function deriveKey(secret: string): Buffer {
  return scryptSync(secret, "cint-durable-kv-v1", 32);
}

function encryptPayload(plaintext: string, secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", deriveKey(secret), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString("base64url")}.${tag.toString("base64url")}.${enc.toString("base64url")}`;
}

function decryptPayload(blob: string, secret: string): string {
  const [ver, ivB64, tagB64, dataB64] = blob.split(".");
  if (ver !== "v1" || !ivB64 || !tagB64 || !dataB64) throw new Error("cint_durable_corrupt");
  const decipher = createDecipheriv("aes-256-gcm", deriveKey(secret), Buffer.from(ivB64, "base64url"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

function readMap(namespace: string): Record<string, unknown> {
  ensureRoot();
  const fp = filePath(namespace);
  if (!existsSync(fp)) return {};
  try {
    const raw = readFileSync(fp, "utf8");
    const parsed = JSON.parse(raw) as { enc?: string; data?: Record<string, unknown> };
    if (parsed.enc) {
      const secret = secretMaterial();
      if (!secret) return {};
      return JSON.parse(decryptPayload(parsed.enc, secret)) as Record<string, unknown>;
    }
    return (parsed.data && typeof parsed.data === "object" ? parsed.data : {}) as Record<
      string,
      unknown
    >;
  } catch {
    return {};
  }
}

function writeMap(namespace: string, map: Record<string, unknown>): CintDurableBackend {
  ensureRoot();
  const fp = filePath(namespace);
  const secret = secretMaterial();
  const json = JSON.stringify(map);
  if (secret) {
    writeFileSync(fp, JSON.stringify({ version: 1, enc: encryptPayload(json, secret) }, null, 0), "utf8");
    return "file_encrypted";
  }
  writeFileSync(fp, JSON.stringify({ version: 1, data: map }, null, 2), "utf8");
  return "file_plaintext";
}

export function cintDurableFileMode(): Exclude<CintDurableBackend, "supabase" | "memory"> {
  return secretMaterial() ? "file_encrypted" : "file_plaintext";
}

export function cintDurablePut(
  namespace: string,
  key: string,
  value: unknown,
): CintDurableBackend {
  const map = readMap(namespace);
  map[key] = value;
  return writeMap(namespace, map);
}

export function cintDurableGet<T = unknown>(namespace: string, key: string): T | null {
  const map = readMap(namespace);
  const v = map[key];
  return v == null ? null : (v as T);
}

export function cintDurableDelete(namespace: string, key: string): void {
  const map = readMap(namespace);
  if (!(key in map)) return;
  delete map[key];
  writeMap(namespace, map);
}

export function cintDurableList<T = unknown>(namespace: string): T[] {
  return Object.values(readMap(namespace)) as T[];
}
