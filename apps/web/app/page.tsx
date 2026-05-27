"use client";

import {
  Activity,
  CalendarClock,
  Check,
  ClipboardList,
  Gauge,
  Home,
  Lock,
  Settings,
  Shield,
  SlidersHorizontal,
  Trophy,
  Users,
  Zap
} from "lucide-react";
import { useMemo, useState } from "react";
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
import { leagueTeams, recentActivity, waiverTargets } from "../lib/sample-data";

type ViewKey = "dashboard" | "scoring" | "rosters" | "settings";

const views: Array<{ key: ViewKey; label: string; icon: React.ComponentType<{ size?: number }> }> = [
  { key: "dashboard", label: "Dashboard", icon: Home },
  { key: "scoring", label: "Scoring", icon: Gauge },
  { key: "rosters", label: "Rosters", icon: Users },
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
  const [activeView, setActiveView] = useState<ViewKey>("dashboard");
  const [rules, setRules] = useState<ScoringRules>(defaultScoringRules);
  const [selectedTeamId, setSelectedTeamId] = useState(leagueTeams[0].id);
  const [pprEnabled, setPprEnabled] = useState(true);
  const [waiverLock, setWaiverLock] = useState(true);
  const [tradeReview, setTradeReview] = useState(false);

  const selectedTeam = leagueTeams.find((team) => team.id === selectedTeamId) ?? leagueTeams[0];
  const matchup = useMemo(() => buildMatchup(leagueTeams[0], leagueTeams[1], rules), [rules]);
  const selectedScore = useMemo(() => scoreTeam(selectedTeam, rules), [rules, selectedTeam]);

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
            <p className="eyebrow">Week 12</p>
            <h2>{viewTitle(activeView)}</h2>
          </div>
          <div className="topbar-actions">
            <button className="icon-button" type="button" aria-label="League lock">
              <Lock size={18} />
            </button>
            <button className="primary-action" type="button">
              <Users size={17} />
              Invite
            </button>
          </div>
        </header>

        {activeView === "dashboard" && <DashboardView matchup={matchup} />}
        {activeView === "scoring" && <ScoringView matchup={matchup} />}
        {activeView === "rosters" && (
          <RostersView
            selectedScore={selectedScore}
            selectedTeamId={selectedTeamId}
            setSelectedTeamId={setSelectedTeamId}
          />
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
          />
        )}
      </section>
    </main>
  );
}

function DashboardView({ matchup }: { matchup: ReturnType<typeof buildMatchup> }) {
  return (
    <div className="view-grid dashboard-grid">
      <section className="hero-band">
        <div>
          <p className="eyebrow">Live Matchup</p>
          <h3>
            {matchup.home.team.name} vs {matchup.away.team.name}
          </h3>
        </div>
        <div className="scoreline">
          <ScoreBlock label={matchup.home.team.manager} value={matchup.home.actualPoints} />
          <span className="score-divider">at</span>
          <ScoreBlock label={matchup.away.team.manager} value={matchup.away.actualPoints} />
        </div>
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
                  <td>{score.player.name}</td>
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
  rules,
  tradeReview,
  updateRule,
  waiverLock,
  setPpr,
  setTradeReview,
  setWaiverLock
}: {
  pprEnabled: boolean;
  rules: ScoringRules;
  tradeReview: boolean;
  updateRule: (key: keyof ScoringRules, rawValue: string) => void;
  waiverLock: boolean;
  setPpr: (value: boolean) => void;
  setTradeReview: (value: boolean) => void;
  setWaiverLock: (value: boolean) => void;
}) {
  return (
    <div className="view-grid settings-grid">
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
            <span>{playerScore.player.rosterSlot}</span>
            <div>
              <strong>{playerScore.player.name}</strong>
              <small>{playerScore.player.team} vs {playerScore.player.opponent}</small>
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
              <td>{player.name}</td>
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
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
    case "settings":
      return "League Settings";
    default:
      return "League Dashboard";
  }
}
