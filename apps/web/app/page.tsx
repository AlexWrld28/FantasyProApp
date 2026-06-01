"use client";

import {
  Activity,
  ArrowLeftRight,
  AtSign,
  BrainCircuit,
  CalendarClock,
  Check,
  ClipboardList,
  Eye,
  EyeOff,
  Gauge,
  Hash,
  Home,
  Lock,
  MapPinned,
  MessageCircle,
  Settings,
  Shield,
  SlidersHorizontal,
  Search,
  Send,
  Sparkles,
  Trophy,
  Users,
  Zap
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  buildMatchup,
  defaultScoringRules,
  formatPoints,
  scoreTeam,
  type FantasyPlayer,
  type FantasyTeam,
  type ScoringRules
} from "@baal/fantasy-engine";
import { baalLegacyCapabilities } from "@baal/football-data";
import { StadiumMap } from "../components/StadiumMap";
import {
  leagueTeams,
  recentActivity,
  tradeTeams,
  waiverTargets,
  type ChatMessage,
  type DirectThread,
  type Presence,
  type TradeAsset,
  type TradeTeam
} from "../lib/sample-data";
import {
  createRuntimeBrowserSupabaseClient,
  type BrowserSupabaseClient
} from "../lib/supabase";
import { stadiumMapEntries, type StadiumMapEntry } from "../lib/stadium-data";

type ViewKey = "dashboard" | "scoring" | "rosters" | "chat" | "trade" | "map" | "settings";
type ChatMode = "league" | "dm";
type TradeMode = "win-now" | "balanced" | "keeper";
type TradeVoteChoice = "approve" | "veto";

type TradePreferences = {
  mode: TradeMode;
  riskTolerance: number;
  keeperWeight: number;
  needWeight: number;
};

type TradeVote = {
  manager: string;
  team: string;
  vote: TradeVoteChoice;
};

type ChatManager = {
  avatarUrl: string | null;
  displayName: string;
  email?: string;
  id: string;
  initials: string;
  lastSignInAt?: string;
  presence: Presence;
  team: string;
};

type ApiDirectMessage = {
  body: string;
  createdAt: string;
  id: string;
  isSelf: boolean;
  recipientId: string;
  senderId: string;
};

type UserTradeProposal = {
  aiFairnessScore: number | null;
  aiNetEdge: number | null;
  createdAt: string;
  id: string;
  incomingAssets: Array<{ label: string; value?: number }>;
  note: string | null;
  outgoingAssets: Array<{ label: string; value?: number }>;
  recipientId: string;
  senderId: string;
  status: string;
  updatedAt: string;
};

type Profile = {
  avatar_url: string | null;
  display_name: string;
  id: string;
};

type AuthMode = "sign-in" | "sign-up";

type AdminLeague = {
  name: string;
  season_year: number;
};

type AdminMembership = {
  joined_at: string;
  leagues: AdminLeague | null;
  role: string;
  user_id: string;
};

type AdminTeam = {
  faab_remaining: number;
  leagues: AdminLeague | null;
  manager_id: string;
  name: string;
  record_losses: number;
  record_wins: number;
};

type AdminUser = {
  appMetadata: Record<string, unknown>;
  confirmedAt?: string;
  createdAt: string;
  email?: string;
  id: string;
  lastSignInAt?: string;
  memberships: AdminMembership[];
  phone?: string;
  profile: Profile | null;
  teams: AdminTeam[];
  updatedAt?: string;
  userMetadata: Record<string, unknown>;
};

const views: Array<{ key: ViewKey; label: string; icon: React.ComponentType<{ size?: number }> }> = [
  { key: "dashboard", label: "Dashboard", icon: Home },
  { key: "scoring", label: "Scoring", icon: Gauge },
  { key: "rosters", label: "Rosters", icon: Users },
  { key: "chat", label: "Chat", icon: MessageCircle },
  { key: "trade", label: "Trade", icon: ArrowLeftRight },
  { key: "map", label: "Map", icon: MapPinned },
  { key: "settings", label: "Settings", icon: Settings }
];

const scoringInputs: Array<{ key: keyof ScoringRules; label: string; suffix: string }> = [
  { key: "passingYardsPerPoint", label: "Pass yards per point", suffix: "yd" },
  { key: "passingTouchdown", label: "Pass TD", suffix: "pts" },
  { key: "interception", label: "Interception", suffix: "pts" },
  { key: "rushingYardsPerPoint", label: "Rush yards per point", suffix: "yd" },
  { key: "rushingTouchdown", label: "Rush TD", suffix: "pts" },
  { key: "reception", label: "Reception", suffix: "pts" },
  { key: "receivingYardsPerPoint", label: "Rec yards per point", suffix: "yd" },
  { key: "receivingTouchdown", label: "Rec TD", suffix: "pts" },
  { key: "fumbleLost", label: "Fumble lost", suffix: "pts" },
  { key: "twoPointConversion", label: "Two point", suffix: "pts" },
  { key: "fieldGoal", label: "Field goal", suffix: "pts" },
  { key: "extraPoint", label: "Extra point", suffix: "pts" },
  { key: "sack", label: "Sack", suffix: "pts" },
  { key: "turnoverForced", label: "Takeaway", suffix: "pts" },
  { key: "defensiveTouchdown", label: "Defensive TD", suffix: "pts" },
  { key: "pointsAllowedUnder7", label: "PA 0-6", suffix: "pts" },
  { key: "pointsAllowedUnder14", label: "PA 7-13", suffix: "pts" },
  { key: "pointsAllowedOver34", label: "PA 35+", suffix: "pts" }
];

