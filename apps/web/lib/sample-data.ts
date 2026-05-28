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
        imageUrl: "https://a.espncdn.com/i/headshots/nfl/players/full/4431611.png",
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
        imageUrl: "https://a.espncdn.com/i/headshots/nfl/players/full/4430807.png",
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
        imageUrl: "https://a.espncdn.com/i/headshots/nfl/players/full/4426515.png",
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
        imageUrl: "https://a.espncdn.com/i/headshots/nfl/players/full/4430027.png",
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
        imageUrl: "https://a.espncdn.com/i/headshots/nfl/players/full/3126486.png",
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
        imageUrl: "https://a.espncdn.com/i/headshots/nfl/players/full/4372066.png",
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
        imageUrl: "https://a.espncdn.com/i/headshots/nfl/players/full/4431299.png",
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
        imageUrl: "https://a.espncdn.com/i/headshots/nfl/players/full/4426348.png",
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
        imageUrl: "https://a.espncdn.com/i/headshots/nfl/players/full/4429795.png",
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
        imageUrl: "https://a.espncdn.com/i/headshots/nfl/players/full/4569618.png",
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
        imageUrl: "https://a.espncdn.com/i/headshots/nfl/players/full/4361307.png",
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
        imageUrl: "https://a.espncdn.com/i/headshots/nfl/players/full/4427366.png",
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
        imageUrl: "https://a.espncdn.com/i/headshots/nfl/players/full/3953687.png",
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
        imageUrl: "https://a.espncdn.com/i/headshots/nfl/players/full/4635008.png",
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

export type ChatMessage = {
  id: string;
  author: string;
  team: string;
  initials: string;
  body: string;
  sentAt: string;
  isSelf?: boolean;
  tag?: "commissioner" | "trade" | "waiver";
};

export type Presence = "online" | "away" | "offline";

export type DirectThread = {
  id: string;
  manager: string;
  team: string;
  initials: string;
  presence: Presence;
  unreadCount: number;
  lastMessage: string;
  messages: ChatMessage[];
};

export const leagueMembers: Array<{
  manager: string;
  team: string;
  initials: string;
  presence: Presence;
}> = [
  { manager: "Aazma", team: "Fourth Down Syndicate", initials: "AZ", presence: "online" },
  { manager: "Maya", team: "Red Zone Accountants", initials: "MY", presence: "online" },
  { manager: "Jordan", team: "Two Minute Drill", initials: "JD", presence: "away" },
  { manager: "Sam", team: "Waiver Wire Royalty", initials: "SM", presence: "offline" }
];

export const leagueChatMessages: ChatMessage[] = [
  {
    id: "league-1",
    author: "Maya",
    team: "Red Zone Accountants",
    initials: "MY",
    body: "Trade deadline is going to be chaos. I have WR depth if anyone needs one.",
    sentAt: "9:12 AM",
    tag: "trade"
  },
  {
    id: "league-2",
    author: "Jordan",
    team: "Two Minute Drill",
    initials: "JD",
    body: "Commissioner, can we confirm whether waivers run Wednesday morning or after MNF stat corrections?",
    sentAt: "9:16 AM",
    tag: "waiver"
  },
  {
    id: "league-3",
    author: "Aazma",
    team: "Fourth Down Syndicate",
    initials: "AZ",
    body: "Wednesday morning. Stat corrections will still update scores, but waivers stay on schedule.",
    sentAt: "9:18 AM",
    isSelf: true,
    tag: "commissioner"
  },
  {
    id: "league-4",
    author: "Sam",
    team: "Waiver Wire Royalty",
    initials: "SM",
    body: "Perfect. Also accepting all desperate RB offers until further notice.",
    sentAt: "9:24 AM"
  }
];

