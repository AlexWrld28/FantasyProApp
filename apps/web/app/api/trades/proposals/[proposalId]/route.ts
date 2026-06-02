import { getAuthenticatedContext } from "../../../../../lib/admin-auth";
import { getRosterSnapshot } from "../../../../../lib/roster-data";

type TradeProposalRow = {
  ai_fairness_score: number | null;
  ai_net_edge: number | null;
  created_at: string;
  id: string;
  incoming_assets: unknown;
  note: string | null;
  outgoing_assets: unknown;
  recipient_id: string;
  sender_id: string;
  status: string;
  updated_at: string;
};

type TradeProposalAsset = {
  label?: unknown;
  playerId?: unknown;
  rosterSlot?: unknown;
  value?: unknown;
};

type TeamPlayerAssignmentRow = {
  player_id: string;
  players?: { full_name?: string | null } | Array<{ full_name?: string | null }> | null;
  roster_slot: string;
  team_id: string;
};

export async function PATCH(request: Request, { params }: { params: Promise<{ proposalId: string }> }) {
  const context = await getAuthenticatedContext(request);
  if (context.error) {
    return context.error;
  }

  const { proposalId } = await params;
  const body = (await request.json()) as { status?: unknown };
  const status = typeof body.status === "string" ? body.status : "";

  if (!["accepted", "declined", "voting"].includes(status)) {
    return Response.json({ error: "Unsupported trade proposal status." }, { status: 400 });
  }

  const { data: existingProposal, error: proposalError } = await context.supabase
    .from("user_trade_proposals")
    .select("*")
    .eq("id", proposalId)
    .eq("recipient_id", context.user.id)
    .single();

  if (proposalError) {
    return Response.json({ error: proposalError.message }, { status: 500 });
  }

  const proposal = existingProposal as TradeProposalRow;

  if (status === "accepted") {
    const executionError = await executeAcceptedTrade(context.supabase, proposal);
    if (executionError) {
      return Response.json({ error: executionError }, { status: 400 });
    }
  }

  const { data, error } = await context.supabase
    .from("user_trade_proposals")
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq("id", proposalId)
    .eq("recipient_id", context.user.id)
    .select("*")
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ proposal: formatProposal(data as TradeProposalRow) });
}

async function executeAcceptedTrade(supabase: any, proposal: TradeProposalRow) {
  const snapshot = await getRosterSnapshot(supabase);
  const senderTeam = snapshot.teams.find((team) => team.managerId === proposal.sender_id);
  const recipientTeam = snapshot.teams.find((team) => team.managerId === proposal.recipient_id);

  if (!senderTeam || !recipientTeam) {
    return "Both managers need roster teams before this trade can be processed.";
  }

  const { data: assignments, error: assignmentError } = await supabase
    .from("team_players")
    .select("team_id, player_id, roster_slot, players(full_name)")
    .in("team_id", [senderTeam.id, recipientTeam.id]);

  if (assignmentError) {
    return assignmentError.message;
  }

  const rosterRows = (assignments ?? []) as TeamPlayerAssignmentRow[];
  const outgoingPlayerIds = resolveTradePlayerIds(proposal.outgoing_assets, rosterRows, senderTeam.id);
  const incomingPlayerIds = resolveTradePlayerIds(proposal.incoming_assets, rosterRows, recipientTeam.id);

  if (!outgoingPlayerIds.length && !incomingPlayerIds.length) {
    return "This trade does not include rostered players. Re-propose it from the current Trade tab.";
  }

  const missingOutgoing = missingCurrentAssignments(outgoingPlayerIds, rosterRows, senderTeam.id);
  const missingIncoming = missingCurrentAssignments(incomingPlayerIds, rosterRows, recipientTeam.id);

  if (missingOutgoing.length || missingIncoming.length) {
    const alreadyProcessed =
      allCurrentAssignments(outgoingPlayerIds, rosterRows, recipientTeam.id) &&
      allCurrentAssignments(incomingPlayerIds, rosterRows, senderTeam.id);

    if (alreadyProcessed) {
      return null;
    }

    return "One or more traded players are no longer on the expected roster. Re-propose this trade from the current rosters.";
  }

  const now = new Date().toISOString();
  const outgoingError = await movePlayers(supabase, outgoingPlayerIds, senderTeam.id, recipientTeam.id, now);
  if (outgoingError) {
    return outgoingError;
  }

  const incomingError = await movePlayers(supabase, incomingPlayerIds, recipientTeam.id, senderTeam.id, now);
  return incomingError;
}

function resolveTradePlayerIds(assets: unknown, rosterRows: TeamPlayerAssignmentRow[], fromTeamId: string) {
  if (!Array.isArray(assets)) {
    return [];
  }

  return uniqueStrings(
    assets
      .map((asset) => resolveTradePlayerId(asset as TradeProposalAsset, rosterRows, fromTeamId))
      .filter((playerId): playerId is string => Boolean(playerId))
  );
}

function resolveTradePlayerId(asset: TradeProposalAsset, rosterRows: TeamPlayerAssignmentRow[], fromTeamId: string) {
  if (typeof asset.playerId === "string") {
    return asset.playerId;
  }

  if (typeof asset.label !== "string") {
    return null;
  }

  return rosterRows.find((row) => row.team_id === fromTeamId && getAssignmentPlayerName(row) === asset.label)?.player_id ?? null;
}

function getAssignmentPlayerName(row: TeamPlayerAssignmentRow) {
  if (Array.isArray(row.players)) {
    return row.players[0]?.full_name ?? null;
  }

  return row.players?.full_name ?? null;
}

function missingCurrentAssignments(playerIds: string[], rosterRows: TeamPlayerAssignmentRow[], teamId: string) {
  return playerIds.filter((playerId) => !rosterRows.some((row) => row.team_id === teamId && row.player_id === playerId));
}

function allCurrentAssignments(playerIds: string[], rosterRows: TeamPlayerAssignmentRow[], teamId: string) {
  return playerIds.every((playerId) => rosterRows.some((row) => row.team_id === teamId && row.player_id === playerId));
}

async function movePlayers(supabase: any, playerIds: string[], fromTeamId: string, toTeamId: string, acquiredAt: string) {
  if (!playerIds.length) {
    return null;
  }

  const { data, error } = await supabase
    .from("team_players")
    .update({
      acquired_at: acquiredAt,
      roster_slot: "BN",
      team_id: toTeamId
    })
    .eq("team_id", fromTeamId)
    .in("player_id", playerIds)
    .select("player_id");

  if (error) {
    return error.message;
  }

  if ((data ?? []).length !== playerIds.length) {
    return "The trade could not update every rostered player. Check the rosters and re-propose the trade if needed.";
  }

  return null;
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values));
}

function formatProposal(proposal: TradeProposalRow) {
  return {
    aiFairnessScore: proposal.ai_fairness_score,
    aiNetEdge: proposal.ai_net_edge,
    createdAt: proposal.created_at,
    id: proposal.id,
    incomingAssets: proposal.incoming_assets,
    note: proposal.note,
    outgoingAssets: proposal.outgoing_assets,
    recipientId: proposal.recipient_id,
    senderId: proposal.sender_id,
    status: proposal.status,
    updatedAt: proposal.updated_at
  };
}
