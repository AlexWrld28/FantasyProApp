import type { User } from "@supabase/supabase-js";

type SupabaseAdminClient = any;

type PlayerRow = {
  id: string;
  external_id: string | null;
  full_name: string;
  metadata: Record<string, unknown>;
  position: string | null;
  team: string | null;
};

type TeamPlayerRow = {
  player_id: string;
  roster_slot: string;
  team_id: string;
};

type TeamRow = {
  faab_remaining: number;
  id: string;
  manager_id: string | null;
  name: string;
  record_losses: number;
  record_wins: number;
  waiver_priority: number;
};

export type RosterSnapshot = Awaited<ReturnType<typeof getRosterSnapshot>>;

type ProfileRow = {
  avatar_url: string | null;
  display_name: string;
  id: string;
};

export async function getRosterSnapshot(supabase: SupabaseAdminClient) {
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000
  });

  if (authError) {
    throw new Error(authError.message);
  }

  const users = authData.users.filter((user: User) => Boolean(user.email));
  const leagueId = await ensureRosterLeague(supabase, users);
  const userIds = users.map((user: User) => user.id);

  const [{ data: profiles, error: profileError }, { data: teams, error: teamError }, { data: players, error: playerError }] =
    await Promise.all([
      supabase.from("profiles").select("id, display_name, avatar_url").in("id", userIds),
      supabase
        .from("teams")
        .select("id, manager_id, name, record_wins, record_losses, waiver_priority, faab_remaining")
        .eq("league_id", leagueId)
        .in("manager_id", userIds),
      supabase.from("players").select("id, external_id, full_name, team, position, metadata").order("full_name")
    ]);

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (teamError) {
    throw new Error(teamError.message);
  }

  if (playerError) {
    throw new Error(playerError.message);
  }

  const teamRows = (teams ?? []) as TeamRow[];
  const playerRows = (players ?? []) as PlayerRow[];
  const teamIds = teamRows.map((team) => team.id);
  const { data: assignments, error: assignmentError } = teamIds.length
    ? await supabase.from("team_players").select("team_id, player_id, roster_slot").in("team_id", teamIds)
    : { data: [], error: null };

  if (assignmentError) {
    throw new Error(assignmentError.message);
  }

  const profilesById = new Map(((profiles ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]));
  const playersById = new Map(playerRows.map((player) => [player.id, player]));
  const assignmentsByTeam = groupBy((assignments ?? []) as TeamPlayerRow[], "team_id");
  const assignedPlayerIds = new Set(((assignments ?? []) as TeamPlayerRow[]).map((assignment) => assignment.player_id));

  return {
    freeAgents: playerRows
      .filter((player) => !assignedPlayerIds.has(player.id))
      .map((player) => formatRosterPlayer(player, "FA")),
    leagueId,
    teams: teamRows
      .map((team) => {
        const profile = team.manager_id ? profilesById.get(team.manager_id) : null;
        return {
          faabRemaining: team.faab_remaining,
          id: team.id,
          manager: profile?.display_name || "Manager",
          managerId: team.manager_id,
          name: team.name,
          record: `${team.record_wins}-${team.record_losses}`,
          roster: (assignmentsByTeam.get(team.id) ?? [])
            .map((assignment) => {
              const player = playersById.get(assignment.player_id);
              return player ? formatRosterPlayer(player, assignment.roster_slot) : null;
            })
            .filter(Boolean),
          waiverPriority: team.waiver_priority
        };
      })
      .sort((first, second) => first.name.localeCompare(second.name)),
    users: users.map((user: User) => {
      const profile = profilesById.get(user.id);
      return {
        displayName: profile?.display_name || user.user_metadata?.display_name || user.email?.split("@")[0] || "Manager",
        email: user.email,
        id: user.id
      };
    })
  };
}

export async function findUserTeamId(supabase: SupabaseAdminClient, userId: string, leagueId: string) {
  const team = await findUserTeam(supabase, userId, leagueId);
  return team?.id ?? null;
}