export const directThreads: DirectThread[] = [
  {
    id: "dm-maya",
    manager: "Maya",
    team: "Red Zone Accountants",
    initials: "MY",
    presence: "online",
    unreadCount: 2,
    lastMessage: "I would move Gibbs, but only if the package is spicy.",
    messages: [
      {
        id: "dm-maya-1",
        author: "Maya",
        team: "Red Zone Accountants",
        initials: "MY",
        body: "I would move Gibbs, but only if the package is spicy.",
        sentAt: "8:44 AM"
      },
      {
        id: "dm-maya-2",
        author: "Aazma",
        team: "Fourth Down Syndicate",
        initials: "AZ",
        body: "I can start with Bijan plus a bench WR, but I need a starter coming back.",
        sentAt: "8:49 AM",
        isSelf: true
      }
    ]
  },
  {
    id: "dm-jordan",
    manager: "Jordan",
    team: "Two Minute Drill",
    initials: "JD",
    presence: "away",
    unreadCount: 0,
    lastMessage: "Good luck this week. Our matchup is way too close.",
    messages: [
      {
        id: "dm-jordan-1",
        author: "Jordan",
        team: "Two Minute Drill",
        initials: "JD",
        body: "Good luck this week. Our matchup is way too close.",
        sentAt: "Yesterday"
      }
    ]
  },
  {
    id: "dm-sam",
    manager: "Sam",
    team: "Waiver Wire Royalty",
    initials: "SM",
    presence: "offline",
    unreadCount: 0,
    lastMessage: "Send me your RB offers before waivers.",
    messages: [
      {
        id: "dm-sam-1",
        author: "Sam",
        team: "Waiver Wire Royalty",
        initials: "SM",
        body: "Send me your RB offers before waivers.",
        sentAt: "Mon"
      }
    ]
  }
];

export type TradeAsset = {
  id: string;
  name: string;
  imageUrl?: string;
  position: "QB" | "RB" | "WR" | "TE" | "K" | "DST" | "PICK" | "FAAB";
  nflTeam: string;
  rosterSlot: string;
  projectedPoints: number;
  tradeValue: number;
  age: number | null;
  risk: number;
  trend: "rising" | "steady" | "falling";
  keeperGrade: number;
  note: string;
};

export type TradeTeam = {
  id: string;
  name: string;
  manager: string;
  record: string;
  needs: Array<TradeAsset["position"]>;
  style: "contender" | "balanced" | "retooling";
  assets: TradeAsset[];
};

