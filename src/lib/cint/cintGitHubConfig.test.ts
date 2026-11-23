import { afterEach, describe, expect, it } from "vitest";
import {
  isCintGitHubOAuthConfigured,
  normalizeCintOAuthReturnPath,
  readCintGitHubClientId,
  readCintGitHubClientSecret,
} from "@/lib/cint/cintGitHubConfig";

describe("CINT GitHub credential governance (Tier 1)", () => {
  const prevId = process.env.CINT_GITHUB_CLIENT_ID;
  const prevSecret = process.env.CINT_GITHUB_CLIENT_SECRET;
  const prevFactoryId = process.env.GITHUB_CLIENT_ID;
  const prevFactorySecret = process.env.GITHUB_CLIENT_SECRET;

  afterEach(() => {
    process.env.CINT_GITHUB_CLIENT_ID = prevId;
    process.env.CINT_GITHUB_CLIENT_SECRET = prevSecret;
    process.env.GITHUB_CLIENT_ID = prevFactoryId;
    process.env.GITHUB_CLIENT_SECRET = prevFactorySecret;
  });

  it("does not fall back to factory GITHUB_* credentials", () => {
    delete process.env.CINT_GITHUB_CLIENT_ID;
    delete process.env.CINT_GITHUB_CLIENT_SECRET;
    process.env.GITHUB_CLIENT_ID = "factory-id";
    process.env.GITHUB_CLIENT_SECRET = "factory-secret";
    expect(readCintGitHubClientId()).toBeUndefined();
    expect(readCintGitHubClientSecret()).toBeUndefined();
    expect(isCintGitHubOAuthConfigured()).toBe(false);
  });

  it("uses CINT_GITHUB_* only when set", () => {
    process.env.CINT_GITHUB_CLIENT_ID = "cint-id";
    process.env.CINT_GITHUB_CLIENT_SECRET = "cint-secret";
    expect(readCintGitHubClientId()).toBe("cint-id");
    expect(isCintGitHubOAuthConfigured()).toBe(true);
  });

  it("normalizes OAuth return to project workspace (not /deploy/{uuid})", () => {
    const id = "19a37ed5-28fd-4b9e-94fa-0bbfc8c0cfb0";
    expect(normalizeCintOAuthReturnPath(id)).toBe(`/projects/${id}?tab=generator`);
    expect(normalizeCintOAuthReturnPath(id, `/projects/${id}?tab=generator`)).toBe(
      `/projects/${id}?tab=generator`,
    );
    expect(normalizeCintOAuthReturnPath(id, `/preview/${id}`)).toBe(`/projects/${id}?tab=generator`);
    expect(normalizeCintOAuthReturnPath(id, `/deploy/${id}`)).toBe(`/projects/${id}?tab=generator`);
    expect(normalizeCintOAuthReturnPath(id, `/deploy/my-cint-app?x=1`)).toBe(`/deploy/my-cint-app?x=1`);
  });

  it("registers stable OAuth callback path", async () => {
    const { cintGitHubOAuthRedirectUri, CINT_GITHUB_OAUTH_CALLBACK_PATH } = await import(
      "@/lib/cint/cintGitHubConfig"
    );
    const uri = cintGitHubOAuthRedirectUri();
    expect(uri).toMatch(/\/api\/cint\/github\/callback$/);
    expect(CINT_GITHUB_OAUTH_CALLBACK_PATH).toBe("/api/cint/github/callback");
  });

  it("honors full redirect URI override for legacy GitHub App registrations", async () => {
    const prev = process.env.CINT_GITHUB_OAUTH_REDIRECT_URI;
    process.env.CINT_GITHUB_OAUTH_REDIRECT_URI =
      "http://localhost:5173/api/projects/oauth/cint/github/callback";
    try {
      const { cintGitHubOAuthRedirectUri } = await import("@/lib/cint/cintGitHubConfig");
      expect(cintGitHubOAuthRedirectUri()).toBe(
        "http://localhost:5173/api/projects/oauth/cint/github/callback",
      );
    } finally {
      if (prev === undefined) delete process.env.CINT_GITHUB_OAUTH_REDIRECT_URI;
      else process.env.CINT_GITHUB_OAUTH_REDIRECT_URI = prev;
    }
  });
});
