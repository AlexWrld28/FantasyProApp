import { getAuthenticatedContext } from "../../../../lib/admin-auth";

type DirectMessageRow = {
  body: string;
  created_at: string;
  id: string;
  recipient_id: string;
  sender_id: string;
};

export async function GET(request: Request) {
  const context = await getAuthenticatedContext(request);
  if (context.error) {
    return context.error;
  }

  const url = new URL(request.url);
  const peerId = url.searchParams.get("peerId");
  if (!peerId) {
    return Response.json({ error: "Missing peerId." }, { status: 400 });
  }

  const { data, error } = await context.supabase
    .from("direct_messages")
    .select("id, sender_id, recipient_id, body, created_at")
    .or(
      `and(sender_id.eq.${context.user.id},recipient_id.eq.${peerId}),and(sender_id.eq.${peerId},recipient_id.eq.${context.user.id})`
    )
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({
    messages: ((data ?? []) as DirectMessageRow[]).map((message) => ({
      body: message.body,
      createdAt: message.created_at,
      id: message.id,
      isSelf: message.sender_id === context.user.id,
      recipientId: message.recipient_id,
      senderId: message.sender_id
    }))
  });
}

export async function POST(request: Request) {
  const context = await getAuthenticatedContext(request);
  if (context.error) {
    return context.error;
  }

  const body = (await request.json()) as { body?: unknown; recipientId?: unknown };
  const recipientId = typeof body.recipientId === "string" ? body.recipientId : "";
  const messageBody = typeof body.body === "string" ? body.body.trim() : "";

  if (!recipientId) {
    return Response.json({ error: "Missing recipientId." }, { status: 400 });
  }

  if (!messageBody) {
    return Response.json({ error: "Message body is required." }, { status: 400 });
  }

  if (recipientId === context.user.id) {
    return Response.json({ error: "You cannot send a direct message to yourself." }, { status: 400 });
  }

  const { data, error } = await context.supabase
    .from("direct_messages")
    .insert({
      body: messageBody,
      recipient_id: recipientId,
      sender_id: context.user.id
    })
    .select("id, sender_id, recipient_id, body, created_at")
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const message = data as DirectMessageRow;
  return Response.json({
    message: {
      body: message.body,
      createdAt: message.created_at,
      id: message.id,
      isSelf: true,
      recipientId: message.recipient_id,
      senderId: message.sender_id
    }
  });
}
