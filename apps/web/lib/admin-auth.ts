import { createClient } from "@supabase/supabase-js";

type AdminSupabaseClient = ReturnType<typeof createClient<any, "public", any>>;

export type AdminContext =
  | {
      error: Response;
      supabase: null;
      user: null;
    }
  | {
      error: null;
      supabase: AdminSupabaseClient;
      user: {
        email?: string;
        id: string;
      };
    };

export type AuthenticatedContext =
  | {
      error: Response;
      supabase: null;
      user: null;
    }
  | {
      error: null;
      supabase: AdminSupabaseClient;
      user: {
        email?: string;
        id: string;
      };
    };

export async function getAuthenticatedContext(request: Request): Promise<AuthenticatedContext> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      error: Response.json({ error: "Supabase server credentials are not configured." }, { status: 500 }),
      supabase: null,
      user: null
    };
  }

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return {
      error: Response.json({ error: "Missing auth token." }, { status: 401 }),
      supabase: null,
      user: null
    };
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const {
    data: { user },
    error
  } = await supabase.auth.getUser(token);

  if (error || !user?.email) {
    return {
      error: Response.json({ error: "Invalid auth token." }, { status: 401 }),
      supabase: null,
      user: null
    };
  }

  return {
    error: null,
    supabase,
    user: {
      email: user.email,
      id: user.id
    }
  };
}

export async function getAdminContext(request: Request): Promise<AdminContext> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminEmails = new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      error: Response.json({ error: "Supabase admin credentials are not configured." }, { status: 500 }),
      supabase: null,
      user: null
    };
  }

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return {
      error: Response.json({ error: "Missing auth token." }, { status: 401 }),
      supabase: null,
      user: null
    };
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const {
    data: { user },
    error
  } = await supabase.auth.getUser(token);

  if (error || !user?.email) {
    return {
      error: Response.json({ error: "Invalid auth token." }, { status: 401 }),
      supabase: null,
      user: null
    };
  }

  if (!adminEmails.has(user.email.toLowerCase())) {
    return {
      error: Response.json(
        {
          email: user.email,
          error: "Admin access required.",
          hint: "Add this email to ADMIN_EMAILS in Vercel and redeploy."
        },
        { status: 403 }
      ),
      supabase: null,
      user: null
    };
  }

  return {
    error: null,
    supabase,
    user: {
      email: user.email,
      id: user.id
    }
  };
}
