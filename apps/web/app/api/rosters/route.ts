import { getAuthenticatedContext } from "../../../lib/admin-auth";
import { findUserTeam, getRosterSnapshot } from "../../../lib/roster-data";

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
    faabBid?: unknown;
    playerId?: unknown;
    rosterSlot?: unknown;
  };
  const action = typeof body.action === "string" ? body.action : "";
  const faabBid = typeof body.faabBid === "number" && Number.isFinite(body.faabBid) ? Math.max(0, Math.floor(body.faabBid)) : 0;
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
    const team = await findUserTeam(context.supabase, userId, leagueId);
    if (!team) {
      return Response.json({ error: "Your roster team was not found." }, { status: 404 });
    }

    if (faabBid > team.faabRemaining) {
      return Response.json({ error: "You do not have enough FAAB for that bid." }, { status: 400 });
    }

    const nextFaab = team.faabRemaining - faabBid;
    const { data: updatedTeams, error: faabError } = await context.supabase
      .from("teams")
      .update({ faab_remaining: nextFaab, updated_at: new Date().toISOString() })
      .eq("id", team.id)
      .gte("faab_remaining", faabBid)
      .select("id");

    if (faabError) {
      return Response.json({ error: faabError.message }, { status: 500 });
    }

    if (!updatedTeams?.length) {
      return Response.json({ error: "You do not have enough FAAB for that bid." }, { status: 400 });
    }

    const { error } = await context.supabase.from("team_players").insert({
      player_id: playerId,
      roster_slot: rosterSlot,
      team_id: team.id
    });

    if (error) {
      await context.supabase.from("teams").update({ faab_remaining: team.faabRemaining }).eq("id", team.id);
      return Response.json({ error: error.message }, { status: 500 });
    }

    const nextSnapshot = await getRosterSnapshot(context.supabase);
    return Response.json(nextSnapshot);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to acquire player." }, { status: 500 });
  }
}
