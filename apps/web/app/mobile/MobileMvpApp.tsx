"use client";

import {
  ArrowLeft,
  Bell,
  ChevronRight,
  Home,
  LogOut,
  MessageCircle,
  Plus,
  Send,
  Settings,
  Share,
  Shield,
  Sparkles,
  Star,
  Trophy,
  UserRound,
  Users
} from "lucide-react";
import { useEffect, useMemo, useState, type ComponentType, type CSSProperties, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import {
  clearLocalSupabaseAuthSession,
  createRuntimeBrowserSupabaseClient,
  isInvalidRefreshTokenError,
  type BrowserSupabaseClient
} from "../../lib/supabase";
import styles from "./mobile.module.css";

type MobileTab = "home" | "standings" | "teams" | "chat" | "profile";

type DemoTeam = {
  id: string;
  owner: string;
  name: string;
  record: string;
  rank: number;
  pointsFor: number;
  powerScore: number;
  streak: string;
  lastResult: string;
  nextMatchup: string;
  primaryColor: string;
  roster: Array<{
    name: string;
    position: string;
    team: string;
    projection: number;
  }>;
};

type DemoMessage = {
  id: string;
  author: string;
  body: string;
  sentAt: string;
  tag?: string;
};

const leagueName = "Binghamton After Dark League";
const currentWeek = "Week 12";
const currentStatus = "Waivers lock tonight";
const buildLabel = "Mobile MVP 0.1";

const demoTeams: DemoTeam[] = [
  {
    id: "vestal-vultures",
    owner: "Aazma",
    name: "Vestal Vultures",
    record: "9-2",
    rank: 1,
    pointsFor: 1438.6,
    powerScore: 97,
    streak: "W5",
    lastResult: "Beat Court St. Chaos, 138.4-121.8",
    nextMatchup: "vs. Chenango Blitz",
    primaryColor: "#8fe388",
    roster: [
      { name: "Josh Allen", position: "QB", team: "BUF", projection: 24.1 },
      { name: "Breece Hall", position: "RB", team: "NYJ", projection: 17.5 },
      { name: "Amon-Ra St. Brown", position: "WR", team: "DET", projection: 18.8 },
      { name: "Sam LaPorta", position: "TE", team: "DET", projection: 11.2 }
    ]
  },
  {
    id: "chenango-blitz",
    owner: "Maya",
    name: "Chenango Blitz",
    record: "8-3",
    rank: 2,
    pointsFor: 1397.2,
    powerScore: 93,
    streak: "W2",
    lastResult: "Beat Riverwalk Reapers, 129.9-118.3",
    nextMatchup: "at Vestal Vultures",
    primaryColor: "#f5c65b",
    roster: [
      { name: "Jalen Hurts", position: "QB", team: "PHI", projection: 23.7 },
      { name: "Bijan Robinson", position: "RB", team: "ATL", projection: 19.4 },
      { name: "CeeDee Lamb", position: "WR", team: "DAL", projection: 20.3 },
      { name: "Evan Engram", position: "TE", team: "JAX", projection: 9.7 }
    ]
  },
  {
    id: "court-st-chaos",
    owner: "Jules",
    name: "Court St. Chaos",
    record: "7-4",
    rank: 3,
    pointsFor: 1364.8,
    powerScore: 90,
    streak: "L1",
    lastResult: "Lost to Vestal Vultures, 121.8-138.4",
    nextMatchup: "vs. Parkway Punishers",
    primaryColor: "#67d9d2",
    roster: [
      { name: "Lamar Jackson", position: "QB", team: "BAL", projection: 25.2 },
      { name: "Jahmyr Gibbs", position: "RB", team: "DET", projection: 18.1 },
      { name: "Puka Nacua", position: "WR", team: "LAR", projection: 16.6 },
      { name: "Trey McBride", position: "TE", team: "ARI", projection: 12.8 }
    ]
  },
  {
    id: "parkway-punishers",
    owner: "Nate",
    name: "Parkway Punishers",
    record: "7-4",
    rank: 4,
    pointsFor: 1325.1,
    powerScore: 88,
    streak: "W1",
    lastResult: "Beat Southside Spread, 117.3-111.0",
    nextMatchup: "at Court St. Chaos",
    primaryColor: "#b7ff5a",
    roster: [
      { name: "Patrick Mahomes", position: "QB", team: "KC", projection: 22.9 },
      { name: "Jonathan Taylor", position: "RB", team: "IND", projection: 16.9 },
      { name: "Garrett Wilson", position: "WR", team: "NYJ", projection: 15.7 },
      { name: "George Kittle", position: "TE", team: "SF", projection: 11.1 }
    ]
  },
  {
    id: "riverwalk-reapers",
    owner: "Sam",
    name: "Riverwalk Reapers",
    record: "6-5",
    rank: 5,
    pointsFor: 1294.5,
    powerScore: 84,
    streak: "L2",
    lastResult: "Lost to Chenango Blitz, 118.3-129.9",
    nextMatchup: "vs. Endicott Engines",
    primaryColor: "#f88c65",
    roster: [
      { name: "C.J. Stroud", position: "QB", team: "HOU", projection: 20.5 },
      { name: "De'Von Achane", position: "RB", team: "MIA", projection: 17.2 },
      { name: "Ja'Marr Chase", position: "WR", team: "CIN", projection: 19.6 },
      { name: "Dalton Kincaid", position: "TE", team: "BUF", projection: 10.4 }
    ]
  },
  {
    id: "endicott-engines",
    owner: "Priya",
    name: "Endicott Engines",
    record: "5-6",
    rank: 6,
    pointsFor: 1248.9,
    powerScore: 79,
    streak: "W1",
    lastResult: "Beat Northside Noise, 123.5-112.1",
    nextMatchup: "at Riverwalk Reapers",
    primaryColor: "#9db2ff",
    roster: [
      { name: "Anthony Richardson", position: "QB", team: "IND", projection: 21.2 },
      { name: "Saquon Barkley", position: "RB", team: "PHI", projection: 18.7 },
      { name: "Drake London", position: "WR", team: "ATL", projection: 14.8 },
      { name: "Kyle Pitts", position: "TE", team: "ATL", projection: 8.9 }
    ]
  },
  {
    id: "southside-spread",
    owner: "Leo",
    name: "Southside Spread",
    record: "5-6",
    rank: 7,
    pointsFor: 1218.3,
    powerScore: 76,
    streak: "L1",
    lastResult: "Lost to Parkway Punishers, 111.0-117.3",
    nextMatchup: "vs. Downtown Dawgs",
    primaryColor: "#f7a7ca",
    roster: [
      { name: "Joe Burrow", position: "QB", team: "CIN", projection: 21.8 },
      { name: "Kyren Williams", position: "RB", team: "LAR", projection: 16.1 },
      { name: "Chris Olave", position: "WR", team: "NO", projection: 14.9 },
      { name: "Mark Andrews", position: "TE", team: "BAL", projection: 11.5 }
    ]
  },
  {
    id: "downtown-dawgs",
    owner: "Tara",
    name: "Downtown Dawgs",
    record: "4-7",
    rank: 8,
    pointsFor: 1196.7,
    powerScore: 72,
    streak: "W1",
    lastResult: "Beat Rec Park Rockets, 116.8-105.9",
    nextMatchup: "at Southside Spread",
    primaryColor: "#76c7ff",
    roster: [
      { name: "Jordan Love", position: "QB", team: "GB", projection: 19.2 },
      { name: "Kenneth Walker III", position: "RB", team: "SEA", projection: 15.3 },
      { name: "D.J. Moore", position: "WR", team: "CHI", projection: 14.2 },
      { name: "Jake Ferguson", position: "TE", team: "DAL", projection: 9.4 }
    ]
  },
  {
    id: "northside-noise",
    owner: "Owen",
    name: "Northside Noise",
    record: "3-8",
    rank: 9,
    pointsFor: 1139.2,
    powerScore: 66,
    streak: "L4",
    lastResult: "Lost to Endicott Engines, 112.1-123.5",
    nextMatchup: "vs. Rec Park Rockets",
    primaryColor: "#d6f36f",
    roster: [
      { name: "Brock Purdy", position: "QB", team: "SF", projection: 18.9 },
      { name: "James Cook", position: "RB", team: "BUF", projection: 15.8 },
      { name: "Tee Higgins", position: "WR", team: "CIN", projection: 13.7 },
      { name: "David Njoku", position: "TE", team: "CLE", projection: 8.6 }
    ]
  },
  {
    id: "rec-park-rockets",
    owner: "Miles",
    name: "Rec Park Rockets",
    record: "1-10",
    rank: 10,
    pointsFor: 1048.4,
    powerScore: 58,
    streak: "L5",
    lastResult: "Lost to Downtown Dawgs, 105.9-116.8",
    nextMatchup: "at Northside Noise",
    primaryColor: "#c79bff",
    roster: [
      { name: "Tua Tagovailoa", position: "QB", team: "MIA", projection: 18.1 },
      { name: "Aaron Jones", position: "RB", team: "MIN", projection: 13.6 },
      { name: "Calvin Ridley", position: "WR", team: "TEN", projection: 12.8 },
      { name: "Cole Kmet", position: "TE", team: "CHI", projection: 8.1 }
    ]
  }
];

const initialMessages: DemoMessage[] = [
  {
    id: "msg-1",
    author: "Commissioner",
    body: "Waivers process at 9:00 PM. Trade review remains 24 hours.",
    sentAt: "8:12 AM",
    tag: "Pinned"
  },
  {
    id: "msg-2",
    author: "Maya",
    body: "Chenango Blitz is listening on RB depth. Looking for a WR2.",
    sentAt: "9:04 AM"
  },
  {
    id: "msg-3",
    author: "Jules",
    body: "Power rankings are disrespectful. Court St. Chaos receipts coming Sunday.",
    sentAt: "10:31 AM"
  },
  {
    id: "msg-4",
    author: "Aazma",
    body: "Vultures are open to a two-for-one if anyone wants playoff upside.",
    sentAt: "11:18 AM"
  }
];

const bottomTabs: Array<{
  key: MobileTab;
  label: string;
  Icon: ComponentType<{ size?: number; strokeWidth?: number }>;
}> = [
  { key: "home", label: "Home", Icon: Home },
  { key: "standings", label: "Standings", Icon: Trophy },
  { key: "teams", label: "Teams", Icon: Users },
  { key: "chat", label: "Chat", Icon: MessageCircle },
  { key: "profile", label: "Profile", Icon: UserRound }
];

export default function MobileMvpApp() {
  const [entered, setEntered] = useState(false);
  const [activeTab, setActiveTab] = useState<MobileTab>("home");
  const [selectedTeamId, setSelectedTeamId] = useState(demoTeams[0].id);
  const [showTeamDetail, setShowTeamDetail] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [messageText, setMessageText] = useState("");
  const [supabase, setSupabase] = useState<BrowserSupabaseClient | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  const selectedTeam = useMemo(
    () => demoTeams.find((team) => team.id === selectedTeamId) ?? demoTeams[0],
    [selectedTeamId]
  );
  const userTeam = demoTeams[0];
  const weekLeader = demoTeams.reduce((leader, team) => (team.pointsFor > leader.pointsFor ? team : leader), demoTeams[0]);

  useEffect(() => {
    let isMounted = true;

    createRuntimeBrowserSupabaseClient()
      .then(async (client) => {
        if (!isMounted) {
          return;
        }

        setSupabase(client);
        if (!client) {
          setSessionChecked(true);
          return;
        }

        try {
          const { data, error } = await client.auth.getSession();
          if (error) {
            if (isInvalidRefreshTokenError(error)) {
              await clearLocalSupabaseAuthSession(client);
            }

            if (isMounted) {
              setUser(null);
            }
            return;
          }

          if (isMounted) {
            setUser(data.session?.user ?? null);
          }
        } catch (error) {
          if (isInvalidRefreshTokenError(error)) {
            await clearLocalSupabaseAuthSession(client);
          }

          if (isMounted) {
            setUser(null);
          }
        } finally {
          if (isMounted) {
            setSessionChecked(true);
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          setSessionChecked(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  function enterDemo() {
    setEntered(true);
    setActiveTab("home");
    setShowTeamDetail(false);
  }

  function openTeam(teamId: string) {
    setSelectedTeamId(teamId);
    setShowTeamDetail(true);
    setActiveTab("teams");
  }

  function submitMessage() {
    const body = messageText.trim();
    if (!body) {
      return;
    }

    setMessages((current) => [
      ...current,
      {
        id: `msg-${Date.now()}`,
        author: user?.email?.split("@")[0] || "You",
        body,
        sentAt: "Now"
      }
    ]);
    setMessageText("");
  }

  async function signOut() {
    await supabase?.auth.signOut();
    setUser(null);
  }

  if (!entered) {
    return (
      <main className={styles.mobileApp}>
        <section className={styles.landingShell}>
          <div className={styles.heroArtwork} aria-hidden="true">
            <div className={styles.field}>
              <span />
              <span />
              <span />
            </div>
          </div>

          <div className={styles.brandLockup}>
            <div className={styles.logoMark}>
              <Trophy size={28} />
            </div>
            <div>
              <p>FantasyPro</p>
              <h1>BAAL Mobile</h1>
            </div>
          </div>

          <div className={styles.landingCopy}>
            <p className={styles.kicker}>Binghamton league command center</p>
            <h2>Lineups, rankings, and league talk in one pocket-ready hub.</h2>
            <p>
              Demo-ready for league members with seeded data now and room to connect live Supabase data as it fills in.
            </p>
          </div>

          <div className={styles.landingActions}>
            <button className={styles.primaryButton} onClick={enterDemo} type="button">
              <Sparkles size={19} />
              Enter demo
            </button>
            <a className={styles.secondaryButton} href="/">
              <Shield size={18} />
              Full HQ login
            </a>
          </div>

          <div className={styles.landingStats}>
            <StatPill label="Teams" value={demoTeams.length.toString()} />
            <StatPill label="Leader" value={demoTeams[0].record} />
            <StatPill label="Status" value="Live" />
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.mobileApp}>
      <section className={styles.phoneShell}>
        <header className={styles.appHeader}>
          <div>
            <p className={styles.kicker}>{currentWeek}</p>
            <h1>{leagueName}</h1>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.iconButton} aria-label="League alerts" type="button">
              <Bell size={19} />
            </button>
            <button className={styles.avatarButton} aria-label="Profile" onClick={() => setActiveTab("profile")} type="button">
              {user?.email?.slice(0, 1).toUpperCase() || "A"}
            </button>
          </div>
        </header>

        <div className={styles.contentScroller}>
          {activeTab === "home" && (
            <HomeView
              onOpenChat={() => setActiveTab("chat")}
              onOpenStandings={() => setActiveTab("standings")}
              onOpenTeam={openTeam}
              userTeam={userTeam}
              weekLeader={weekLeader}
            />
          )}
          {activeTab === "standings" && (
            <StandingsView onOpenTeam={openTeam} teams={demoTeams} userTeamId={userTeam.id} />
          )}
          {activeTab === "teams" && (
            <TeamsView
              onBack={() => setShowTeamDetail(false)}
              onOpenTeam={openTeam}
              selectedTeam={selectedTeam}
              showTeamDetail={showTeamDetail}
              teams={demoTeams}
            />
          )}
          {activeTab === "chat" && (
            <ChatView
              messageText={messageText}
              messages={messages}
              onMessageTextChange={setMessageText}
              onSubmitMessage={submitMessage}
            />
          )}
          {activeTab === "profile" && (
            <ProfileView
              buildLabel={buildLabel}
              isSignedIn={Boolean(user)}
              onSignOut={signOut}
              sessionChecked={sessionChecked}
              userEmail={user?.email}
              userTeam={userTeam}
            />
          )}
        </div>

        <nav className={styles.bottomNav} aria-label="Mobile sections">
          {bottomTabs.map(({ key, label, Icon }) => (
            <button
              className={activeTab === key ? styles.bottomNavActive : ""}
              key={key}
              onClick={() => {
                setActiveTab(key);
                if (key !== "teams") {
                  setShowTeamDetail(false);
                }
              }}
              type="button"
            >
              <Icon size={19} strokeWidth={activeTab === key ? 2.8 : 2.2} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </section>
    </main>
  );
}

function HomeView({
  onOpenChat,
  onOpenStandings,
  onOpenTeam,
  userTeam,
  weekLeader
}: {
  onOpenChat: () => void;
  onOpenStandings: () => void;
  onOpenTeam: (teamId: string) => void;
  userTeam: DemoTeam;
  weekLeader: DemoTeam;
}) {
  const quickCards = [
    {
      label: "Standings",
      title: "Top 10 board",
      detail: `Leader: ${weekLeader.name}`,
      Icon: Trophy,
      onClick: onOpenStandings
    },
    {
      label: "Your matchup",
      title: userTeam.nextMatchup,
      detail: userTeam.lastResult,
      Icon: Shield,
      onClick: () => onOpenTeam(userTeam.id)
    },
    {
      label: "League wire",
      title: currentStatus,
      detail: "Commissioner note posted",
      Icon: Bell
    },
    {
      label: "Chat",
      title: "4 fresh messages",
      detail: "Trade market is active",
      Icon: MessageCircle,
      onClick: onOpenChat
    }
  ];

  return (
    <div className={styles.viewStack}>
      <section className={styles.scoreHero}>
        <div>
          <p className={styles.kicker}>League home</p>
          <h2>{currentStatus}</h2>
          <p>Top seed: {weekLeader.name}</p>
        </div>
        <div className={styles.scoreBadge}>
          <span>{userTeam.rank}</span>
          <small>Your rank</small>
        </div>
      </section>

      <section className={styles.cardGrid}>
        {quickCards.map(({ detail, Icon, label, onClick, title }) => (
          <button className={styles.quickCard} key={label} onClick={onClick} type="button">
            <span className={styles.quickIcon}>
              <Icon size={18} />
            </span>
            <span>
              <small>{label}</small>
              <strong>{title}</strong>
              <em>{detail}</em>
            </span>
            <ChevronRight size={17} />
          </button>
        ))}
      </section>

      <section className={styles.panel}>
        <PanelTitle eyebrow="Recent activity" title="League pulse" />
        <div className={styles.activityList}>
          <ActivityItem label="Trade block" value="Chenango Blitz wants WR help" />
          <ActivityItem label="Score watch" value="Vultures lead the league in points" />
          <ActivityItem label="Waivers" value="Priority resets after tonight" />
        </div>
      </section>
    </div>
  );
}

function StandingsView({
  onOpenTeam,
  teams,
  userTeamId
}: {
  onOpenTeam: (teamId: string) => void;
  teams: DemoTeam[];
  userTeamId: string;
}) {
  return (
    <div className={styles.viewStack}>
      <section className={styles.panel}>
        <PanelTitle eyebrow="Power rankings" title="Standings" />
        <div className={styles.standingsList}>
          {teams.map((team) => (
            <button
              className={`${styles.teamRankCard} ${team.id === userTeamId ? styles.userTeamCard : ""}`}
              key={team.id}
              onClick={() => onOpenTeam(team.id)}
              style={{ "--team-color": team.primaryColor } as CSSProperties}
              type="button"
            >
              <span className={styles.rankNumber}>{team.rank}</span>
              <span className={styles.rankMain}>
                <strong>{team.name}</strong>
                <small>{team.owner} · {team.record} · {team.streak}</small>
              </span>
              <span className={styles.rankScore}>
                <strong>{team.powerScore}</strong>
                <small>{team.pointsFor.toFixed(1)}</small>
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function TeamsView({
  onBack,
  onOpenTeam,
  selectedTeam,
  showTeamDetail,
  teams
}: {
  onBack: () => void;
  onOpenTeam: (teamId: string) => void;
  selectedTeam: DemoTeam;
  showTeamDetail: boolean;
  teams: DemoTeam[];
}) {
  if (showTeamDetail) {
    return <TeamDetailView onBack={onBack} team={selectedTeam} />;
  }

  return (
    <div className={styles.viewStack}>
      <section className={styles.panel}>
        <PanelTitle eyebrow="Teams" title="League clubs" />
        <div className={styles.teamList}>
          {teams.map((team) => (
            <button
              className={styles.teamListCard}
              key={team.id}
              onClick={() => onOpenTeam(team.id)}
              style={{ "--team-color": team.primaryColor } as CSSProperties}
              type="button"
            >
              <span className={styles.teamSwatch} />
              <span>
                <strong>{team.name}</strong>
                <small>{team.owner} · Rank {team.rank}</small>
              </span>
              <ChevronRight size={18} />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function TeamDetailView({ onBack, team }: { onBack: () => void; team: DemoTeam }) {
  return (
    <div className={styles.viewStack}>
      <button className={styles.backButton} onClick={onBack} type="button">
        <ArrowLeft size={18} />
        Teams
      </button>

      <section className={styles.teamHero} style={{ "--team-color": team.primaryColor } as CSSProperties}>
        <p className={styles.kicker}>Rank {team.rank}</p>
        <h2>{team.name}</h2>
        <p>{team.owner} · {team.record} · {team.streak}</p>
        <div className={styles.teamMetrics}>
          <StatPill label="Power" value={team.powerScore.toString()} />
          <StatPill label="Points" value={team.pointsFor.toFixed(1)} />
          <StatPill label="Next" value={team.nextMatchup.replace("vs. ", "").replace("at ", "")} />
        </div>
      </section>

      <section className={styles.panel}>
        <PanelTitle eyebrow="Roster" title="Projected starters" />
        <div className={styles.rosterList}>
          {team.roster.map((player) => (
            <div className={styles.rosterRow} key={player.name}>
              <span>
                <strong>{player.name}</strong>
                <small>{player.position} · {player.team}</small>
              </span>
              <b>{player.projection.toFixed(1)}</b>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.panel}>
        <PanelTitle eyebrow="Result" title="Recent matchup" />
        <p className={styles.detailText}>{team.lastResult}</p>
      </section>
    </div>
  );
}

function ChatView({
  messageText,
  messages,
  onMessageTextChange,
  onSubmitMessage
}: {
  messageText: string;
  messages: DemoMessage[];
  onMessageTextChange: (value: string) => void;
  onSubmitMessage: () => void;
}) {
  return (
    <div className={styles.chatView}>
      <section className={styles.panel}>
        <PanelTitle eyebrow="League chat" title="Message board" />
        <div className={styles.messageList}>
          {messages.map((message) => (
            <article className={styles.messageBubble} key={message.id}>
              <div>
                <strong>{message.author}</strong>
                <span>{message.sentAt}</span>
              </div>
              <p>{message.body}</p>
              {message.tag && <small>{message.tag}</small>}
            </article>
          ))}
        </div>
      </section>

      <form
        className={styles.composer}
        onSubmit={(event) => {
          event.preventDefault();
          onSubmitMessage();
        }}
      >
        <input
          aria-label="Message"
          onChange={(event) => onMessageTextChange(event.target.value)}
          placeholder="Message the league"
          value={messageText}
        />
        <button aria-label="Send message" type="submit">
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}

function ProfileView({
  buildLabel,
  isSignedIn,
  onSignOut,
  sessionChecked,
  userEmail,
  userTeam
}: {
  buildLabel: string;
  isSignedIn: boolean;
  onSignOut: () => void;
  sessionChecked: boolean;
  userEmail?: string;
  userTeam: DemoTeam;
}) {
  return (
    <div className={styles.viewStack}>
      <section className={styles.profileCard}>
        <div className={styles.profileAvatar}>{userEmail?.slice(0, 1).toUpperCase() || "A"}</div>
        <div>
          <p className={styles.kicker}>{isSignedIn ? "Signed in" : sessionChecked ? "Demo session" : "Checking session"}</p>
          <h2>{userEmail || "Aazma"}</h2>
          <p>{userTeam.name} · {userTeam.record}</p>
        </div>
      </section>

      <section className={styles.panel}>
        <PanelTitle eyebrow="Install" title="Home screen" />
        <div className={styles.installList}>
          <InstructionStep icon={<Share size={17} />} label="iPhone Safari" value="Share, then Add to Home Screen" />
          <InstructionStep icon={<Plus size={17} />} label="Android Chrome" value="Install app or Add to Home screen" />
        </div>
      </section>

      <section className={styles.panel}>
        <PanelTitle eyebrow="Settings" title="Profile" />
        <div className={styles.settingsList}>
          <ActivityItem label="Team" value={userTeam.name} />
          <ActivityItem label="Build" value={buildLabel} />
          <ActivityItem label="Data" value="Seeded demo fallback" />
        </div>
        {isSignedIn && (
          <button className={styles.logoutButton} onClick={onSignOut} type="button">
            <LogOut size={18} />
            Logout
          </button>
        )}
      </section>
    </div>
  );
}

function PanelTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className={styles.panelTitle}>
      <p className={styles.kicker}>{eyebrow}</p>
      <h2>{title}</h2>
    </div>
  );
}

function ActivityItem({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.activityItem}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function InstructionStep({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className={styles.instructionStep}>
      <span>{icon}</span>
      <div>
        <strong>{label}</strong>
        <small>{value}</small>
      </div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.statPill}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
