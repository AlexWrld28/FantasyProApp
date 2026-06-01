import { getAdminContext } from "../../../../lib/admin-auth";
import { ensureRosterLeague, getRosterSnapshot } from "../../../../lib/roster-data";

export async function GET(request: Request) {
  const admin = await getAdminContext(request);
  if (admin.error) {
    return admin.error;
  }

  try {
    const snapshot = await getRosterSnapshot(admin.supabase);
    return Response.json(snapshot);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load roster admin." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const admin = await getAdminContext(request);
  if (admin.error) {
    return admin.error;
  }

  const body = (await request.json()) as {
    managerId?: unknown;
    playerId?: unknown;
    rosterSlot?: unknown;
  };
  const playerId = typeof body.playerId === "string" ? body.playerId : "";
  const managerId = typeof body.managerId === "string" && body.managerId ? body.managerId : null;
  const rosterSlot = typeof body.rosterSlot === "string" && body.rosterSlot ? body.rosterSlot : "BN";

  if (!playerId) {
    return Response.json({ error: "Select a player." }, { status: 400 });
  }

  try {
    const { data: authData, error: authError } = await admin.supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });

    if (authError) {
      return Response.json({ error: authError.message }, { status: 500 });
    }

    const users = authData.users.filter((user) => Boolean(user.email));
    const leagueId = await ensureRosterLeague(admin.supabase, users);

    const { error: removeError } = await admin.supabase.from("team_players").delete().eq("player_id", playerId);

    if (removeError) {
      return Response.json({ error: removeError.message }, { status: 500 });
    }

    if (managerId) {
      const { data: team, error: teamError } = await admin.supabase
        .from("teams")
        .select("id")
        .eq("league_id", leagueId)
        .eq("manager_id", managerId)
        .maybeSingle();

      if (teamError) {
        return Response.json({ error: teamError.message }, { status: 500 });
      }

      if (!team) {
        return Response.json({ error: "Selected manager does not have a roster team." }, { status: 400 });
      }

      const { error: assignError } = await admin.supabase.from("team_players").insert({
        player_id: playerId,
        roster_slot: rosterSlot,
        team_id: team.id
      });

      if (assignError) {
        return Response.json({ error: assignError.message }, { status: 500 });
      }
    }

    const snapshot = await getRosterSnapshot(admin.supabase);
    return Response.json(snapshot);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to update roster." }, { status: 500 });
  }
}
