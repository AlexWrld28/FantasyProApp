import { getAuthenticatedContext } from "../../../lib/admin-auth";
import { getRosterSnapshot } from "../../../lib/roster-data";

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
