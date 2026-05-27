import type { FantasyTeam } from "@baal/fantasy-engine";

export const leagueTeams: FantasyTeam[] = [
  {
    id: "team-1",
    name: "Fourth Down Syndicate",
    manager: "Aazma",
    record: "8-3",
    waiverPriority: 4,
    faabRemaining: 61,
    roster: [
      {
        id: "p-1",
        name: "Caleb Williams",
        team: "CHI",
        opponent: "MIN",
        position: "QB",
        rosterSlot: "QB",
        status: "active",
        projectedPoints: 19.4,
        stats: { passingYards: 286, passingTouchdowns: 2, interceptions: 1, rushingYards: 32 }
      },
      {
        id: "p-2",
        name: "Bijan Robinson",
        team: "ATL",
        opponent: "NO",
        position: "RB",
        rosterSlot: "RB",
        status: "active",
        projectedPoints: 18.1,
        stats: { rushingYards: 102, rushingTouchdowns: 1, receptions: 4, receivingYards: 29 }
      },
      {
        id: "p-3",
        name: "Puka Nacua",
        team: "LAR",
        opponent: "ARI",
        position: "WR",
        rosterSlot: "WR",
        status: "active",
        projectedPoints: 16.2,
        stats: { receptions: 7, receivingYards: 94, receivingTouchdowns: 1 }
      },
      {
        id: "p-4",
        name: "Sam LaPorta",
        team: "DET",
        opponent: "GB",
        position: "TE",
        rosterSlot: "TE",
        status: "active",
        projectedPoints: 11.6,
        stats: { receptions: 5, receivingYards: 56 }
      },
      {
        id: "p-5",
        name: "Deebo Samuel",
        team: "SF",
        opponent: "SEA",
        position: "WR",
        rosterSlot: "FLEX",
        status: "active",
        projectedPoints: 13.8,
        stats: { receptions: 4, receivingYards: 62, rushingYards: 21 }
      },
      {
        id: "p-6",
        name: "Jake Moody",
        team: "SF",
        opponent: "SEA",
        position: "K",
        rosterSlot: "K",
        status: "active",
        projectedPoints: 8.7,
        stats: { fieldGoalsMade: 2, extraPointsMade: 3 }
      },
      {
        id: "p-7",
        name: "Cleveland Browns",
        team: "CLE",
        opponent: "PIT",
        position: "DST",
        rosterSlot: "DST",
        status: "active",
        projectedPoints: 7.5,
        stats: { sacks: 4, turnoversForced: 2, pointsAllowed: 13 }
      },
      {
        id: "p-8",
        name: "Rome Odunze",
        team: "CHI",
        opponent: "MIN",
        position: "WR",
        rosterSlot: "BN",
        status: "bench",
        projectedPoints: 9.3,
        stats: { receptions: 3, receivingYards: 41 }
      }
    ]
  },
  {
    id: "team-2",
    name: "Red Zone Accountants",
    manager: "Maya",
    record: "7-4",
    waiverPriority: 7,
    faabRemaining: 42,
    roster: [
      {
        id: "p-9",
        name: "Jayden Daniels",
        team: "WAS",
        opponent: "DAL",
        position: "QB",
        rosterSlot: "QB",
        status: "active",
        projectedPoints: 20.1,
        stats: { passingYards: 241, passingTouchdowns: 2, rushingYards: 54, rushingTouchdowns: 1 }
      },
      {
        id: "p-10",
        name: "Jahmyr Gibbs",
        team: "DET",
        opponent: "GB",
        position: "RB",
        rosterSlot: "RB",
        status: "active",
        projectedPoints: 17.6,
        stats: { rushingYards: 76, receptions: 5, receivingYards: 44 }
      },
      {
        id: "p-11",
        name: "Garrett Wilson",
        team: "NYJ",
        opponent: "MIA",
        position: "WR",
        rosterSlot: "WR",
        status: "active",
        projectedPoints: 15.2,
        stats: { receptions: 8, receivingYards: 83 }
      },
      {
        id: "p-12",
        name: "Trey McBride",
        team: "ARI",
        opponent: "LAR",
        position: "TE",
        rosterSlot: "TE",
        status: "active",
        projectedPoints: 12.2,
        stats: { receptions: 6, receivingYards: 51, receivingTouchdowns: 1 }
      },
      {
        id: "p-13",
        name: "Breece Hall",
        team: "NYJ",
        opponent: "MIA",
        position: "RB",
        rosterSlot: "FLEX",
        status: "active",
        projectedPoints: 16.8,
        stats: { rushingYards: 88, receptions: 3, receivingYards: 18, fumblesLost: 1 }
      },
      {
        id: "p-14",
        name: "Brandon Aubrey",
        team: "DAL",
        opponent: "WAS",
        position: "K",
        rosterSlot: "K",
        status: "active",
        projectedPoints: 9.4,
        stats: { fieldGoalsMade: 3, extraPointsMade: 2 }
      },
      {
        id: "p-15",
        name: "New York Jets",
        team: "NYJ",
        opponent: "MIA",
        position: "DST",
        rosterSlot: "DST",
        status: "active",
        projectedPoints: 6.8,
        stats: { sacks: 2, turnoversForced: 1, defensiveTouchdowns: 1, pointsAllowed: 28 }
      },
      {
        id: "p-16",
        name: "Keon Coleman",
        team: "BUF",
        opponent: "NE",
        position: "WR",
        rosterSlot: "BN",
        status: "bench",
        projectedPoints: 8.2,
        stats: { receptions: 2, receivingYards: 25 }
      }
    ]
  },
  {
    id: "team-3",
    name: "Two Minute Drill",
    manager: "Jordan",
    record: "7-4",
    waiverPriority: 2,
    faabRemaining: 35,
    roster: []
  },
  {
    id: "team-4",
    name: "Waiver Wire Royalty",
    manager: "Sam",
    record: "6-5",
    waiverPriority: 1,
    faabRemaining: 78,
    roster: []
  }
];

export const recentActivity = [
  {
    time: "9:18 AM",
    title: "Trade accepted",
    detail: "Fourth Down Syndicate receives a flex upgrade before the deadline."
  },
  {
    time: "Yesterday",
    title: "Waivers processed",
    detail: "Three claims cleared and one FAAB tie was resolved."
  },
  {
    time: "Mon",
    title: "Lineups locked",
    detail: "Two teams left injured players active."
  }
];

export const waiverTargets = [
  { name: "Jaylen Wright", position: "RB", team: "MIA", priority: "1st" },
  { name: "Jalen McMillan", position: "WR", team: "TB", priority: "2nd" },
  { name: "Ben Sinnott", position: "TE", team: "WAS", priority: "Watch" }
];
