import { createHmac, randomBytes } from "node:crypto";

type CintOAuthStatePayload = {
  projectId: string;
  provider: "github";
  nonce: string;
  returnPath?: string;
};

function stateSecret(): string {
  const secret =
    process.env.CINT_OAUTH_STATE_SECRET?.trim() ||
    process.env.INTEGRATIONS_OAUTH_STATE_SECRET?.trim() ||
    process.env.INTEGRATIONS_ENCRYPTION_KEY?.trim() ||
    process.env.CINT_SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!secret) throw new Error("CI OAuth state secret is not configured");
  return secret;
}

export function signCintGitHubOAuthState(
  projectId: string,
  returnPath?: string,
): string {
  const payload: CintOAuthStatePayload = {
    projectId,
    provider: "github",
    nonce: randomBytes(12).toString("hex"),
    returnPath,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", stateSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyCintGitHubOAuthState(state: string): CintOAuthStatePayload {
  const [body, sig] = state.split(".");
  if (!body || !sig) throw new Error("Invalid OAuth state");
  const expectedSig = createHmac("sha256", stateSecret()).update(body).digest("base64url");
  if (sig !== expectedSig) throw new Error("OAuth state signature mismatch");
  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as CintOAuthStatePayload;
  if (payload.provider !== "github" || !payload.projectId) {
    throw new Error("OAuth state provider mismatch");
  }
  return payload;
}