export async function findUserTeam(supabase: SupabaseAdminClient, userId: string, leagueId: string) {
  const { data: team, error } = await supabase
    .from("teams")
    .select("id, faab_remaining")
    .eq("league_id", leagueId)
    .eq("manager_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return typeof team?.id === "string"
    ? {
        faabRemaining: typeof team.faab_remaining === "number" ? team.faab_remaining : 0,
        id: team.id
      }
    : null;
}

export async function ensureRosterLeague(supabase: SupabaseAdminClient, users: User[]) {
  const primaryUser = users[0];
  if (!primaryUser) {
    throw new Error("No authenticated users exist.");
  }

  await Promise.all(users.map((user) => ensureProfile(supabase, user)));

  const { data: existingLeague, error: existingError } = await supabase
    .from("leagues")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  let leagueId = existingLeague?.id as string | undefined;

  if (!leagueId) {
    const seasonYear = new Date().getFullYear();
    const { data: createdLeague, error: createError } = await supabase
      .from("leagues")
      .insert({
        created_by: primaryUser.id,
        invite_code: `fantasypro-${seasonYear}`,
        name: "FantasyPro League",
        season_year: seasonYear
      })
      .select("id")
      .single();

    if (createError) {
      throw new Error(createError.message);
    }

    leagueId = createdLeague.id;
  }

  await Promise.all(users.map((user) => ensureMembershipAndTeam(supabase, leagueId!, user)));

  return leagueId;
}

export function formatRosterPlayer(player: PlayerRow, rosterSlot: string) {
  const metadata = player.metadata ?? {};
  return {
    age: getNumberMetadata(metadata, "age"),
    id: player.id,
    imageUrl: getStringMetadata(metadata, "image_url"),
    keeperGrade: getNumberMetadata(metadata, "keeper_grade") ?? 70,
    name: player.full_name,
    nflTeam: player.team ?? "FA",
    note: getStringMetadata(metadata, "note") ?? "",
    opponent: getStringMetadata(metadata, "opponent") ?? "TBD",
    position: player.position ?? "FLEX",
    projectedPoints: getNumberMetadata(metadata, "projected_points") ?? 0,
    risk: getNumberMetadata(metadata, "risk") ?? 30,
    rosterSlot,
    stats: getStatsMetadata(metadata),
    status: rosterSlot === "FA" ? "free-agent" : rosterSlot === "BN" ? "bench" : "active",
    team: player.team ?? "FA",
    tradeValue: getNumberMetadata(metadata, "trade_value") ?? 50,
    trend: getStringMetadata(metadata, "trend") ?? "steady"
  };
}

async function ensureProfile(supabase: SupabaseAdminClient, user: User) {
  const displayName = user.user_metadata?.display_name || user.email?.split("@")[0] || "Manager";
  const { error } = await supabase.from("profiles").upsert({
    avatar_url: user.user_metadata?.avatar_url ?? null,
    display_name: displayName,
    id: user.id
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function ensureMembershipAndTeam(supabase: SupabaseAdminClient, leagueId: string, user: User) {
  const { error: membershipError } = await supabase.from("league_members").upsert({
    league_id: leagueId,
    role: "manager",
    user_id: user.id
  });

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  const { data: team, error: teamLookupError } = await supabase
    .from("teams")
    .select("id")
    .eq("league_id", leagueId)
    .eq("manager_id", user.id)
    .maybeSingle();

  if (teamLookupError) {
    throw new Error(teamLookupError.message);
  }

  if (!team) {
    const displayName = user.user_metadata?.display_name || user.email?.split("@")[0] || "Manager";
    const { error: teamCreateError } = await supabase.from("teams").insert({
      league_id: leagueId,
      manager_id: user.id,
      name: `${displayName}'s Roster`
    });

    if (teamCreateError) {
      throw new Error(teamCreateError.message);
    }
  }
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

function getNumberMetadata(metadata: Record<string, unknown>, key: string): number | null {
  const value = metadata[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getStringMetadata(metadata: Record<string, unknown>, key: string): string | null {
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getStatsMetadata(metadata: Record<string, unknown>) {
  const value = metadata.stats;
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