export const tradeTeams: TradeTeam[] = [
  {
    id: "trade-team-1",
    name: "Fourth Down Syndicate",
    manager: "Aazma",
    record: "8-3",
    needs: ["RB", "TE"],
    style: "contender",
    assets: [
      {
        id: "trade-p-1",
        name: "Caleb Williams",
        imageUrl: "https://a.espncdn.com/i/headshots/nfl/players/full/4431611.png",
        position: "QB",
        nflTeam: "CHI",
        rosterSlot: "QB",
        projectedPoints: 19.4,
        tradeValue: 67,
        age: 24,
        risk: 34,
        trend: "rising",
        keeperGrade: 88,
        note: "High-upside starter with rushing floor."
      },
      {
        id: "trade-p-2",
        name: "Bijan Robinson",
        imageUrl: "https://a.espncdn.com/i/headshots/nfl/players/full/4430807.png",
        position: "RB",
        nflTeam: "ATL",
        rosterSlot: "RB",
        projectedPoints: 18.1,
        tradeValue: 93,
        age: 24,
        risk: 18,
        trend: "rising",
        keeperGrade: 96,
        note: "Elite weekly ceiling and long-term anchor."
      },
      {
        id: "trade-p-3",
        name: "Puka Nacua",
        imageUrl: "https://a.espncdn.com/i/headshots/nfl/players/full/4426515.png",
        position: "WR",
        nflTeam: "LAR",
        rosterSlot: "WR",
        projectedPoints: 16.2,
        tradeValue: 86,
        age: 25,
        risk: 24,
        trend: "steady",
        keeperGrade: 91,
        note: "Volume receiver with strong keeper profile."
      },
      {
        id: "trade-p-4",
        name: "Deebo Samuel",
        imageUrl: "https://a.espncdn.com/i/headshots/nfl/players/full/3126486.png",
        position: "WR",
        nflTeam: "SF",
        rosterSlot: "FLEX",
        projectedPoints: 13.8,
        tradeValue: 63,
        age: 30,
        risk: 48,
        trend: "falling",
        keeperGrade: 58,
        note: "Playmaker, but health and age add volatility."
      },
      {
        id: "trade-p-5",
        name: "2026 Round 2 Pick",
        position: "PICK",
        nflTeam: "Draft",
        rosterSlot: "Future",
        projectedPoints: 0,
        tradeValue: 36,
        age: null,
        risk: 22,
        trend: "steady",
        keeperGrade: 76,
        note: "Useful retooling asset."
      },
      {
        id: "trade-p-6",
        name: "$18 FAAB",
        position: "FAAB",
        nflTeam: "Waiver",
        rosterSlot: "Budget",
        projectedPoints: 0,
        tradeValue: 18,
        age: null,
        risk: 12,
        trend: "steady",
        keeperGrade: 20,
        note: "Short-term waiver flexibility."
      }
    ]
  },
  {
    id: "trade-team-2",
    name: "Red Zone Accountants",
    manager: "Maya",
    record: "7-4",
    needs: ["WR", "TE"],
    style: "contender",
    assets: [
      {
        id: "trade-p-7",
        name: "Jayden Daniels",
        imageUrl: "https://a.espncdn.com/i/headshots/nfl/players/full/4426348.png",
        position: "QB",
        nflTeam: "WAS",
        rosterSlot: "QB",
        projectedPoints: 20.1,
        tradeValue: 82,
        age: 25,
        risk: 28,
        trend: "rising",
        keeperGrade: 94,
        note: "Dual-threat QB with weekly top-five upside."
      },
      {
        id: "trade-p-8",
        name: "Jahmyr Gibbs",
        imageUrl: "https://a.espncdn.com/i/headshots/nfl/players/full/4429795.png",
        position: "RB",
        nflTeam: "DET",
        rosterSlot: "RB",
        projectedPoints: 17.6,
        tradeValue: 91,
        age: 24,
        risk: 20,
        trend: "rising",
        keeperGrade: 95,
        note: "Explosive PPR back with premium keeper value."
      },
      {
        id: "trade-p-9",
        name: "Garrett Wilson",
        imageUrl: "https://a.espncdn.com/i/headshots/nfl/players/full/4569618.png",
        position: "WR",
        nflTeam: "NYJ",
        rosterSlot: "WR",
        projectedPoints: 15.2,
        tradeValue: 78,
        age: 26,
        risk: 30,
        trend: "steady",
        keeperGrade: 87,
        note: "Target hog with stable floor."
      },
      {
        id: "trade-p-10",
        name: "Trey McBride",
        imageUrl: "https://a.espncdn.com/i/headshots/nfl/players/full/4361307.png",
        position: "TE",
        nflTeam: "ARI",
        rosterSlot: "TE",
        projectedPoints: 12.2,
        tradeValue: 72,
        age: 26,
        risk: 26,
        trend: "rising",
        keeperGrade: 89,
        note: "Premium positional edge at TE."
      },
      {
        id: "trade-p-11",
        name: "2026 Round 1 Pick",
        position: "PICK",
        nflTeam: "Draft",
        rosterSlot: "Future",
        projectedPoints: 0,
        tradeValue: 58,
        age: null,
        risk: 18,
        trend: "steady",
        keeperGrade: 92,
        note: "Blue-chip rebuild asset."
      },
      {
        id: "trade-p-12",
        name: "$24 FAAB",
        position: "FAAB",
        nflTeam: "Waiver",
        rosterSlot: "Budget",
        projectedPoints: 0,
        tradeValue: 24,
        age: null,
        risk: 12,
        trend: "steady",
        keeperGrade: 22,
        note: "Aggressive waiver firepower."
      }
    ]
  },
  {
    id: "trade-team-3",
    name: "Two Minute Drill",
    manager: "Jordan",
    record: "7-4",
    needs: ["RB", "WR"],
    style: "balanced",
    assets: [
      {
        id: "trade-p-13",
        name: "Amon-Ra St. Brown",
        imageUrl: "https://a.espncdn.com/i/headshots/nfl/players/full/4374302.png",
        position: "WR",
        nflTeam: "DET",
        rosterSlot: "WR",
        projectedPoints: 17.9,
        tradeValue: 95,
        age: 26,
        risk: 14,
        trend: "steady",
        keeperGrade: 97,
        note: "Elite target share and week-proof floor."
      },
      {
        id: "trade-p-14",
        name: "Jonathan Taylor",
        imageUrl: "https://a.espncdn.com/i/headshots/nfl/players/full/4242335.png",
        position: "RB",
        nflTeam: "IND",
        rosterSlot: "RB",
        projectedPoints: 15.8,
        tradeValue: 74,
        age: 27,
        risk: 36,
        trend: "steady",
        keeperGrade: 72,
        note: "Strong contender piece with workload upside."
      },
      {
        id: "trade-p-15",
        name: "Brock Bowers",
        imageUrl: "https://a.espncdn.com/i/headshots/nfl/players/full/4432665.png",
        position: "TE",
        nflTeam: "LV",
        rosterSlot: "TE",
        projectedPoints: 13.5,
        tradeValue: 84,
        age: 23,
        risk: 20,
        trend: "rising",
        keeperGrade: 98,
        note: "Rare TE asset with elite dynasty profile."
      },
      {
        id: "trade-p-16",
        name: "2026 Round 3 Pick",
        position: "PICK",
        nflTeam: "Draft",
        rosterSlot: "Future",
        projectedPoints: 0,
        tradeValue: 22,
        age: null,
        risk: 26,
        trend: "steady",
        keeperGrade: 62,
        note: "Useful sweetener."
      }
    ]
  },
  {
    id: "trade-team-4",
    name: "Waiver Wire Royalty",
    manager: "Sam",
    record: "6-5",
    needs: ["QB", "RB"],
    style: "retooling",
    assets: [
      {
        id: "trade-p-17",
        name: "Drake London",
        imageUrl: "https://a.espncdn.com/i/headshots/nfl/players/full/4426502.png",
        position: "WR",
        nflTeam: "ATL",
        rosterSlot: "WR",
        projectedPoints: 14.6,
        tradeValue: 76,
        age: 25,
        risk: 31,
        trend: "rising",
        keeperGrade: 86,
        note: "Ascending receiver with target dominance."
      },
      {
        id: "trade-p-18",
        name: "Kyren Williams",
        imageUrl: "https://a.espncdn.com/i/headshots/nfl/players/full/4430737.png",
        position: "RB",
        nflTeam: "LAR",
        rosterSlot: "RB",
        projectedPoints: 15.9,
        tradeValue: 70,
        age: 26,
        risk: 42,
        trend: "steady",
        keeperGrade: 68,
        note: "Touch volume is excellent, durability risk remains."
      },
      {
        id: "trade-p-19",
        name: "Marvin Harrison Jr.",
        imageUrl: "https://a.espncdn.com/i/headshots/nfl/players/full/4432708.png",
        position: "WR",
        nflTeam: "ARI",
        rosterSlot: "WR",
        projectedPoints: 14.2,
        tradeValue: 88,
        age: 24,
        risk: 28,
        trend: "rising",
        keeperGrade: 97,
        note: "Premium long-term bet."
      },
      {
        id: "trade-p-20",
        name: "2026 Round 1 Pick",
        position: "PICK",
        nflTeam: "Draft",
        rosterSlot: "Future",
        projectedPoints: 0,
        tradeValue: 61,
        age: null,
        risk: 18,
        trend: "steady",
        keeperGrade: 94,
        note: "High-leverage rebuilding asset."
      }
    ]
  }
];
