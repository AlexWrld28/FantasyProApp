import { getAuthenticatedContext } from "../../../../lib/admin-auth";

type ProfileRow = {
  avatar_url: string | null;
  display_name: string;
  id: string;
};

export async function GET(request: Request) {
  const context = await getAuthenticatedContext(request);
  if (context.error) {
    return context.error;
  }

  const { data: authData, error: authError } = await context.supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000
  });

  if (authError) {
    return Response.json({ error: authError.message }, { status: 500 });
  }

  const userIds = authData.users.map((user) => user.id);
  let profilesById = new Map<string, ProfileRow>();

  if (userIds.length) {
    const { data: profiles } = await context.supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", userIds);

    profilesById = new Map(((profiles ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]));
  }

  const managers = authData.users
    .filter((user) => Boolean(user.email))
    .map((user) => {
      const profile = profilesById.get(user.id);
      const displayName =
        profile?.display_name ||
        getStringMetadata(user.user_metadata, "display_name") ||
        user.email?.split("@")[0] ||
        "Manager";

      return {
        avatarUrl: profile?.avatar_url ?? getStringMetadata(user.user_metadata, "avatar_url") ?? null,
        displayName,
        email: user.email,
        id: user.id,
        initials: initialsFor(displayName),
        lastSignInAt: user.last_sign_in_at,
        presence: user.id === context.user.id ? "online" : user.last_sign_in_at ? "away" : "offline",
        team: getStringMetadata(user.user_metadata, "team_name") ?? "League Manager"
      };
    })
    .sort((first, second) => first.displayName.localeCompare(second.displayName));

  return Response.json({ managers });
}

function getStringMetadata(metadata: Record<string, unknown>, key: string): string | null {
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function initialsFor(value: string): string {
  const parts = value
    .replace(/@.*/, "")
    .split(/\s+|[._-]/)
    .filter(Boolean);

  return (parts[0]?.[0] ?? "M").concat(parts[1]?.[0] ?? "").toUpperCase();
}
