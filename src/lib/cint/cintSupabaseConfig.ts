/**
 * Code Intelligence Supabase — product-owned, separate from Replica factory / FOC.
 *
 * Prefer CINT_SUPABASE_* on Vercel + local. Never reuse SUPABASE_URL from the
 * Replica host project for CI durable store.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const CINT_SUPABASE_NOT_CONFIGURED_CODE = "cint_supabase_not_configured" as const;

export type CintSupabaseMode = "service_role" | "publishable";

export function readCintSupabaseUrl(): string | undefined {
  return (
    process.env.CINT_SUPABASE_URL?.trim() ||
    process.env.CINT_SUPABASE_PROJECT_URL?.trim() ||
    undefined
  );
}

export function readCintSupabasePublishableKey(): string | undefined {
  return (
    process.env.CINT_SUPABASE_ANON_KEY?.trim() ||
    process.env.CINT_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    undefined
  );
}

export function readCintSupabaseServiceRoleKey(): string | undefined {
  return process.env.CINT_SUPABASE_SERVICE_ROLE_KEY?.trim() || undefined;
}

export function getCintSupabaseConfig(): {
  url: string;
  key: string;
  mode: CintSupabaseMode;
} | null {
  const url = readCintSupabaseUrl();
  if (!url) return null;

  const serviceKey = readCintSupabaseServiceRoleKey();
  if (serviceKey) {
    return { url, key: serviceKey, mode: "service_role" };
  }

  const publishable = readCintSupabasePublishableKey();
  if (publishable) {
    return { url, key: publishable, mode: "publishable" };
  }

  return null;
}

export function isCintSupabaseConfigured(): boolean {
  return getCintSupabaseConfig() != null;
}

export function cintSupabaseNotConfiguredMessage(): string {
  if (readCintSupabaseUrl() && !readCintSupabaseServiceRoleKey() && !readCintSupabasePublishableKey()) {
    return "Code Intelligence Supabase URL is set but no key (set CINT_SUPABASE_SERVICE_ROLE_KEY or CINT_SUPABASE_ANON_KEY).";
  }
  return "Code Intelligence Supabase is not configured (set CINT_SUPABASE_URL + CINT_SUPABASE_SERVICE_ROLE_KEY).";
}

/** Server client for CI entity CRUD — service role preferred. */
export function resolveCintSupabase(): SupabaseClient {
  const config = getCintSupabaseConfig();
  if (!config) {
    throw new Error(cintSupabaseNotConfiguredMessage());
  }
  return createClient(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function resolveCintSupabaseServiceRole(): SupabaseClient {
  const url = readCintSupabaseUrl();
  const serviceKey = readCintSupabaseServiceRoleKey();
  if (!url || !serviceKey) {
    throw new Error(
      "CINT_SUPABASE_SERVICE_ROLE_KEY is required for privileged CI store operations.",
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
