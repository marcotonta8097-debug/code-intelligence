import { useEffect, useState, type ReactNode } from "react";
import { FocDeployStatusShell, FocPhoneLiveDocument } from "@/components/deploy/FocPhoneLiveDocument";
import { buildPreviewSrcDoc } from "@/lib/projectPreview";
import {
  detectPublishedProductKind,
  type PublishedProductKind,
} from "@/lib/deploy/publishedProductDetect";
import {
  deployLiveDocumentTitle,
  installPublishedProductDocument,
} from "@/lib/deploy/publishedProductDocument";

type PublishedProductLiveDocumentProps = {
  projectId: string;
  html: string;
  css: string;
  js: string | null;
  metadata?: unknown;
  deploymentSlug?: string | null;
  title: string;
};

function hostOriginBaseHref(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return /^https?:/i.test(window.location.origin) ? `${window.location.origin}/` : undefined;
}

/** Document title for /deploy — FOC keeps co-pilot naming; CI/other stay product titles. */
export function deployStatusTitle(projectName: string, html: string, metadata?: unknown): string {
  return deployLiveDocumentTitle(projectName, detectPublishedProductKind(html, metadata));
}

/**
 * Published /deploy document.
 * FOC → phone co-pilot install. CI / other → neutral product document (not FOC chrome).
 */
export function PublishedProductLiveDocument({
  projectId,
  html,
  css,
  js,
  metadata,
  deploymentSlug,
  title,
}: PublishedProductLiveDocumentProps) {
  const kind = detectPublishedProductKind(html, metadata);

  if (kind === "foc") {
    return (
      <FocPhoneLiveDocument
        projectId={projectId}
        html={html}
        css={css}
        js={js}
        metadata={metadata}
        deploymentSlug={deploymentSlug}
        title={title}
      />
    );
  }

  return (
    <GenericPublishedLiveDocument
      projectId={projectId}
      html={html}
      css={css}
      js={js}
      metadata={metadata}
      deploymentSlug={deploymentSlug}
      title={title}
      kind={kind}
    />
  );
}

function GenericPublishedLiveDocument({
  projectId,
  html,
  css,
  js,
  metadata,
  deploymentSlug,
  title,
  kind,
}: PublishedProductLiveDocumentProps & { kind: PublishedProductKind }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    try {
      const srcDoc = buildPreviewSrcDoc(html, css, js, {
        metadata,
        previewAudience: "visitor",
        replicaProjectId: projectId,
        deploymentSlug,
        baseHref: hostOriginBaseHref(),
      });
      installPublishedProductDocument(srcDoc, { title, kind });
    } catch {
      setFailed(true);
    }
  }, [css, deploymentSlug, html, js, kind, metadata, projectId, title]);

  if (failed) {
    return (
      <PublishedDeployStatusShell kind={kind}>
        <p className="text-lg font-semibold text-foreground">Couldn’t open the live app</p>
        <p className="mt-2 text-sm text-muted-foreground">Reload this link and try again.</p>
        <button
          type="button"
          className="mt-5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          onClick={() => window.location.reload()}
        >
          Reload
        </button>
      </PublishedDeployStatusShell>
    );
  }

  return (
    <PublishedDeployStatusShell kind={kind}>
      <p className="text-sm text-muted-foreground">Opening live app…</p>
    </PublishedDeployStatusShell>
  );
}

export function PublishedDeployStatusShell({
  children,
  kind = "generic",
}: {
  children: ReactNode;
  kind?: PublishedProductKind;
}) {
  const surface = kind === "code_intelligence" ? "code_intelligence" : "published";
  return (
    <div
      className="fixed inset-0 flex min-h-[100dvh] w-full items-center justify-center bg-background px-6 text-center text-foreground"
      data-product-surface={surface}
      data-experience-plane="product_deploy"
      data-testid="deploy-live-shell"
    >
      <div className="max-w-sm">{children}</div>
    </div>
  );
}

/** Loading/error shell before HTML kind is known — not FOC-stamped. */
export function DeployLiveStatusShell({ children }: { children: ReactNode }) {
  return <PublishedDeployStatusShell>{children}</PublishedDeployStatusShell>;
}

/** @deprecated Prefer DeployLiveStatusShell — kept for call sites that imported FOC shell by mistake. */
export { FocDeployStatusShell };
