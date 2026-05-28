export type RosterSlot =
  | "QB"
  | "RB"
  | "WR"
  | "TE"
  | "FLEX"
  | "K"
  | "DST"
  | "BN"
  | "IR";

export type PlayerPosition = "QB" | "RB" | "WR" | "TE" | "K" | "DST";

export type PlayerStatLine = {
  passingYards?: number;
  passingTouchdowns?: number;
  interceptions?: number;
  rushingYards?: number;
  rushingTouchdowns?: number;
  receptions?: number;
  receivingYards?: number;
  receivingTouchdowns?: number;
  fumblesLost?: number;
  twoPointConversions?: number;
  fieldGoalsMade?: number;
  extraPointsMade?: number;
  sacks?: number;
  turnoversForced?: number;
  defensiveTouchdowns?: number;
  pointsAllowed?: number;
};

export type FantasyPlayer = {
  id: string;
  name: string;
  imageUrl?: string;
  team: string;
  opponent: string;
  position: PlayerPosition;
  rosterSlot: RosterSlot;
  status: "active" | "bench" | "injured" | "bye";
  projectedPoints: number;
  stats: PlayerStatLine;
};

export type FantasyTeam = {
  id: string;
  name: string;
  manager: string;
  record: string;
  waiverPriority: number;
  faabRemaining: number;
  roster: FantasyPlayer[];
};

export type ScoringRules = {
  passingYardsPerPoint: number;
  passingTouchdown: number;
  interception: number;
  rushingYardsPerPoint: number;
  rushingTouchdown: number;
  reception: number;
  receivingYardsPerPoint: number;
  receivingTouchdown: number;
  fumbleLost: number;
  twoPointConversion: number;
  fieldGoal: number;
  extraPoint: number;
  sack: number;
  turnoverForced: number;
  defensiveTouchdown: number;
  pointsAllowedUnder7: number;
  pointsAllowedUnder14: number;
  pointsAllowedOver34: number;
};

export type PlayerScore = {
  player: FantasyPlayer;
  projectedPoints: number;
  actualPoints: number;
  breakdown: Record<string, number>;
};

export type TeamScore = {
  team: FantasyTeam;
  starters: PlayerScore[];
  bench: PlayerScore[];
  projectedPoints: number;
  actualPoints: number;
};

export const defaultScoringRules: ScoringRules = {
  passingYardsPerPoint: 25,
  passingTouchdown: 4,
  interception: -2,
  rushingYardsPerPoint: 10,
  rushingTouchdown: 6,
  reception: 1,
  receivingYardsPerPoint: 10,
  receivingTouchdown: 6,
  fumbleLost: -2,
  twoPointConversion: 2,
  fieldGoal: 3,
  extraPoint: 1,
  sack: 1,
  turnoverForced: 2,
  defensiveTouchdown: 6,
  pointsAllowedUnder7: 7,
  pointsAllowedUnder14: 4,
  pointsAllowedOver34: -4
};

export const starterSlots: RosterSlot[] = ["QB", "RB", "WR", "TE", "FLEX", "K", "DST"];

export function scorePlayer(player: FantasyPlayer, rules: ScoringRules): PlayerScore {
  const stats = player.stats;
  const breakdown: Record<string, number> = {};

  addBreakdown(breakdown, "Passing yards", divide(stats.passingYards, rules.passingYardsPerPoint));
  addBreakdown(breakdown, "Passing TD", value(stats.passingTouchdowns) * rules.passingTouchdown);
  addBreakdown(breakdown, "Interceptions", value(stats.interceptions) * rules.interception);
  addBreakdown(breakdown, "Rushing yards", divide(stats.rushingYards, rules.rushingYardsPerPoint));
  addBreakdown(breakdown, "Rushing TD", value(stats.rushingTouchdowns) * rules.rushingTouchdown);
  addBreakdown(breakdown, "Receptions", value(stats.receptions) * rules.reception);
  addBreakdown(breakdown, "Receiving yards", divide(stats.receivingYards, rules.receivingYardsPerPoint));
  addBreakdown(breakdown, "Receiving TD", value(stats.receivingTouchdowns) * rules.receivingTouchdown);
  addBreakdown(breakdown, "Fumbles lost", value(stats.fumblesLost) * rules.fumbleLost);
  addBreakdown(breakdown, "Two point", value(stats.twoPointConversions) * rules.twoPointConversion);
  addBreakdown(breakdown, "Field goals", value(stats.fieldGoalsMade) * rules.fieldGoal);
  addBreakdown(breakdown, "Extra points", value(stats.extraPointsMade) * rules.extraPoint);
  addBreakdown(breakdown, "Sacks", value(stats.sacks) * rules.sack);
  addBreakdown(breakdown, "Takeaways", value(stats.turnoversForced) * rules.turnoverForced);
  addBreakdown(breakdown, "Defensive TD", value(stats.defensiveTouchdowns) * rules.defensiveTouchdown);
  addBreakdown(breakdown, "Points allowed", scorePointsAllowed(stats.pointsAllowed, rules));

  const actualPoints = roundPoints(Object.values(breakdown).reduce((sum, points) => sum + points, 0));

  return {
    player,
    projectedPoints: player.projectedPoints,
    actualPoints,
    breakdown
  };
}

export function scoreTeam(team: FantasyTeam, rules: ScoringRules): TeamScore {
  const scoredPlayers = team.roster.map((player) => scorePlayer(player, rules));
  const starters = scoredPlayers.filter(({ player }) => starterSlots.includes(player.rosterSlot));
  const bench = scoredPlayers.filter(({ player }) => !starterSlots.includes(player.rosterSlot));

  return {
    team,
    starters,
    bench,
    projectedPoints: roundPoints(starters.reduce((sum, score) => sum + score.projectedPoints, 0)),
    actualPoints: roundPoints(starters.reduce((sum, score) => sum + score.actualPoints, 0))
  };
}

export function buildMatchup(home: FantasyTeam, away: FantasyTeam, rules: ScoringRules) {
  const homeScore = scoreTeam(home, rules);
  const awayScore = scoreTeam(away, rules);

  return {
    home: homeScore,
    away: awayScore,
    leader: homeScore.actualPoints >= awayScore.actualPoints ? homeScore.team : awayScore.team,
    spread: roundPoints(Math.abs(homeScore.actualPoints - awayScore.actualPoints))
  };
}

export function formatPoints(points: number): string {
  return points.toFixed(2);
}

function value(input: number | undefined): number {
  return Number.isFinite(input) ? Number(input) : 0;
}

function divide(input: number | undefined, denominator: number): number {
  if (!denominator) {
    return 0;
  }

  return value(input) / denominator;
}

function scorePointsAllowed(pointsAllowed: number | undefined, rules: ScoringRules): number {
  if (pointsAllowed === undefined) {
    return 0;
  }

  if (pointsAllowed <= 6) {
    return rules.pointsAllowedUnder7;
  }

  if (pointsAllowed <= 13) {
    return rules.pointsAllowedUnder14;
  }

  if (pointsAllowed >= 35) {
    return rules.pointsAllowedOver34;
  }

  return 0;
}

function addBreakdown(breakdown: Record<string, number>, label: string, points: number): void {
  if (points !== 0) {
    breakdown[label] = roundPoints(points);
  }
}

function roundPoints(points: number): number {
  return Math.round(points * 100) / 100;
}
