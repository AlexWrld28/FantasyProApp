import { getAdminContext } from "../../../../lib/admin-auth";

type AdminProfileRow = {
  avatar_url: string | null;
  created_at: string;
  display_name: string;
  id: string;
  updated_at: string;
};

type AdminMembershipRow = {
  joined_at: string;
  leagues: unknown;
  role: string;
  user_id: string;
};

type AdminTeamRow = {
  faab_remaining: number;
  leagues: unknown;
  manager_id: string;
  name: string;
  record_losses: number;
  record_wins: number;
};

export async function GET(request: Request) {
  const admin = await getAdminContext(request);
  if (admin.error) {
    return admin.error;
  }

  const { data: authData, error: authError } = await admin.supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000
  });

  if (authError) {
    return Response.json({ error: authError.message }, { status: 500 });
  }

  const userIds = authData.users.map((user) => user.id);
  const { data: profiles, error: profileError } = await admin.supabase
    .from("profiles")
    .select("id, display_name, avatar_url, created_at, updated_at")
    .in("id", userIds);

  if (profileError) {
    return Response.json({ error: profileError.message }, { status: 500 });
  }

  const { data: memberships, error: membershipError } = await admin.supabase
    .from("league_members")
    .select("user_id, role, joined_at, leagues(name, season_year)")
    .in("user_id", userIds);

  if (membershipError) {
    return Response.json({ error: membershipError.message }, { status: 500 });
  }

  const { data: teams, error: teamError } = await admin.supabase
    .from("teams")
    .select("manager_id, name, record_wins, record_losses, faab_remaining, leagues(name, season_year)")
    .in("manager_id", userIds);

  if (teamError) {
    return Response.json({ error: teamError.message }, { status: 500 });
  }

  const profileRows = (profiles ?? []) as AdminProfileRow[];
  const membershipRows = (memberships ?? []) as AdminMembershipRow[];
  const teamRows = (teams ?? []) as AdminTeamRow[];
  const profilesById = new Map(profileRows.map((profile) => [profile.id, profile]));
  const membershipsByUser = groupBy(membershipRows, "user_id");
  const teamsByManager = groupBy(teamRows, "manager_id");

  const users = authData.users.map((user) => ({
    appMetadata: user.app_metadata,
    aud: user.aud,
    confirmedAt: user.confirmed_at,
    createdAt: user.created_at,
    email: user.email,
    id: user.id,
    lastSignInAt: user.last_sign_in_at,
    memberships: membershipsByUser.get(user.id) ?? [],
    phone: user.phone,
    profile: profilesById.get(user.id) ?? null,
    teams: teamsByManager.get(user.id) ?? [],
    updatedAt: user.updated_at,
    userMetadata: user.user_metadata
  }));

  return Response.json({ users });
}

function groupBy<T extends Record<string, unknown>>(rows: T[], key: keyof T): Map<string, T[]> {
  const groups = new Map<string, T[]>();

  for (const row of rows) {
    const value = row[key];
    if (typeof value !== "string") {
      continue;
    }

    groups.set(value, [...(groups.get(value) ?? []), row]);
  }

  return groups;
}
