import { getAuthenticatedContext } from "../../../lib/admin-auth";
import { findUserTeamId, getRosterSnapshot } from "../../../lib/roster-data";

export async function GET(request: Request) {
  const context = await getAuthenticatedContext(request);
  if (context.error) {
    return context.error;
  }

  try {
    const snapshot = await getRosterSnapshot(context.supabase);
    return Response.json(snapshot);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load rosters." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const context = await getAuthenticatedContext(request);
  if (context.error) {
    return context.error;
  }

  const body = (await request.json()) as {
    action?: unknown;
    playerId?: unknown;
    rosterSlot?: unknown;
  };
  const action = typeof body.action === "string" ? body.action : "";
  const playerId = typeof body.playerId === "string" ? body.playerId : "";
  const rosterSlot = typeof body.rosterSlot === "string" && body.rosterSlot ? body.rosterSlot : "BN";

  if (action !== "claim") {
    return Response.json({ error: "Unsupported roster action." }, { status: 400 });
  }

  if (!playerId) {
    return Response.json({ error: "Select a player to acquire." }, { status: 400 });
  }

  try {
    const snapshot = await getRosterSnapshot(context.supabase);
    const alreadyRostered = snapshot.teams.some((team) => team.roster.some((player) => player?.id === playerId));

    if (alreadyRostered) {
      return Response.json({ error: "That player is already rostered." }, { status: 409 });
    }

    const leagueId = snapshot.leagueId;
    if (!leagueId) {
      return Response.json({ error: "League roster was not found." }, { status: 404 });
    }

    const userId = context.user.id;
    const teamId = await findUserTeamId(context.supabase, userId, leagueId);
    if (!teamId) {
      return Response.json({ error: "Your roster team was not found." }, { status: 404 });
    }

    const { error } = await context.supabase.from("team_players").insert({
      player_id: playerId,
      roster_slot: rosterSlot,
      team_id: teamId
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const nextSnapshot = await getRosterSnapshot(context.supabase);
    return Response.json(nextSnapshot);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to acquire player." }, { status: 500 });
  }
}
