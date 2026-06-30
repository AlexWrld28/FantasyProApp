import { createClient } from "@supabase/supabase-js";

export type BrowserSupabaseClient = ReturnType<typeof createClient<any, "public", any>>;

type SupabasePublicConfig = {
  supabaseAnonKey?: string;
  supabaseUrl?: string;
};

const browserSupabaseGlobal = globalThis as typeof globalThis & {
  __baalBrowserSupabaseClient?: BrowserSupabaseClient;
  __baalBrowserSupabaseConfigKey?: string;
  __baalBrowserSupabaseStorageKey?: string;
};

export function createBrowserSupabaseClient(config: SupabasePublicConfig = {}): BrowserSupabaseClient | null {
  const supabaseUrl = cleanConfigValue(config.supabaseUrl ?? process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseAnonKey =
    cleanConfigValue(
      config.supabaseAnonKey ??
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ) ?? "";

  if (!isValidHttpUrl(supabaseUrl) || !supabaseAnonKey) {
    return null;
  }

  const authStorageKey = supabaseAuthStorageKey(supabaseUrl);
  const configKey = `${supabaseUrl}:${supabaseAnonKey}`;
  if (
    browserSupabaseGlobal.__baalBrowserSupabaseClient &&
    browserSupabaseGlobal.__baalBrowserSupabaseConfigKey === configKey
  ) {
    return browserSupabaseGlobal.__baalBrowserSupabaseClient;
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      skipAutoInitialize: shouldSkipSupabaseAutoInitialize(),
      storageKey: authStorageKey
    }
  });
  browserSupabaseGlobal.__baalBrowserSupabaseClient = client;
  browserSupabaseGlobal.__baalBrowserSupabaseConfigKey = configKey;
  browserSupabaseGlobal.__baalBrowserSupabaseStorageKey = authStorageKey;
  return client;
}

export async function createRuntimeBrowserSupabaseClient(): Promise<BrowserSupabaseClient | null> {
  const staticClient = createBrowserSupabaseClient();
  if (staticClient) {
    return staticClient;
  }

  try {
    const response = await fetch("/api/config/supabase", {
      cache: "no-store"
    });

    if (!response.ok) {
      return null;
    }

    const config = (await response.json()) as SupabasePublicConfig;
    return createBrowserSupabaseClient(config);
  } catch {
    return null;
  }
}

function isValidHttpUrl(value: string | undefined): value is string {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function cleanConfigValue(value: string | undefined): string | undefined {
  const cleaned = value?.trim();
  return cleaned || undefined;
}

export function isInvalidRefreshTokenError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  return /invalid refresh token|refresh token not found/i.test(message);
}

export async function clearLocalSupabaseAuthSession(supabase?: BrowserSupabaseClient | null): Promise<void> {
  removeLocalSupabaseAuthStorage();

  try {
    await supabase?.auth.signOut({ scope: "local" });
  } catch {
    // The stored refresh token may be the thing signOut tries to read. The
    // direct localStorage removal above is the important recovery step.
  }

  removeLocalSupabaseAuthStorage();
}

function removeLocalSupabaseAuthStorage() {
  if (typeof window === "undefined") {
    return;
  }

  const storageKey = browserSupabaseGlobal.__baalBrowserSupabaseStorageKey;
  const keys = storageKey
    ? [storageKey, `${storageKey}-code-verifier`, `${storageKey}-user`]
    : ["supabase.auth.token"];

  for (const key of keys) {
    window.localStorage.removeItem(key);
  }
}

function supabaseAuthStorageKey(supabaseUrl: string): string {
  const baseUrl = new URL(supabaseUrl);
  return `sb-${baseUrl.hostname.split(".")[0]}-auth-token`;
}

function shouldSkipSupabaseAutoInitialize(): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  const url = new URL(window.location.href);
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
  const hasAuthCallback =
    url.searchParams.has("code") ||
    url.searchParams.has("error") ||
    hashParams.has("access_token") ||
    hashParams.has("refresh_token") ||
    hashParams.has("error");

  return !hasAuthCallback;
}
