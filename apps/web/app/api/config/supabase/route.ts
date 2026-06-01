export function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!isValidHttpUrl(supabaseUrl) || !supabaseAnonKey) {
    return Response.json(
      {
        configured: false,
        hasKey: Boolean(supabaseAnonKey),
        hasUrl: Boolean(supabaseUrl),
        urlIsValid: isValidHttpUrl(supabaseUrl)
      },
      { status: 500 }
    );
  }

  return Response.json({
    configured: true,
    supabaseAnonKey,
    supabaseUrl
  });
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
