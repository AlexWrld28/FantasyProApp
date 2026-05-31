import { getAdminContext } from "../../../../../../lib/admin-auth";

export async function PATCH(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const admin = await getAdminContext(request);
  if (admin.error) {
    return admin.error;
  }

  const { userId } = await params;
  const body = (await request.json()) as { password?: unknown };
  const password = typeof body.password === "string" ? body.password : "";

  if (password.length < 6) {
    return Response.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  const { error } = await admin.supabase.auth.admin.updateUserById(userId, {
    password
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
