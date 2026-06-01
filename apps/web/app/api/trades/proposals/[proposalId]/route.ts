import { getAuthenticatedContext } from "../../../../../lib/admin-auth";

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
