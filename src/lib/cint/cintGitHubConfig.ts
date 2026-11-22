/**
 * Code Intelligence GitHub OAuth — product-owned credentials.
 * Prefers CINT_GITHUB_*; falls back to factory GITHUB_* so one GitHub App can serve both
 * when callback URLs are registered for CI paths.
 */

export const CINT_GITHUB_NOT_CONFIGURED_CODE = "cint_github_not_configured" as const;

export function readCintGitHubClientId(): string | undefined {
  return (
    process.env.CINT_GITHUB_CLIENT_ID?.trim() ||
    process.env.GITHUB_CLIENT_ID?.trim() ||
    undefined
  );
}

export function readCintGitHubClientSecret(): string | undefined {
  return (
    process.env.CINT_GITHUB_CLIENT_SECRET?.trim() ||
    process.env.GITHUB_CLIENT_SECRET?.trim() ||
    undefined
  );
}

export function isCintGitHubOAuthConfigured(): boolean {
  return Boolean(readCintGitHubClientId() && readCintGitHubClientSecret());
}

export function cintGitHubCallbackBaseUrl(): string {
  return (
    process.env.CINT_GITHUB_CALLBACK_BASE_URL?.trim() ||
    process.env.INTEGRATIONS_CALLBACK_BASE_URL?.trim() ||
    process.env.VITE_APP_URL?.trim() ||
    "http://localhost:5173"
  );
}

/**
 * Single Redirect URI for all CI projects — project id is carried in signed OAuth state.
 * Uses the proven `/api/projects/$projectId/...` server route tree (literal "oauth" segment)
 * so TanStack Start always hits the API handler (flat `/api/cint/...` was SPA-404ing in dev).
 * Register exactly this URL on the GitHub OAuth App.
 */
export function cintGitHubOAuthRedirectUri(_projectId?: string): string {
  return `${cintGitHubCallbackBaseUrl()}/api/projects/oauth/cint/github/callback`;
}

export function cintGitHubNotConfiguredMessage(): string {
  return "Code Intelligence GitHub OAuth is not configured (set CINT_GITHUB_CLIENT_ID / CINT_GITHUB_CLIENT_SECRET).";
}

export function buildCintGitHubAuthorizeUrl(state: string, redirectUri: string): string {
  const clientId = readCintGitHubClientId();
  if (!clientId) throw new Error(cintGitHubNotConfiguredMessage());
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "read:user repo",
    state,
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export async function exchangeCintGitHubCode(
  code: string,
  redirectUri: string,
): Promise<{ access_token: string; token_type: string; scope: string }> {
  const clientId = readCintGitHubClientId();
  const clientSecret = readCintGitHubClientSecret();
  if (!clientId || !clientSecret) throw new Error(cintGitHubNotConfiguredMessage());

  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });
  if (!res.ok) throw new Error(`GitHub token exchange failed (${res.status})`);
  const data = (await res.json()) as {
    access_token?: string;
    token_type?: string;
    scope?: string;
    error?: string;
  };
  if (data.error || !data.access_token) {
    throw new Error(data.error ?? "GitHub did not return an access token");
  }
  return {
    access_token: data.access_token,
    token_type: data.token_type ?? "bearer",
    scope: data.scope ?? "",
  };
}