export default function HomePage() {
  const [supabase, setSupabase] = useState<BrowserSupabaseClient | null>(null);
  const [configResolved, setConfigResolved] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeView, setActiveView] = useState<ViewKey>("dashboard");
  const [rules, setRules] = useState<ScoringRules>(defaultScoringRules);
  const [selectedTeamId, setSelectedTeamId] = useState(leagueTeams[0].id);
  const [selectedStadiumId, setSelectedStadiumId] = useState(stadiumMapEntries[0].id);
  const [yourTradeTeamId, setYourTradeTeamId] = useState(tradeTeams[0].id);
  const [partnerTradeTeamId, setPartnerTradeTeamId] = useState(tradeTeams[1].id);
  const [pprEnabled, setPprEnabled] = useState(true);
  const [waiverLock, setWaiverLock] = useState(true);
  const [tradeReview, setTradeReview] = useState(false);

  const selectedTeam = leagueTeams.find((team) => team.id === selectedTeamId) ?? leagueTeams[0];
  const selectedStadium =
    stadiumMapEntries.find((stadium) => stadium.id === selectedStadiumId) ?? stadiumMapEntries[0];
  const matchup = useMemo(() => buildMatchup(leagueTeams[0], leagueTeams[1], rules), [rules]);
  const selectedScore = useMemo(() => scoreTeam(selectedTeam, rules), [rules, selectedTeam]);

  useEffect(() => {
    let isMounted = true;

    createRuntimeBrowserSupabaseClient().then((client) => {
      if (!isMounted) {
        return;
      }

      setSupabase(client);
      setConfigResolved(true);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!configResolved) {
      return;
    }

    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }

      setUser(data.session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, [configResolved, supabase]);

  useEffect(() => {
    if (!supabase || !user) {
      setProfile(null);
      return;
    }

    let isMounted = true;

    supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (isMounted) {
          setProfile(data);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [supabase, user]);

  function updateRule(key: keyof ScoringRules, rawValue: string) {
    const nextValue = Number(rawValue);
    setRules((current) => ({
      ...current,
      [key]: Number.isFinite(nextValue) ? nextValue : 0
    }));
  }

  function setPpr(nextValue: boolean) {
    setPprEnabled(nextValue);
    setRules((current) => ({
      ...current,
      reception: nextValue ? 1 : 0
    }));
  }

  if (!configResolved || authLoading) {
    return <AuthShell title="Checking session" description="Connecting to Supabase authentication." />;
  }

  if (!supabase) {
    return (
      <AuthShell
        title="Supabase is not configured"
        description="Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your local environment to enable account access."
      />
    );
  }

  if (!user) {
    return <AuthView supabase={supabase} />;
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Trophy size={22} />
          </div>
          <div>
            <p className="eyebrow">BAAL League</p>
            <h1>Fantasy HQ</h1>
          </div>
        </div>

        <nav className="nav-list" aria-label="Primary">
          {views.map((view) => {
            const Icon = view.icon;
            return (
              <button
                className={activeView === view.key ? "nav-item active" : "nav-item"}
                key={view.key}
                onClick={() => setActiveView(view.key)}
                type="button"
              >
                <Icon size={18} />
                <span>{view.label}</span>
                {view.key === "chat" && <b className="nav-badge">3</b>}
                {view.key === "trade" && <b className="nav-badge hot">AI</b>}
              </button>
            );
          })}
        </nav>

        <div className="engine-panel">
          <div className="panel-heading">
            <Zap size={16} />
            <span>BAAL Engine</span>
          </div>
          {baalLegacyCapabilities.slice(0, 4).map((capability) => (
            <div className="capability" key={capability}>
              <Check size={14} />
              <span>{capability}</span>
            </div>
          ))}
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow live-eyebrow">
              <span className="live-dot" />
              Week 12 Live Board
            </p>
            <h2>{viewTitle(activeView)}</h2>
          </div>
          <div className="topbar-actions">
            <div className="account-chip">
              <Avatar initials={accountInitials(profile, user)} />
              <span>
                <strong>{profile?.display_name || user.email || "Manager"}</strong>
                <small>Signed in</small>
              </span>
            </div>
            <button className="icon-button" type="button" aria-label="League lock">
              <Lock size={18} />
            </button>
            <button className="primary-action" type="button">
              <Users size={17} />
              Invite
            </button>
          </div>
        </header>

        <SportsTicker />

        {activeView === "dashboard" && <DashboardView matchup={matchup} />}
        {activeView === "scoring" && <ScoringView matchup={matchup} />}
        {activeView === "rosters" && (
          <RostersView
            selectedScore={selectedScore}
            selectedTeamId={selectedTeamId}
            setSelectedTeamId={setSelectedTeamId}
          />
        )}
        {activeView === "chat" && <ChatView profile={profile} supabase={supabase} user={user} />}
        {activeView === "trade" && (
          <TradeBuilderView
            partnerTradeTeamId={partnerTradeTeamId}
            supabase={supabase}
            setPartnerTradeTeamId={setPartnerTradeTeamId}
            setYourTradeTeamId={setYourTradeTeamId}
            user={user}
            yourTradeTeamId={yourTradeTeamId}
          />
        )}
        {activeView === "map" && (
          <MapView selectedStadium={selectedStadium} setSelectedStadiumId={setSelectedStadiumId} />
        )}
        {activeView === "settings" && (
          <SettingsView
            pprEnabled={pprEnabled}
            rules={rules}
            tradeReview={tradeReview}
            updateRule={updateRule}
            waiverLock={waiverLock}
            setPpr={setPpr}
            setTradeReview={setTradeReview}
            setWaiverLock={setWaiverLock}
            supabase={supabase}
            user={user}
            profile={profile}
            setProfile={setProfile}
          />
        )}
      </section>
    </main>
  );
}

function AuthShell({ description, title }: { description: string; title: string }) {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="brand auth-brand">
          <div className="brand-mark">
            <Trophy size={22} />
          </div>
          <div>
            <p className="eyebrow">BAAL League</p>
            <h1>Fantasy HQ</h1>
          </div>
        </div>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </section>
    </main>
  );
}

function AuthView({ supabase }: { supabase: BrowserSupabaseClient }) {
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitAuth() {
    setSubmitting(true);
    setError("");
    setStatus("");

    const trimmedEmail = email.trim();
    const authResult =
      mode === "sign-in"
        ? await supabase.auth.signInWithPassword({ email: trimmedEmail, password })
        : await supabase.auth.signUp({
            email: trimmedEmail,
            password,
            options: {
              data: {
                display_name: displayName.trim() || trimmedEmail.split("@")[0]
              }
            }
          });

    setSubmitting(false);

    if (authResult.error) {
      setError(authResult.error.message);
      return;
    }

    if (mode === "sign-up" && !authResult.data.session) {
      setStatus("Check your email to confirm the account, then sign in.");
    }
  }

  async function sendPasswordReset() {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Enter your email first.");
      return;
    }

    setSubmitting(true);
    setError("");
    setStatus("");
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo: window.location.origin
    });
    setSubmitting(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setStatus("Password reset email sent.");
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="brand auth-brand">
          <div className="brand-mark">
            <Trophy size={22} />
          </div>
          <div>
            <p className="eyebrow">BAAL League</p>
            <h1>Fantasy HQ</h1>
          </div>
        </div>

        <div className="auth-copy">
          <h2>{mode === "sign-in" ? "Sign in to your league" : "Create your manager account"}</h2>
          <p>Accounts are backed by Supabase Auth and connected to the league profile table.</p>
        </div>

        <form
          className="auth-form"
          onSubmit={(event) => {
            event.preventDefault();
            void submitAuth();
          }}
        >
          <div className="auth-mode-switch">
            <button className={mode === "sign-in" ? "selected" : ""} onClick={() => setMode("sign-in")} type="button">
              Sign in
            </button>
            <button className={mode === "sign-up" ? "selected" : ""} onClick={() => setMode("sign-up")} type="button">
              Sign up
            </button>
          </div>

          {mode === "sign-up" && (
            <label className="form-field">
              <span>Display name</span>
              <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
            </label>
          )}

          <label className="form-field">
            <span>Email</span>
            <input autoComplete="email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>

          <label className="form-field">
            <span>Password</span>
            <PasswordInput
              autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
              label="Password"
              minLength={6}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {error && <p className="form-message error">{error}</p>}
          {status && <p className="form-message success">{status}</p>}

          <button className="primary-action auth-submit" disabled={submitting} type="submit">
            {submitting ? "Working..." : mode === "sign-in" ? "Sign in" : "Create account"}
          </button>
          {mode === "sign-in" && (
            <button className="text-button" disabled={submitting} onClick={() => void sendPasswordReset()} type="button">
              Send password reset
            </button>
          )}
        </form>
      </section>
    </main>
  );
}

