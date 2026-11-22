/**
 * Generic published product install — top-level /deploy document without FOC phone chrome.
 * FOC keeps `focPhoneDocument.ts` / `installFocPhoneDocument`.
 */

import {
  detectPublishedProductKind,
  type PublishedProductKind,
} from "@/lib/deploy/publishedProductDetect";

const INSTALLED = "__publishedProductDocumentInstalled";

function escapeTitle(title: string): string {
  return title.replace(/[<>&"]/g, "");
}

function defaultTitleForKind(kind: PublishedProductKind): string {
  if (kind === "code_intelligence") return "Code Intelligence";
  return "Live app";
}

function productSurfaceAttr(kind: PublishedProductKind): string {
  if (kind === "code_intelligence") return "code_intelligence";
  return "published";
}

/** Alias used by unit tests / call sites — same as detectPublishedProductKind. */
export function resolveDeployLiveKind(html: string, metadata?: unknown): PublishedProductKind {
  return detectPublishedProductKind(html, metadata);
}

export function deployLiveDocumentTitle(
  projectName: string,
  kind: PublishedProductKind,
): string {
  const name = (projectName || "App").trim() || "App";
  if (kind === "foc") return `${name} — Driver Assist Co-Pilot`;
  if (kind === "code_intelligence") return `${name} — Code Intelligence`;
  return `${name} — Live app`;
}

/** Prepare srcdoc HTML as a standalone published product (not Replica preview chrome). */
export function preparePublishedProductDocumentHtml(
  srcDoc: string,
  options?: {
    title?: string;
    kind?: PublishedProductKind;
    /** Explicit surface attr override (tests / callers). */
    productSurface?: string;
  },
): string {
  const kind = options?.kind ?? "generic";
  let html = srcDoc;
  const viewport = "width=device-width, initial-scale=1, viewport-fit=cover";
  if (/<meta\s+name=["']viewport["']/i.test(html)) {
    html = html.replace(
      /(<meta\s+name=["']viewport["'][^>]*content=["'])[^"']*(["'])/i,
      `$1${viewport}$2`,
    );
  } else {
    html = html.replace(/<head([^>]*)>/i, `<head$1><meta name="viewport" content="${viewport}"/>`);
  }

  const safeTitle = escapeTitle(
    (options?.title ?? "").trim() || defaultTitleForKind(kind),
  );
  if (/<title[\s>]/i.test(html)) {
    html = html.replace(/<title[^>]*>[\s\S]*?<\/title>/i, `<title>${safeTitle}</title>`);
  } else {
    html = html.replace(/<head([^>]*)>/i, `<head$1><title>${safeTitle}</title>`);
  }

  const surface = options?.productSurface || productSurfaceAttr(kind);
  if (!/data-product-surface=/i.test(html)) {
    html = html.replace(
      /<html([^>]*)>/i,
      `<html$1 data-product-surface="${surface}" data-experience-plane="product_deploy">`,
    );
  }

  return html;
}

/** Replace the host document with the published product (CI / websites / generic). */
export function installPublishedProductDocument(
  srcDoc: string,
  options?: { title?: string; kind?: PublishedProductKind; productSurface?: string },
): void {
  if (typeof document === "undefined" || typeof window === "undefined") return;
  const host = window as Window & { [INSTALLED]?: boolean };
  if (host[INSTALLED]) return;
  host[INSTALLED] = true;
  const html = preparePublishedProductDocumentHtml(srcDoc, options);
  document.open();
  document.write(html);
  document.close();
}
