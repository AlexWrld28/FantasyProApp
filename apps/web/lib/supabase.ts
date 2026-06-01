import { createClient } from "@supabase/supabase-js";

export type BrowserSupabaseClient = ReturnType<typeof createClient<any, "public", any>>;

type SupabasePublicConfig = {
  supabaseAnonKey?: string;
  supabaseUrl?: string;
};

export function createBrowserSupabaseClient(config: SupabasePublicConfig = {}): BrowserSupabaseClient | null {
  const supabaseUrl = config.supabaseUrl ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    config.supabaseAnonKey ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!isValidHttpUrl(supabaseUrl) || !supabaseAnonKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey);
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
