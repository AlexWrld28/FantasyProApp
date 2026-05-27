import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type MatchupRequest = {
  matchupId: string;
};

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return Response.json({ error: "POST required" }, { status: 405 });
  }

  const { matchupId } = (await request.json()) as MatchupRequest;
  if (!matchupId) {
    return Response.json({ error: "matchupId is required" }, { status: 400 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json({ error: "Supabase environment is not configured" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data: scores, error } = await supabase
    .from("fantasy_scores")
    .select("team_id, points, matchups!inner(home_team_id, away_team_id)")
    .eq("matchup_id", matchupId);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const totals = new Map<string, number>();
  for (const score of scores ?? []) {
    const current = totals.get(score.team_id) ?? 0;
    totals.set(score.team_id, current + Number(score.points ?? 0));
  }

  const firstScore = scores?.[0] as
    | { matchups?: { home_team_id?: string; away_team_id?: string } }
    | undefined;

  const homeTeamId = firstScore?.matchups?.home_team_id;
  const awayTeamId = firstScore?.matchups?.away_team_id;

  if (!homeTeamId || !awayTeamId) {
    return Response.json({ error: "Matchup teams were not found" }, { status: 404 });
  }

  const homePoints = totals.get(homeTeamId) ?? 0;
  const awayPoints = totals.get(awayTeamId) ?? 0;

  const { error: updateError } = await supabase
    .from("matchups")
    .update({
      home_points: homePoints,
      away_points: awayPoints,
      updated_at: new Date().toISOString()
    })
    .eq("id", matchupId);

  if (updateError) {
    return Response.json({ error: updateError.message }, { status: 500 });
  }

  return Response.json({ matchupId, homePoints, awayPoints });
});
