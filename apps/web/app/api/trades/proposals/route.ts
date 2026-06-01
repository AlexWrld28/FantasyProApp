import { getAuthenticatedContext } from "../../../../lib/admin-auth";

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

export async function GET(request: Request) {
  const context = await getAuthenticatedContext(request);
  if (context.error) {
    return context.error;
  }

  const { data, error } = await context.supabase
    .from("user_trade_proposals")
    .select("*")
    .or(`sender_id.eq.${context.user.id},recipient_id.eq.${context.user.id}`)
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({
    proposals: ((data ?? []) as TradeProposalRow[]).map(formatProposal)
  });
}

export async function POST(request: Request) {
  const context = await getAuthenticatedContext(request);
  if (context.error) {
    return context.error;
  }

  const body = (await request.json()) as {
    aiFairnessScore?: unknown;
    aiNetEdge?: unknown;
    incomingAssets?: unknown;
    note?: unknown;
    outgoingAssets?: unknown;
    recipientId?: unknown;
  };
  const recipientId = typeof body.recipientId === "string" ? body.recipientId : "";

  if (!recipientId) {
    return Response.json({ error: "Select a trade partner." }, { status: 400 });
  }

  if (recipientId === context.user.id) {
    return Response.json({ error: "You cannot send a trade proposal to yourself." }, { status: 400 });
  }

  const { data, error } = await context.supabase
    .from("user_trade_proposals")
    .insert({
      ai_fairness_score: typeof body.aiFairnessScore === "number" ? body.aiFairnessScore : null,
      ai_net_edge: typeof body.aiNetEdge === "number" ? body.aiNetEdge : null,
      incoming_assets: Array.isArray(body.incomingAssets) ? body.incomingAssets : [],
      note: typeof body.note === "string" ? body.note : null,
      outgoing_assets: Array.isArray(body.outgoingAssets) ? body.outgoingAssets : [],
      recipient_id: recipientId,
      sender_id: context.user.id,
      status: "sent"
    })
    .select("*")
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ proposal: formatProposal(data as TradeProposalRow) });
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