function SportsTicker() {
  const tickerItems = [
    "League update: Waivers lock in 18m",
    "League update: Trade review window closes tonight",
    "League update: Fourth Down Syndicate projected +8.4",
    "Player stat: Bijan Robinson 112 rush yds and 2 TD",
    "Player stat: CeeDee Lamb 9 catches for 138 yds",
    "Player stat: Josh Allen 31.6 fantasy points"
  ];

  return (
    <section className="sports-ticker" aria-label="League ticker">
      <span className="ticker-label">HQ Wire</span>
      <div className="ticker-viewport">
        <div className="ticker-track">
          {[...tickerItems, ...tickerItems].map((item, index) => (
            <span key={`${item}-${index}`}>{item}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

function TradeBuilderView({
  partnerTradeTeamId,
  supabase,
  setPartnerTradeTeamId,
  setYourTradeTeamId,
  user,
  yourTradeTeamId
}: {
  partnerTradeTeamId: string;
  supabase: BrowserSupabaseClient;
  setPartnerTradeTeamId: (teamId: string) => void;
  setYourTradeTeamId: (teamId: string) => void;
  user: User;
  yourTradeTeamId: string;
}) {
  const [outgoingIds, setOutgoingIds] = useState<string[]>(["trade-p-4", "trade-p-5"]);
  const [incomingIds, setIncomingIds] = useState<string[]>(["trade-p-10"]);
  const [preferences, setPreferences] = useState<TradePreferences>({
    mode: "win-now",
    riskTolerance: 52,
    keeperWeight: 38,
    needWeight: 72
  });
  const [tradeVotes, setTradeVotes] = useState<TradeVote[]>([
    { manager: "Maya", team: "North End Zone", vote: "approve" },
    { manager: "Jordan", team: "Option Route", vote: "veto" },
    { manager: "Sam", team: "Nickel Blitz", vote: "approve" }
  ]);
  const [tradeManagers, setTradeManagers] = useState<ChatManager[]>([]);
  const [selectedRecipientId, setSelectedRecipientId] = useState("");
  const [tradeProposals, setTradeProposals] = useState<UserTradeProposal[]>([]);
  const [tradeWorkflowError, setTradeWorkflowError] = useState("");
  const [tradeWorkflowStatus, setTradeWorkflowStatus] = useState("");
  const [tradeWorkflowLoading, setTradeWorkflowLoading] = useState(true);
  const [sendingProposal, setSendingProposal] = useState(false);

  const yourTeam = tradeTeams.find((team) => team.id === yourTradeTeamId) ?? tradeTeams[0];
  const partnerTeam =
    tradeTeams.find((team) => team.id === partnerTradeTeamId && team.id !== yourTeam.id) ??
    tradeTeams.find((team) => team.id !== yourTeam.id) ??
    tradeTeams[1];
  const outgoingAssets = yourTeam.assets.filter((asset) => outgoingIds.includes(asset.id));
  const incomingAssets = partnerTeam.assets.filter((asset) => incomingIds.includes(asset.id));
  const analysis = analyzeTrade(outgoingAssets, incomingAssets, yourTeam, partnerTeam, preferences);
  const voteSummary = summarizeTradeVotes(tradeVotes);
  const yourVote = tradeVotes.find((vote) => vote.manager === yourTeam.manager)?.vote;
  const realTradePartners = tradeManagers.filter((manager) => manager.id !== user.id);

  useEffect(() => {
    let isMounted = true;

    async function loadTradeWorkflow() {
      const token = await getAccessToken(supabase);
      if (!token) {
        if (isMounted) {
          setTradeWorkflowError("Your session expired. Sign in again.");
          setTradeWorkflowLoading(false);
        }
        return;
      }

      const [managerResponse, proposalResponse] = await Promise.all([
        fetch("/api/users/managers", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch("/api/trades/proposals", {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      const managerPayload = (await managerResponse.json()) as { error?: string; managers?: ChatManager[] };
      const proposalPayload = (await proposalResponse.json()) as { error?: string; proposals?: UserTradeProposal[] };

      if (!isMounted) {
        return;
      }

      setTradeWorkflowLoading(false);

      if (!managerResponse.ok) {
        setTradeWorkflowError(managerPayload.error ?? "Unable to load real trade partners.");
        return;
      }

      if (!proposalResponse.ok) {
        setTradeWorkflowError(proposalPayload.error ?? "Unable to load trade proposals.");
        return;
      }

      const nextManagers = managerPayload.managers ?? [];
      const nextPartners = nextManagers.filter((manager) => manager.id !== user.id);
      setTradeManagers(nextManagers);
      setSelectedRecipientId((current) => current || nextPartners[0]?.id || "");
      setTradeProposals(proposalPayload.proposals ?? []);
    }

    void loadTradeWorkflow();

    return () => {
      isMounted = false;
    };
  }, [supabase, user.id]);

  function updateYourTeam(teamId: string) {
    setYourTradeTeamId(teamId);
    const nextTeam = tradeTeams.find((team) => team.id === teamId) ?? tradeTeams[0];
    setOutgoingIds(nextTeam.assets.slice(0, 1).map((asset) => asset.id));
    if (teamId === partnerTeam.id) {
      const nextPartner = tradeTeams.find((team) => team.id !== teamId) ?? tradeTeams[1];
      setPartnerTradeTeamId(nextPartner.id);
      setIncomingIds(nextPartner.assets.slice(0, 1).map((asset) => asset.id));
    }
  }

  function updatePartnerTeam(teamId: string) {
    setPartnerTradeTeamId(teamId);
    const nextTeam = tradeTeams.find((team) => team.id === teamId) ?? tradeTeams[1];
    setIncomingIds(nextTeam.assets.slice(0, 1).map((asset) => asset.id));
  }

  function castTradeVote(vote: TradeVoteChoice) {
    setTradeVotes((votes) => {
      const existingVote = votes.find((entry) => entry.manager === yourTeam.manager);
      if (existingVote) {
        return votes.map((entry) => (entry.manager === yourTeam.manager ? { ...entry, team: yourTeam.name, vote } : entry));
      }

      return [...votes, { manager: yourTeam.manager, team: yourTeam.name, vote }];
    });
  }

  async function sendTradeProposal() {
    if (!selectedRecipientId) {
      setTradeWorkflowError("Select a real trade partner first.");
      return;
    }

    const token = await getAccessToken(supabase);
    if (!token) {
      setTradeWorkflowError("Your session expired. Sign in again.");
      return;
    }

    setSendingProposal(true);
    setTradeWorkflowError("");
    setTradeWorkflowStatus("");

    const response = await fetch("/api/trades/proposals", {
      body: JSON.stringify({
        aiFairnessScore: analysis.fairnessScore,
        aiNetEdge: analysis.netEdge,
        incomingAssets: incomingAssets.map(tradeAssetToPayload),
        note: analysis.verdict,
        outgoingAssets: outgoingAssets.map(tradeAssetToPayload),
        recipientId: selectedRecipientId
      }),
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      method: "POST"
    });
    const payload = (await response.json()) as { error?: string; proposal?: UserTradeProposal };

    setSendingProposal(false);

    if (!response.ok || !payload.proposal) {
      setTradeWorkflowError(payload.error ?? "Unable to send trade proposal.");
      return;
    }

    setTradeProposals((proposals) => [payload.proposal!, ...proposals]);
    setTradeWorkflowStatus("Trade proposal sent.");
  }

  async function updateTradeProposalStatus(proposalId: string, status: "accepted" | "declined" | "voting") {
    const token = await getAccessToken(supabase);
    if (!token) {
      setTradeWorkflowError("Your session expired. Sign in again.");
      return;
    }

    setTradeWorkflowError("");
    setTradeWorkflowStatus("");

    const response = await fetch(`/api/trades/proposals/${proposalId}`, {
      body: JSON.stringify({ status }),
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      method: "PATCH"
    });
    const payload = (await response.json()) as { error?: string; proposal?: UserTradeProposal };

    if (!response.ok || !payload.proposal) {
      setTradeWorkflowError(payload.error ?? "Unable to update trade proposal.");
      return;
    }

    setTradeProposals((proposals) =>
      proposals.map((proposal) => (proposal.id === proposalId ? payload.proposal! : proposal))
    );
    setTradeWorkflowStatus(`Trade proposal ${status}.`);
  }

  return (
    <div className="view-grid trade-grid">
      <section className="section-panel trade-builder-panel">
        <PanelTitle icon={ArrowLeftRight} title="Trade Builder" />
        <div className="trade-team-selectors">
          <label>
            <span>Your team</span>
            <select value={yourTeam.id} onChange={(event) => updateYourTeam(event.target.value)}>
              {tradeTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Trade partner</span>
            <select value={partnerTeam.id} onChange={(event) => updatePartnerTeam(event.target.value)}>
              {tradeTeams
                .filter((team) => team.id !== yourTeam.id)
                .map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
            </select>
          </label>
          <label>
            <span>Send proposal to</span>
            <select
              value={selectedRecipientId}
              onChange={(event) => setSelectedRecipientId(event.target.value)}
              disabled={!realTradePartners.length}
            >
              {realTradePartners.length ? (
                realTradePartners.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.displayName}
                  </option>
                ))
              ) : (
                <option value="">No real users available</option>
              )}
            </select>
          </label>
        </div>

        <div className="trade-offer-board">
          <TradeAssetColumn
            assets={yourTeam.assets}
            selectedIds={outgoingIds}
            team={yourTeam}
            title="You Send"
            toggleAsset={(assetId) => setOutgoingIds((ids) => toggleId(ids, assetId))}
          />
          <div className="trade-center-meter">
            <span className="trade-meter-label">AI Fairness</span>
            <strong>{analysis.fairnessScore}</strong>
            <div className="fairness-bar" aria-label="Trade fairness">
              <span style={{ width: `${analysis.fairnessScore}%` }} />
            </div>
            <p>{analysis.recommendation}</p>
          </div>
          <TradeAssetColumn
            assets={partnerTeam.assets}
            selectedIds={incomingIds}
            team={partnerTeam}
            title="You Receive"
            toggleAsset={(assetId) => setIncomingIds((ids) => toggleId(ids, assetId))}
          />
        </div>
        <div className="trade-submit-row">
          <div>
            <strong>Ready to white-box test?</strong>
            <span>Send this package to a real account, then accept or decline it from the other login.</span>
          </div>
          <button
            className="primary-action"
            disabled={sendingProposal || !selectedRecipientId || tradeWorkflowLoading}
            onClick={() => void sendTradeProposal()}
            type="button"
          >
            {sendingProposal ? "Sending..." : "Propose trade"}
          </button>
        </div>
        {tradeWorkflowError && <p className="form-message error">{tradeWorkflowError}</p>}
        {tradeWorkflowStatus && <p className="form-message success">{tradeWorkflowStatus}</p>}
      </section>

      <TradeProposalInbox
        managers={tradeManagers}
        proposals={tradeProposals}
        updateProposalStatus={updateTradeProposalStatus}
        userId={user.id}
      />

      <section className="section-panel decision-panel">
        <PanelTitle icon={BrainCircuit} title="AI Decision Lab" />
        <div className="trade-mode-switch">
          {(["win-now", "balanced", "keeper"] as TradeMode[]).map((mode) => (
            <button
              className={preferences.mode === mode ? "selected" : ""}
              key={mode}
              onClick={() => setPreferences((current) => ({ ...current, mode }))}
              type="button"
            >
              {tradeModeLabel(mode)}
            </button>
          ))}
        </div>
        <PreferenceSlider
          label="Risk tolerance"
          value={preferences.riskTolerance}
          onChange={(riskTolerance) => setPreferences((current) => ({ ...current, riskTolerance }))}
        />
        <PreferenceSlider
          label="Keeper upside"
          value={preferences.keeperWeight}
          onChange={(keeperWeight) => setPreferences((current) => ({ ...current, keeperWeight }))}
        />
        <PreferenceSlider
          label="Need fit"
          value={preferences.needWeight}
          onChange={(needWeight) => setPreferences((current) => ({ ...current, needWeight }))}
        />
        <div className="need-chip-row">
          {yourTeam.needs.map((need) => (
            <span key={need}>{need} need</span>
          ))}
        </div>
      </section>

      <section className="section-panel analytics-panel">
        <PanelTitle icon={Sparkles} title="Trade AI Analytics" />
        <div className="trade-grade-row">
          <Metric label="You receive" value={analysis.incomingValue.toFixed(1)} />
          <Metric label="You send" value={analysis.outgoingValue.toFixed(1)} />
          <Metric label="Net edge" value={signedNumber(analysis.netEdge)} />
        </div>
        <div className="ai-verdict">
          <strong>{analysis.verdict}</strong>
          <p>{analysis.summary}</p>
        </div>
        <div className="insight-list">
          {analysis.insights.map((insight) => (
            <div className="insight-row" key={insight}>
              <Check size={15} />
              <span>{insight}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={`section-panel trade-vote-panel ${voteSummary.result}`}>
        <PanelTitle icon={Shield} title="League Trade Vote" />
        <div className="vote-scoreboard">
          <div>
            <span>Push through</span>
            <strong>{voteSummary.approveVotes}</strong>
          </div>
          <div>
            <span>Veto</span>
            <strong>{voteSummary.vetoVotes}</strong>
          </div>
        </div>
        <div className="vote-result-banner">
          <span>{tradeVoteResultLabel(voteSummary.result)}</span>
          <strong>{tradeVoteResultDetail(voteSummary.result)}</strong>
        </div>
        <div className="vote-actions">
          <button
            className={yourVote === "approve" ? "selected approve" : "approve"}
            onClick={() => castTradeVote("approve")}
            type="button"
          >
            Push trade through
          </button>
          <button
            className={yourVote === "veto" ? "selected veto" : "veto"}
            onClick={() => castTradeVote("veto")}
            type="button"
          >
            Veto trade
          </button>
        </div>
        <div className="vote-ledger">
          {tradeVotes.map((vote) => (
            <div className="vote-ledger-row" key={vote.manager}>
              <span>
                <strong>{vote.manager}</strong>
                <small>{vote.team}</small>
              </span>
              <b className={vote.vote}>{vote.vote === "approve" ? "Push" : "Veto"}</b>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ChatView({
  profile,
  supabase,
  user
}: {
  profile: Profile | null;
  supabase: BrowserSupabaseClient;
  user: User;
}) {
  const [chatMode, setChatMode] = useState<ChatMode>("league");
  const [leagueMessages, setLeagueMessages] = useState<ChatMessage[]>([]);
  const [dmThreads, setDmThreads] = useState<DirectThread[]>([]);
  const [managers, setManagers] = useState<ChatManager[]>([]);
  const [managersError, setManagersError] = useState("");
  const [managersLoading, setManagersLoading] = useState(true);
  const [selectedThreadId, setSelectedThreadId] = useState("");
  const [messageError, setMessageError] = useState("");
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [draft, setDraft] = useState("");

  const selfIdentity = getChatIdentity(profile, user);
  const activeManagers = managers.filter((member) => member.id !== user.id);
  const selectedThread = dmThreads.find((thread) => thread.id === selectedThreadId);
  const selectedMember =
    activeManagers.find((member) => directThreadId(member.id) === selectedThreadId) ?? activeManagers[0] ?? null;
  const activeDmThread = selectedThread ?? (selectedMember ? createEmptyDirectThread(selectedMember) : null);
  const activeMessages = chatMode === "league" ? leagueMessages : (activeDmThread?.messages ?? []);
  const activeTitle = chatMode === "league" ? "League Lobby" : (activeDmThread?.manager ?? "Direct Messages");
  const activeSubtitle =
    chatMode === "league"
      ? "League-wide trades, waivers, matchup notes, and commissioner updates"
      : activeDmThread
        ? `${activeDmThread.team} | ${activeDmThread.presence}`
        : "Select a real league account to start a direct message";

  useEffect(() => {
    let isMounted = true;

    async function loadManagers() {
      const token = await getAccessToken(supabase);
      if (!token) {
        if (isMounted) {
          setManagersError("Your session expired. Sign in again.");
          setManagersLoading(false);
        }
        return;
      }

      const response = await fetch("/api/users/managers", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const payload = (await response.json()) as { error?: string; managers?: ChatManager[] };

      if (!isMounted) {
        return;
      }

      setManagersLoading(false);

      if (!response.ok) {
        setManagersError(payload.error ?? "Unable to load real league users.");
        return;
      }

      setManagers(payload.managers ?? []);
    }

    void loadManagers();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  async function loadDirectMessages(member: ChatManager) {
    const token = await getAccessToken(supabase);
    if (!token) {
      setMessageError("Your session expired. Sign in again.");
      return;
    }

    setMessagesLoading(true);
    setMessageError("");

    const response = await fetch(`/api/chat/direct?peerId=${encodeURIComponent(member.id)}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const payload = (await response.json()) as { error?: string; messages?: ApiDirectMessage[] };

    setMessagesLoading(false);

    if (!response.ok) {
      setMessageError(payload.error ?? "Unable to load direct messages.");
      return;
    }

    const messages = (payload.messages ?? []).map((message) => directMessageToChatMessage(message, member, selfIdentity));
    setDmThreads((threads) =>
      upsertDirectThread(threads, {
        ...createEmptyDirectThread(member),
        lastMessage: messages.at(-1)?.body ?? "Start a direct conversation",
        messages
      })
    );
  }

  function openDirectMessage(member: ChatManager) {
    const threadId = directThreadId(member.id);
    setChatMode("dm");
    setSelectedThreadId(threadId);
    setDmThreads((threads) => {
      if (threads.some((thread) => thread.id === threadId)) {
        return threads.map((thread) => (thread.id === threadId ? { ...thread, unreadCount: 0 } : thread));
      }

      return [...threads, createEmptyDirectThread(member)];
    });
    void loadDirectMessages(member);
  }

  async function sendMessage() {
    const body = draft.trim();
    if (!body) {
      return;
    }

    const message: ChatMessage = {
      id: `local-${Date.now()}`,
      author: selfIdentity.manager,
      team: selfIdentity.team,
      initials: selfIdentity.initials,
      body,
      sentAt: "Now",
      isSelf: true
    };

    if (chatMode === "league") {
      setLeagueMessages((messages) => [...messages, message]);
    } else if (activeDmThread) {
      const recipient = activeManagers.find((manager) => directThreadId(manager.id) === activeDmThread.id);
      if (!recipient) {
        setMessageError("Select a real manager before sending.");
        return;
      }

      const token = await getAccessToken(supabase);
      if (!token) {
        setMessageError("Your session expired. Sign in again.");
        return;
      }

      setSendingMessage(true);
      setMessageError("");

      const response = await fetch("/api/chat/direct", {
        body: JSON.stringify({
          body,
          recipientId: recipient.id
        }),
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        method: "POST"
      });
      const payload = (await response.json()) as { error?: string; message?: ApiDirectMessage };

      setSendingMessage(false);

      if (!response.ok || !payload.message) {
        setMessageError(payload.error ?? "Unable to send direct message.");
        return;
      }

      const savedMessage = directMessageToChatMessage(payload.message, recipient, selfIdentity);
      setDmThreads((threads) =>
        upsertDirectThread(threads, {
          ...activeDmThread,
          lastMessage: savedMessage.body,
          messages: [...activeDmThread.messages.filter((existing) => existing.id !== savedMessage.id), savedMessage],
          unreadCount: 0
        })
      );
    }

    setDraft("");
  }

  return (
    <div className="view-grid chat-grid">
      <section className="section-panel chat-sidebar-panel">
        <PanelTitle icon={MessageCircle} title="League Comms" />
        <div className="chat-mode-switch">
          <button
            className={chatMode === "league" ? "selected" : ""}
            onClick={() => setChatMode("league")}
            type="button"
          >
            <Hash size={16} />
            League
          </button>
          <button className={chatMode === "dm" ? "selected" : ""} onClick={() => setChatMode("dm")} type="button">
            <AtSign size={16} />
            DMs
          </button>
        </div>

        <button
          className={chatMode === "league" ? "chat-channel active" : "chat-channel"}
          onClick={() => setChatMode("league")}
          type="button"
        >
          <span className="chat-channel-icon">
            <Hash size={17} />
          </span>
          <span>
            <strong>League Lobby</strong>
            <small>{leagueMessages.length} messages</small>
          </span>
        </button>

        <div className="dm-thread-list" aria-label="Start or open direct message">
          <p className="dm-list-label">Active managers</p>
          {managersLoading && <p className="dm-list-note">Loading real league users...</p>}
          {managersError && <p className="dm-list-note error">{managersError}</p>}
          {!managersLoading && !managersError && activeManagers.length === 0 && (
            <p className="dm-list-note">No other real accounts have joined yet.</p>
          )}
          {activeManagers.map((member) => {
            const thread = dmThreads.find((candidate) => candidate.id === directThreadId(member.id));
            const preview = thread?.lastMessage || "Start a direct conversation";
            return (
              <button
                className={chatMode === "dm" && selectedThreadId === directThreadId(member.id) ? "dm-thread active" : "dm-thread"}
                key={member.id}
                onClick={() => openDirectMessage(member)}
                type="button"
              >
                <Avatar initials={member.initials} presence={member.presence} />
                <span>
                  <strong>{member.displayName}</strong>
                  <small>{preview}</small>
                </span>
                {thread && thread.unreadCount > 0 && <b>{thread.unreadCount}</b>}
                {!thread && <em>New</em>}
              </button>
            );
          })}
        </div>
      </section>

      <section className="section-panel chat-window-panel">
        <div className="chat-window-header">
          <div>
            <p className="eyebrow">{chatMode === "league" ? "Public Channel" : "Direct Message"}</p>
            <h3>{activeTitle}</h3>
            <span>{activeSubtitle}</span>
          </div>
        </div>

        <div className="message-list" aria-label={`${activeTitle} messages`}>
          {activeMessages.length ? (
            activeMessages.map((message) => <MessageBubble key={message.id} message={message} />)
          ) : chatMode === "league" ? (
            <div className="empty-dm-state">
              <Hash size={22} />
              <strong>No league messages yet</strong>
              <span>Start the real league chat with a waiver note, trade block, or matchup update.</span>
            </div>
          ) : messagesLoading ? (
            <div className="empty-dm-state">
              <AtSign size={22} />
              <strong>Loading conversation</strong>
              <span>Getting the latest messages from Supabase.</span>
            </div>
          ) : activeDmThread ? (
            <div className="empty-dm-state">
              <AtSign size={22} />
              <strong>Start a conversation with {activeDmThread.manager}</strong>
              <span>Send a trade idea, matchup note, or commissioner question directly.</span>
            </div>
          ) : (
            <div className="empty-dm-state">
              <AtSign size={22} />
              <strong>No DM selected</strong>
              <span>Select another real account from the active managers list.</span>
            </div>
          )}
        </div>

        {messageError && <p className="form-message error">{messageError}</p>}

        <form
          className="message-composer"
          onSubmit={(event) => {
            event.preventDefault();
            void sendMessage();
          }}
        >
          <input
            aria-label="Write a message"
            placeholder={chatMode === "league" ? "Message the league" : activeDmThread ? `Message ${activeDmThread.manager}` : "Select a manager first"}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <button type="submit" aria-label="Send message" disabled={sendingMessage || (chatMode === "dm" && !activeDmThread)}>
            <Send size={18} />
          </button>
        </form>
      </section>

      <section className="section-panel member-panel">
        <PanelTitle icon={Users} title="Managers" />
        <div className="member-list">
          {managers.map((member) => (
            <button
              className={member.id === user.id ? "member-row self-member" : "member-row"}
              disabled={member.id === user.id}
              key={member.id}
              onClick={() => openDirectMessage(member)}
              type="button"
            >
              <Avatar initials={member.initials} presence={member.presence} />
              <div>
                <strong>{member.displayName}</strong>
                <span>{member.team}</span>
              </div>
              {member.id !== user.id && <small>DM</small>}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function createEmptyDirectThread(member: ChatManager): DirectThread {
  return {
    id: directThreadId(member.id),
    initials: member.initials,
    lastMessage: "Start a direct conversation",
    manager: member.displayName,
    messages: [],
    presence: member.presence,
    team: member.team,
    unreadCount: 0
  };
}

function TradeProposalInbox({
  managers,
  proposals,
  updateProposalStatus,
  userId
}: {
  managers: ChatManager[];
  proposals: UserTradeProposal[];
  updateProposalStatus: (proposalId: string, status: "accepted" | "declined" | "voting") => Promise<void>;
  userId: string;
}) {
  const incoming = proposals.filter((proposal) => proposal.recipientId === userId);
  const outgoing = proposals.filter((proposal) => proposal.senderId === userId);

  return (
    <section className="section-panel trade-proposals-panel">
      <PanelTitle icon={ClipboardList} title="Trade Proposals" />
      <div className="proposal-columns">
        <ProposalColumn
          emptyText="No incoming proposals yet."
          managers={managers}
          proposals={incoming}
          title="Incoming"
          updateProposalStatus={updateProposalStatus}
          userId={userId}
        />
        <ProposalColumn
          emptyText="No outgoing proposals yet."
          managers={managers}
          proposals={outgoing}
          title="Outgoing"
          updateProposalStatus={updateProposalStatus}
          userId={userId}
        />
      </div>
    </section>
  );
}

function ProposalColumn({
  emptyText,
  managers,
  proposals,
  title,
  updateProposalStatus,
  userId
}: {
  emptyText: string;
  managers: ChatManager[];
  proposals: UserTradeProposal[];
  title: string;
  updateProposalStatus: (proposalId: string, status: "accepted" | "declined" | "voting") => Promise<void>;
  userId: string;
}) {
  return (
    <div className="proposal-column">
      <h4>{title}</h4>
      {proposals.length ? (
        proposals.map((proposal) => {
          const isIncoming = proposal.recipientId === userId;
          const counterpart = managers.find((manager) => manager.id === (isIncoming ? proposal.senderId : proposal.recipientId));

          return (
            <article className="proposal-card" key={proposal.id}>
              <div className="proposal-card-header">
                <span>{isIncoming ? "From" : "To"} {counterpart?.displayName ?? "Unknown manager"}</span>
                <b className={`proposal-status ${proposal.status}`}>{proposal.status}</b>
              </div>
              <div className="proposal-assets-grid">
                <ProposalAssets title={isIncoming ? "They send" : "You send"} assets={proposal.outgoingAssets} />
                <ProposalAssets title={isIncoming ? "You send" : "They send"} assets={proposal.incomingAssets} />
              </div>
              <div className="proposal-card-footer">
                <Metric label="Fairness" value={proposal.aiFairnessScore?.toString() ?? "N/A"} />
                <Metric label="Net edge" value={proposal.aiNetEdge == null ? "N/A" : signedNumber(proposal.aiNetEdge)} />
              </div>
              {isIncoming && proposal.status === "sent" && (
                <div className="proposal-actions">
                  <button className="approve" onClick={() => void updateProposalStatus(proposal.id, "accepted")} type="button">
                    Accept
                  </button>
                  <button className="veto" onClick={() => void updateProposalStatus(proposal.id, "declined")} type="button">
                    Decline
                  </button>
                  <button onClick={() => void updateProposalStatus(proposal.id, "voting")} type="button">
                    Send to vote
                  </button>
                </div>
              )}
            </article>
          );
        })
      ) : (
        <p className="proposal-empty">{emptyText}</p>
      )}
    </div>
  );
}

function ProposalAssets({ assets, title }: { assets: Array<{ label: string; value?: number }>; title: string }) {
  return (
    <div className="proposal-assets">
      <span>{title}</span>
      {assets.length ? (
        assets.map((asset) => (
          <strong key={asset.label}>
            {asset.label}
            {asset.value ? <small>{asset.value}</small> : null}
          </strong>
        ))
      ) : (
        <em>No assets selected</em>
      )}
    </div>
  );
}

function upsertDirectThread(threads: DirectThread[], nextThread: DirectThread): DirectThread[] {
  return threads.some((thread) => thread.id === nextThread.id)
    ? threads.map((thread) => (thread.id === nextThread.id ? nextThread : thread))
    : [...threads, nextThread];
}

function directMessageToChatMessage(
  message: ApiDirectMessage,
  peer: ChatManager,
  selfIdentity: ReturnType<typeof getChatIdentity>
): ChatMessage {
  return {
    body: message.body,
    id: message.id,
    initials: message.isSelf ? selfIdentity.initials : peer.initials,
    isSelf: message.isSelf,
    author: message.isSelf ? selfIdentity.manager : peer.displayName,
    sentAt: formatChatTimestamp(message.createdAt),
    team: message.isSelf ? selfIdentity.team : peer.team
  };
}

function directThreadId(userId: string): string {
  return `dm-${userId}`;
}

function TradeAssetColumn({
  assets,
  selectedIds,
  team,
  title,
  toggleAsset
}: {
  assets: TradeAsset[];
  selectedIds: string[];
  team: TradeTeam;
  title: string;
  toggleAsset: (assetId: string) => void;
}) {
  const selectedAssets = assets.filter((asset) => selectedIds.includes(asset.id));
  const selectedValue = selectedAssets.reduce((sum, asset) => sum + asset.tradeValue, 0);

  return (
    <div className="trade-asset-column">
      <div className="trade-column-header">
        <div>
          <p className="eyebrow">{team.manager}</p>
          <h3>{title}</h3>
          <span>{team.name}</span>
        </div>
        <b>{selectedValue}</b>
      </div>
      <div className="trade-asset-list">
        {assets.map((asset) => {
          const selected = selectedIds.includes(asset.id);
          return (
            <button
              className={selected ? "trade-asset selected" : "trade-asset"}
              key={asset.id}
              onClick={() => toggleAsset(asset.id)}
              type="button"
            >
              <PlayerImage
                className="asset-headshot"
                fallback={asset.position}
                imageUrl={asset.imageUrl}
                name={asset.name}
              />
              <span className="asset-main">
                <strong>{asset.name}</strong>
                <small>
                  {asset.nflTeam} | {asset.rosterSlot} | {asset.trend}
                </small>
              </span>
              <span className="asset-value">
                <b>{asset.tradeValue}</b>
                <small>{asset.projectedPoints ? `${asset.projectedPoints.toFixed(1)} ppg` : asset.note}</small>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PreferenceSlider({
  label,
  onChange,
  value
}: {
  label: string;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <label className="preference-slider">
      <span>
        <strong>{label}</strong>
        <b>{value}</b>
      </span>
      <input type="range" min="0" max="100" value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function MapView({
  selectedStadium,
  setSelectedStadiumId
}: {
  selectedStadium: StadiumMapEntry;
  setSelectedStadiumId: (stadiumId: string) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [conferenceFilter, setConferenceFilter] = useState("all");

  const conferences = useMemo(
    () =>
      Array.from(new Set(stadiumMapEntries.map((stadium) => stadium.conference).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b)
      ),
    []
  );

  const filteredStadiums = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return stadiumMapEntries.filter((stadium) => {
      const matchesConference = conferenceFilter === "all" || stadium.conference === conferenceFilter;
      const matchesSearch =
        !normalizedSearch ||
        [stadium.team, stadium.stadium, stadium.city, stadium.state, stadium.conference, stadium.mascot]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesConference && matchesSearch;
    });
  }, [conferenceFilter, searchTerm]);

  const resultList = filteredStadiums.slice(0, 14);

  return (
    <div className="view-grid map-grid">
      <section className="section-panel map-control-panel">
        <PanelTitle icon={MapPinned} title="Stadium Finder" />
        <label className="search-field">
          <Search size={17} />
          <input
            aria-label="Search stadiums"
            placeholder="Search team, city, stadium"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </label>
        <select
          aria-label="Filter by conference"
          className="conference-select"
          value={conferenceFilter}
          onChange={(event) => setConferenceFilter(event.target.value)}
        >
          <option value="all">All conferences</option>
          {conferences.map((conference) => (
            <option key={conference} value={conference}>
              {conference}
            </option>
          ))}
        </select>

        <div className="stadium-result-list">
          {resultList.map((stadium) => (
            <button
              className={stadium.id === selectedStadium.id ? "stadium-result selected" : "stadium-result"}
              key={stadium.id}
              onClick={() => setSelectedStadiumId(stadium.id)}
              type="button"
            >
              <TeamLogo stadium={stadium} />
              <span>
                <strong>{stadium.team}</strong>
                <small>{stadium.stadium}</small>
              </span>
              <b>{stadium.abbreviation || stadium.state}</b>
            </button>
          ))}
        </div>
      </section>

      <section className="section-panel stadium-map-panel">
        <div className="stadium-map-header">
          <div className="stadium-title-lockup">
            <TeamLogo stadium={selectedStadium} />
            <div>
              <p className="eyebrow">{selectedStadium.conference || "College Football"}</p>
              <h3>{selectedStadium.team}</h3>
              <span>
                {selectedStadium.stadium} | {selectedStadium.city}, {selectedStadium.state}
              </span>
            </div>
          </div>
          <div className="stadium-map-metrics">
            <Metric label="Capacity" value={formatCapacity(selectedStadium.capacity)} />
            <Metric label="Built" value={selectedStadium.built?.toString() ?? "N/A"} />
          </div>
        </div>
        <div className="stadium-map-shell">
          <StadiumMap
            stadiums={stadiumMapEntries}
            selectedStadium={selectedStadium}
            onSelectStadium={setSelectedStadiumId}
          />
        </div>
      </section>

      <section className="section-panel stadium-detail-panel">
        <PanelTitle icon={MapPinned} title="BAAL Stadium Data" />
        <div className="stadium-detail-grid">
          <Metric label="Mascot" value={selectedStadium.mascot || "N/A"} />
          <Metric label="Division" value={selectedStadium.division.toUpperCase()} />
          <Metric label="Expanded" value={selectedStadium.expanded?.toString() ?? "N/A"} />
          <Metric
            label="Coordinates"
            value={`${selectedStadium.latitude.toFixed(3)}, ${selectedStadium.longitude.toFixed(3)}`}
          />
        </div>
      </section>
    </div>
  );
}

function DashboardView({ matchup }: { matchup: ReturnType<typeof buildMatchup> }) {
  return (
    <div className="view-grid dashboard-grid">
      <section className="hero-band">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="broadcast-pill">Live Matchup</span>
          </p>
          <h3>
            {matchup.home.team.name} vs {matchup.away.team.name}
          </h3>
          <div className="hero-chip-row">
            <span>Win prob swinging</span>
            <span>Roster edge +4.8</span>
            <span>Weather neutral</span>
          </div>
        </div>
        <div className="scoreline">
          <ScoreBlock label={matchup.home.team.manager} value={matchup.home.actualPoints} />
          <span className="score-divider">at</span>
          <ScoreBlock label={matchup.away.team.manager} value={matchup.away.actualPoints} />
        </div>
      </section>

      <section className="spotlight-grid">
        <SpotlightCard label="Playoff Heat" value="87%" detail="Top seed pressure rising" />
        <SpotlightCard label="Waiver Budget" value="$42" detail="Aggressive window open" />
        <SpotlightCard label="Trade Market" value="Hot" detail="3 managers shopping RB" />
      </section>

      <section className="section-panel standings-panel">
        <PanelTitle icon={Trophy} title="Standings" />
        <div className="standings-list">
          {leagueTeams.map((team, index) => (
            <div className="standings-row" key={team.id}>
              <span className="rank">{index + 1}</span>
              <div>
                <strong>{team.name}</strong>
                <span>{team.manager}</span>
              </div>
              <b>{team.record}</b>
            </div>
          ))}
        </div>
      </section>

      <section className="section-panel activity-panel">
        <PanelTitle icon={Activity} title="League Activity" />
        <div className="activity-list">
          {recentActivity.map((activity) => (
            <div className="activity-row" key={activity.title}>
              <span>{activity.time}</span>
              <strong>{activity.title}</strong>
              <p>{activity.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section-panel">
        <PanelTitle icon={ClipboardList} title="Waiver Board" />
        <div className="waiver-list">
          {waiverTargets.map((target) => (
            <div className="waiver-row" key={target.name}>
              <div>
                <strong>{target.name}</strong>
                <span>{target.position} | {target.team}</span>
              </div>
              <b>{target.priority}</b>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ScoringView({ matchup }: { matchup: ReturnType<typeof buildMatchup> }) {
  return (
    <div className="view-grid scoring-grid">
      <section className="matchup-board">
        <TeamScoreColumn score={matchup.home} />
        <TeamScoreColumn score={matchup.away} />
      </section>

      <section className="section-panel scoring-table-panel">
        <PanelTitle icon={Gauge} title="Scoring Detail" />
        <div className="table-shell">
          <table>
            <thead>
              <tr>
                <th>Slot</th>
                <th>Player</th>
                <th>Team</th>
                <th>Proj</th>
                <th>Actual</th>
              </tr>
            </thead>
            <tbody>
              {[...matchup.home.starters, ...matchup.away.starters].map((score) => (
                <tr key={score.player.id}>
                  <td>{score.player.rosterSlot}</td>
                  <td>
                    <span className="roster-player-cell">
                      <PlayerImage
                        className="roster-headshot"
                        fallback={score.player.position}
                        imageUrl={score.player.imageUrl}
                        name={score.player.name}
                      />
                      <span>{score.player.name}</span>
                    </span>
                  </td>
                  <td>{score.player.team}</td>
                  <td>{formatPoints(score.projectedPoints)}</td>
                  <td className="points-cell">{formatPoints(score.actualPoints)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function RostersView({
  selectedScore,
  selectedTeamId,
  setSelectedTeamId
}: {
  selectedScore: ReturnType<typeof scoreTeam>;
  selectedTeamId: string;
  setSelectedTeamId: (teamId: string) => void;
}) {
  return (
    <div className="view-grid roster-grid">
      <section className="section-panel roster-selector">
        <PanelTitle icon={Users} title="Team Control" />
        <div className="segmented-control">
          {leagueTeams.map((team) => (
            <button
              className={team.id === selectedTeamId ? "selected" : ""}
              key={team.id}
              onClick={() => setSelectedTeamId(team.id)}
              type="button"
            >
              {team.name}
            </button>
          ))}
        </div>
        <div className="team-metrics">
          <Metric label="Projected" value={formatPoints(selectedScore.projectedPoints)} />
          <Metric label="Actual" value={formatPoints(selectedScore.actualPoints)} />
          <Metric label="FAAB" value={`$${selectedScore.team.faabRemaining}`} />
        </div>
      </section>

      <section className="section-panel roster-table-panel">
        <PanelTitle icon={Shield} title={`${selectedScore.team.name} Roster`} />
        <RosterTable players={selectedScore.team.roster} />
      </section>
    </div>
  );
}

function SettingsView({
  pprEnabled,
  profile,
  rules,
  setProfile,
  tradeReview,
  updateRule,
  user,
  waiverLock,
  setPpr,
  setTradeReview,
  setWaiverLock,
  supabase
}: {
  pprEnabled: boolean;
  profile: Profile | null;
  rules: ScoringRules;
  setProfile: (profile: Profile | null) => void;
  tradeReview: boolean;
  updateRule: (key: keyof ScoringRules, rawValue: string) => void;
  user: User;
  waiverLock: boolean;
  setPpr: (value: boolean) => void;
  setTradeReview: (value: boolean) => void;
  setWaiverLock: (value: boolean) => void;
  supabase: BrowserSupabaseClient;
}) {
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "");
  const [email, setEmail] = useState(user.email ?? "");
  const [password, setPassword] = useState("");
  const [accountStatus, setAccountStatus] = useState("");
  const [accountError, setAccountError] = useState("");
  const [savingAccount, setSavingAccount] = useState(false);

  useEffect(() => {
    setDisplayName(profile?.display_name ?? "");
    setAvatarUrl(profile?.avatar_url ?? "");
  }, [profile]);

  useEffect(() => {
    setEmail(user.email ?? "");
  }, [user.email]);

  async function saveProfile() {
    setSavingAccount(true);
    setAccountError("");
    setAccountStatus("");

    const nextProfile = {
      avatar_url: avatarUrl.trim() || null,
      display_name: displayName.trim()
    };

    const { data, error } = await supabase
      .from("profiles")
      .update(nextProfile)
      .eq("id", user.id)
      .select("id, display_name, avatar_url")
      .single();

    setSavingAccount(false);

    if (error) {
      setAccountError(error.message);
      return;
    }

    setProfile(data);
    setAccountStatus("Profile updated.");
  }

  async function saveLogin() {
    setSavingAccount(true);
    setAccountError("");
    setAccountStatus("");

    const updates: { email?: string; password?: string } = {};
    if (email.trim() && email.trim() !== user.email) {
      updates.email = email.trim();
    }
    if (password) {
      updates.password = password;
    }

    if (!updates.email && !updates.password) {
      setSavingAccount(false);
      setAccountStatus("No login changes to save.");
      return;
    }

    const { error } = await supabase.auth.updateUser(updates);
    setSavingAccount(false);

    if (error) {
      setAccountError(error.message);
      return;
    }

    setPassword("");
    setAccountStatus(updates.email ? "Login updated. Confirm the new email if Supabase requires it." : "Password updated.");
  }

  return (
    <div className="view-grid settings-grid">
      <section className="section-panel account-panel">
        <PanelTitle icon={Settings} title="Account" />
        <div className="account-summary">
          <Avatar initials={accountInitials(profile, user)} />
          <div>
            <strong>{profile?.display_name || user.email || "Manager"}</strong>
            <span>{user.email}</span>
          </div>
        </div>

        <div className="account-form-grid">
          <label className="form-field">
            <span>Display name</span>
            <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
          </label>
          <label className="form-field">
            <span>Avatar URL</span>
            <input type="url" value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} />
          </label>
          <button className="primary-action account-action" disabled={savingAccount} onClick={() => void saveProfile()} type="button">
            Save profile
          </button>
        </div>

        <div className="account-form-grid">
          <label className="form-field">
            <span>Email</span>
            <input autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label className="form-field">
            <span>New password</span>
            <PasswordInput
              autoComplete="new-password"
              label="New password"
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <button className="primary-action account-action" disabled={savingAccount} onClick={() => void saveLogin()} type="button">
            Save login
          </button>
        </div>

        {accountError && <p className="form-message error">{accountError}</p>}
        {accountStatus && <p className="form-message success">{accountStatus}</p>}

        <button className="text-button danger" onClick={() => void supabase.auth.signOut()} type="button">
          Sign out
        </button>
      </section>

      <AdminPanel supabase={supabase} />

      <section className="section-panel scoring-settings">
        <PanelTitle icon={SlidersHorizontal} title="Scoring Rules" />
        <div className="settings-list">
          {scoringInputs.map((input) => (
            <label className="setting-row" key={input.key}>
              <span>{input.label}</span>
              <div className="number-input">
                <input
                  aria-label={input.label}
                  type="number"
                  value={rules[input.key]}
                  onChange={(event) => updateRule(input.key, event.target.value)}
                />
                <small>{input.suffix}</small>
              </div>
            </label>
          ))}
        </div>
      </section>

      <section className="section-panel rules-panel">
        <PanelTitle icon={CalendarClock} title="League Rules" />
        <ToggleRow checked={pprEnabled} label="Full PPR" onChange={setPpr} />
        <ToggleRow checked={waiverLock} label="Waiver lock after kickoff" onChange={setWaiverLock} />
        <ToggleRow checked={tradeReview} label="Commissioner trade review" onChange={setTradeReview} />
        <div className="compact-grid">
          <Metric label="Teams" value="12" />
          <Metric label="Playoff" value="6" />
          <Metric label="Bench" value="6" />
          <Metric label="IR" value="2" />
        </div>
      </section>
    </div>
  );
}

function AdminPanel({ supabase }: { supabase: BrowserSupabaseClient }) {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [passwordsByUser, setPasswordsByUser] = useState<Record<string, string>>({});
  const [loadingAdmin, setLoadingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [adminStatus, setAdminStatus] = useState("");
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadAdminUsers() {
      const token = await getAccessToken(supabase);
      if (!token) {
        if (isMounted) {
          setLoadingAdmin(false);
        }
        return;
      }

      const response = await fetch("/api/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!isMounted) {
        return;
      }

      setLoadingAdmin(false);

      if (response.status === 403) {
        setIsAdmin(false);
        return;
      }

      const payload = (await response.json()) as { error?: string; users?: AdminUser[] };

      if (!response.ok) {
        setAdminError(payload.error ?? "Unable to load admin users.");
        return;
      }

      setIsAdmin(true);
      setAdminUsers(payload.users ?? []);
    }

    void loadAdminUsers();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  async function updateManagedPassword(userId: string) {
    const password = passwordsByUser[userId] ?? "";
    if (password.length < 6) {
      setAdminError("Password must be at least 6 characters.");
      return;
    }

    const token = await getAccessToken(supabase);
    if (!token) {
      setAdminError("Your session expired. Sign in again.");
      return;
    }

    setSavingUserId(userId);
    setAdminError("");
    setAdminStatus("");

    const response = await fetch(`/api/admin/users/${userId}/password`, {
      body: JSON.stringify({ password }),
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      method: "PATCH"
    });
    const payload = (await response.json()) as { error?: string };

    setSavingUserId(null);

    if (!response.ok) {
      setAdminError(payload.error ?? "Unable to update password.");
      return;
    }

    setPasswordsByUser((current) => ({ ...current, [userId]: "" }));
    setAdminStatus("Password updated.");
  }

  if (loadingAdmin) {
    return null;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <section className="section-panel admin-panel">
      <PanelTitle icon={Shield} title="Admin Roster" />
      <div className="admin-panel-header">
        <div>
          <strong>{adminUsers.length} accounts</strong>
          <span>Supabase Auth users, profiles, league memberships, and managed teams.</span>
        </div>
      </div>

      {adminError && <p className="form-message error">{adminError}</p>}
      {adminStatus && <p className="form-message success">{adminStatus}</p>}

      <div className="admin-user-list">
        {adminUsers.map((managedUser) => (
          <article className="admin-user-card" key={managedUser.id}>
            <div className="admin-user-main">
              <Avatar initials={adminUserInitials(managedUser)} />
              <div>
                <strong>{managedUser.profile?.display_name || managedUser.email || "Unknown user"}</strong>
                <span>{managedUser.email || managedUser.phone || managedUser.id}</span>
              </div>
            </div>

            <div className="admin-data-grid">
              <Metric label="Created" value={formatAdminDate(managedUser.createdAt)} />
              <Metric label="Last sign in" value={formatAdminDate(managedUser.lastSignInAt)} />
              <Metric label="Confirmed" value={managedUser.confirmedAt ? "Yes" : "No"} />
              <Metric label="Teams" value={managedUser.teams.length.toString()} />
            </div>

            <div className="admin-detail-list">
              <AdminDetail label="Leagues" value={formatAdminLeagues(managedUser.memberships)} />
              <AdminDetail label="Teams" value={formatAdminTeams(managedUser.teams)} />
              <AdminDetail label="Providers" value={formatProviders(managedUser.appMetadata)} />
            </div>

            <div className="admin-password-row">
              <label className="form-field">
                <span>Set new password</span>
                <PasswordInput
                  autoComplete="new-password"
                  label={`Set password for ${managedUser.email || managedUser.profile?.display_name || managedUser.id}`}
                  minLength={6}
                  value={passwordsByUser[managedUser.id] ?? ""}
                  onChange={(event) =>
                    setPasswordsByUser((current) => ({
                      ...current,
                      [managedUser.id]: event.target.value
                    }))
                  }
                />
              </label>
              <button
                className="primary-action account-action"
                disabled={savingUserId === managedUser.id}
                onClick={() => void updateManagedPassword(managedUser.id)}
                type="button"
              >
                {savingUserId === managedUser.id ? "Saving..." : "Update password"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function TeamScoreColumn({ score }: { score: ReturnType<typeof scoreTeam> }) {
  return (
    <section className="team-score-column">
      <div className="team-score-header">
        <div>
          <p>{score.team.manager}</p>
          <h3>{score.team.name}</h3>
        </div>
        <strong>{formatPoints(score.actualPoints)}</strong>
      </div>
      <div className="starter-list">
        {score.starters.map((playerScore) => (
          <div className="starter-row" key={playerScore.player.id}>
            <PlayerImage
              className="starter-headshot"
              fallback={playerScore.player.rosterSlot}
              imageUrl={playerScore.player.imageUrl}
              name={playerScore.player.name}
            />
            <div>
              <strong>{playerScore.player.name}</strong>
              <small>
                {playerScore.player.rosterSlot} | {playerScore.player.team} vs {playerScore.player.opponent}
              </small>
            </div>
            <b>{formatPoints(playerScore.actualPoints)}</b>
          </div>
        ))}
      </div>
    </section>
  );
}

function RosterTable({ players }: { players: FantasyPlayer[] }) {
  return (
    <div className="table-shell">
      <table>
        <thead>
          <tr>
            <th>Slot</th>
            <th>Player</th>
            <th>Pos</th>
            <th>Team</th>
            <th>Status</th>
            <th>Proj</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => (
            <tr key={player.id}>
              <td>{player.rosterSlot}</td>
              <td>
                <span className="roster-player-cell">
                  <PlayerImage
                    className="roster-headshot"
                    fallback={player.position}
                    imageUrl={player.imageUrl}
                    name={player.name}
                  />
                  <span>{player.name}</span>
                </span>
              </td>
              <td>{player.position}</td>
              <td>{player.team}</td>
              <td>
                <span className={`status-pill ${player.status}`}>{player.status}</span>
              </td>
              <td>{formatPoints(player.projectedPoints)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PanelTitle({ icon: Icon, title }: { icon: React.ComponentType<{ size?: number }>; title: string }) {
  return (
    <div className="panel-title">
      <Icon size={18} />
      <h3>{title}</h3>
    </div>
  );
}

function ScoreBlock({ label, value }: { label: string; value: number }) {
  return (
    <div className="score-block">
      <span>{label}</span>
      <strong>{formatPoints(value)}</strong>
    </div>
  );
}

function SpotlightCard({ detail, label, value }: { detail: string; label: string; value: string }) {
  return (
    <article className="spotlight-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function AdminDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="admin-detail">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PasswordInput({
  autoComplete,
  label,
  minLength,
  onChange,
  required,
  value
}: {
  autoComplete: string;
  label: string;
  minLength?: number;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  value: string;
}) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <span className="password-input-wrap">
      <input
        aria-label={label}
        autoComplete={autoComplete}
        minLength={minLength}
        required={required}
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
      />
      <button
        aria-label={visible ? "Hide password" : "Show password"}
        onClick={() => setVisible((current) => !current)}
        type="button"
      >
        <Icon size={17} />
      </button>
    </span>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  return (
    <article className={message.isSelf ? "chat-message self" : "chat-message"}>
      <Avatar initials={message.initials} />
      <div className="message-body">
        <div className="message-meta">
          <strong>{message.author}</strong>
          <span>{message.team}</span>
          <small>{message.sentAt}</small>
          {message.tag && <b>{message.tag}</b>}
        </div>
        <p>{message.body}</p>
      </div>
    </article>
  );
}

function Avatar({
  initials,
  presence
}: {
  initials: string;
  presence?: Presence;
}) {
  return (
    <span className="avatar">
      {initials}
      {presence && <i className={`presence-dot ${presence}`} />}
    </span>
  );
}

function PlayerImage({
  className = "",
  fallback,
  imageUrl,
  name
}: {
  className?: string;
  fallback: string;
  imageUrl?: string;
  name: string;
}) {
  return (
    <span className={`player-image ${className}`}>
      {imageUrl ? <img src={imageUrl} alt={name} loading="lazy" /> : <span>{fallback}</span>}
    </span>
  );
}

function TeamLogo({ stadium }: { stadium: StadiumMapEntry }) {
  if (stadium.logoUrl) {
    return <img className="team-logo" src={stadium.logoUrl} alt="" />;
  }

  return <span className="team-logo fallback">{stadium.abbreviation || stadium.team.slice(0, 2)}</span>;
}

function ToggleRow({
  checked,
  label,
  onChange
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="toggle-row">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

function viewTitle(view: ViewKey): string {
  switch (view) {
    case "scoring":
      return "Fantasy Scoring";
    case "rosters":
      return "Roster Room";
    case "chat":
      return "League Chat";
    case "trade":
      return "Trade Builder";
    case "map":
      return "Team Map";
    case "settings":
      return "League Settings";
    default:
      return "League Dashboard";
  }
}

function formatCapacity(capacity: number | null): string {
  return capacity?.toLocaleString() ?? "N/A";
}

function analyzeTrade(
  outgoingAssets: TradeAsset[],
  incomingAssets: TradeAsset[],
  yourTeam: TradeTeam,
  partnerTeam: TradeTeam,
  preferences: TradePreferences
) {
  const outgoingValue = adjustedAssetTotal(outgoingAssets, yourTeam, preferences);
  const incomingValue = adjustedAssetTotal(incomingAssets, yourTeam, preferences);
  const netEdge = roundOne(incomingValue - outgoingValue);
  const rawGap = Math.abs(netEdge);
  const fairnessScore = clamp(Math.round(98 - rawGap * 1.8), 12, 99);
  const incomingNeedHits = incomingAssets.filter((asset) => yourTeam.needs.includes(asset.position)).length;
  const outgoingNeedHits = outgoingAssets.filter((asset) => yourTeam.needs.includes(asset.position)).length;
  const incomingRisk = average(incomingAssets.map((asset) => asset.risk));
  const outgoingRisk = average(outgoingAssets.map((asset) => asset.risk));
  const incomingKeeper = average(incomingAssets.map((asset) => asset.keeperGrade));
  const outgoingKeeper = average(outgoingAssets.map((asset) => asset.keeperGrade));
  const incomingWeeklyPoints = incomingAssets.reduce((sum, asset) => sum + asset.projectedPoints, 0);
  const outgoingWeeklyPoints = outgoingAssets.reduce((sum, asset) => sum + asset.projectedPoints, 0);

  const verdict =
    netEdge >= 12
      ? "Accept if the other manager will click it"
      : netEdge >= 3
        ? "Slight lean accept"
        : netEdge <= -12
          ? "Decline or ask for a premium asset"
          : netEdge <= -3
            ? "Counter for a sweetener"
            : "Fair framework";

  const recommendation =
    fairnessScore >= 82
      ? "Balanced offer"
      : netEdge > 0
        ? "Favors your side"
        : "Favors their side";

  const insights = [
    incomingNeedHits > outgoingNeedHits
      ? `Improves your stated ${yourTeam.needs.join("/")} need profile.`
      : "Does not strongly solve your top roster needs yet.",
    incomingWeeklyPoints >= outgoingWeeklyPoints
      ? `Adds ${roundOne(incomingWeeklyPoints - outgoingWeeklyPoints)} projected weekly points.`
      : `Costs ${roundOne(outgoingWeeklyPoints - incomingWeeklyPoints)} projected weekly points.`,
    incomingRisk <= outgoingRisk
      ? "Lowers aggregate injury/role risk."
      : "Raises volatility, so your risk slider matters here.",
    incomingKeeper >= outgoingKeeper
      ? "Improves keeper/dynasty optionality."
      : "Trades away more long-term insulation than it receives.",
    partnerTeam.style === "retooling"
      ? `${partnerTeam.manager} may value picks and keeper assets more than pure weekly points.`
      : `${partnerTeam.manager} is positioned to care about usable starter points.`
  ];

  const summary =
    preferences.mode === "win-now"
      ? "Automatic grading is emphasizing weekly starter points and need fit."
      : preferences.mode === "keeper"
        ? "Automatic grading is emphasizing keeper grade, age curve, and future assets."
        : "Automatic grading is balancing current points, future value, and risk.";

  return {
    fairnessScore,
    incomingValue: roundOne(incomingValue),
    insights,
    netEdge,
    outgoingValue: roundOne(outgoingValue),
    recommendation,
    summary,
    verdict
  };
}

function adjustedAssetTotal(assets: TradeAsset[], team: TradeTeam, preferences: TradePreferences): number {
  return assets.reduce((sum, asset) => sum + adjustedAssetValue(asset, team, preferences), 0);
}

function adjustedAssetValue(asset: TradeAsset, team: TradeTeam, preferences: TradePreferences): number {
  const mode = tradeModeWeights(preferences.mode);
  const needBonus = team.needs.includes(asset.position) ? (preferences.needWeight / 100) * 12 : 0;
  const projectedBonus = asset.projectedPoints * mode.pointsWeight;
  const keeperBonus = (asset.keeperGrade / 100) * preferences.keeperWeight * mode.keeperWeight;
  const riskPenalty = asset.risk * ((100 - preferences.riskTolerance) / 100) * 0.34;
  const trendBonus = asset.trend === "rising" ? 5 : asset.trend === "falling" ? -4 : 1;
  const futureAssetBonus = asset.position === "PICK" ? mode.pickWeight : asset.position === "FAAB" ? 2 : 0;
  const ageBonus = asset.age && asset.age <= 25 ? mode.ageWeight : asset.age && asset.age >= 30 ? -mode.ageWeight : 0;

  return asset.tradeValue + needBonus + projectedBonus + keeperBonus + trendBonus + futureAssetBonus + ageBonus - riskPenalty;
}

function tradeModeWeights(mode: TradeMode) {
  switch (mode) {
    case "keeper":
      return { ageWeight: 5, keeperWeight: 0.54, pickWeight: 9, pointsWeight: 0.34 };
    case "balanced":
      return { ageWeight: 3, keeperWeight: 0.38, pickWeight: 4, pointsWeight: 0.58 };
    default:
      return { ageWeight: 1, keeperWeight: 0.18, pickWeight: -6, pointsWeight: 0.86 };
  }
}

function tradeModeLabel(mode: TradeMode): string {
  switch (mode) {
    case "keeper":
      return "Keeper";
    case "balanced":
      return "Balanced";
    default:
      return "Win Now";
  }
}

function tradeAssetToPayload(asset: TradeAsset) {
  return {
    label: asset.name,
    value: asset.tradeValue
  };
}

function summarizeTradeVotes(votes: TradeVote[]) {
  const approveVotes = votes.filter((vote) => vote.vote === "approve").length;
  const vetoVotes = votes.filter((vote) => vote.vote === "veto").length;
  const result = approveVotes > vetoVotes ? "approved" : vetoVotes > approveVotes ? "vetoed" : "tied";

  return {
    approveVotes,
    result,
    vetoVotes
  };
}

function tradeVoteResultLabel(result: string): string {
  switch (result) {
    case "approved":
      return "Majority push through";
    case "vetoed":
      return "Majority veto";
    default:
      return "Vote tied";
  }
}

function tradeVoteResultDetail(result: string): string {
  switch (result) {
    case "approved":
      return "If voting closed now, this trade would process.";
    case "vetoed":
      return "If voting closed now, this trade would be blocked.";
    default:
      return "One more vote can swing the election.";
  }
}

function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((existingId) => existingId !== id) : [...ids, id];
}

function accountInitials(profile: Profile | null, user: User): string {
  const source = profile?.display_name || user.email || "Manager";
  const parts = source
    .replace(/@.*/, "")
    .split(/\s+|[._-]/)
    .filter(Boolean);

  return (parts[0]?.[0] ?? "M").concat(parts[1]?.[0] ?? "").toUpperCase();
}

function getChatIdentity(profile: Profile | null, user: User) {
  const metadataName = typeof user.user_metadata.display_name === "string" ? user.user_metadata.display_name.trim() : "";
  const displayName = profile?.display_name?.trim() || metadataName;
  const emailName = user.email?.split("@")[0] ?? "Manager";
  const manager = displayName || emailName;

  return {
    initials: accountInitials(profile, user),
    manager,
    team: "League Manager"
  };
}

async function getAccessToken(supabase: BrowserSupabaseClient): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

function adminUserInitials(user: AdminUser): string {
  const source = user.profile?.display_name || user.email || user.phone || "User";
  const parts = source
    .replace(/@.*/, "")
    .split(/\s+|[._-]/)
    .filter(Boolean);

  return (parts[0]?.[0] ?? "U").concat(parts[1]?.[0] ?? "").toUpperCase();
}

function formatAdminDate(value?: string): string {
  if (!value) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function formatChatTimestamp(value: string): string {
  const date = new Date(value);
  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    return new Intl.DateTimeFormat("en", {
      hour: "numeric",
      minute: "2-digit"
    }).format(date);
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short"
  }).format(date);
}

function formatAdminLeagues(memberships: AdminMembership[]): string {
  if (!memberships.length) {
    return "No league memberships";
  }

  return memberships
    .map((membership) => {
      const league = membership.leagues;
      return league ? `${league.name} (${membership.role})` : membership.role;
    })
    .join(", ");
}

function formatAdminTeams(teams: AdminTeam[]): string {
  if (!teams.length) {
    return "No managed teams";
  }

  return teams
    .map((team) => `${team.name} ${team.record_wins}-${team.record_losses}, $${team.faab_remaining} FAAB`)
    .join(", ");
}

function formatProviders(appMetadata: Record<string, unknown>): string {
  const providers = appMetadata.providers;
  if (Array.isArray(providers) && providers.every((provider) => typeof provider === "string")) {
    return providers.join(", ");
  }

  const provider = appMetadata.provider;
  return typeof provider === "string" ? provider : "Email";
}

function signedNumber(value: number): string {
  return value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
}

function average(values: number[]): number {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function roundOne(value: number): number {
  return Math.round(value * 10) / 10;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
