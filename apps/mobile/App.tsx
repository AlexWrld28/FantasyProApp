import { StatusBar } from "expo-status-bar";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { buildMatchup, defaultScoringRules, formatPoints, type FantasyTeam } from "@baal/fantasy-engine";

const teams: [FantasyTeam, FantasyTeam] = [
  {
    id: "team-1",
    name: "Fourth Down Syndicate",
    manager: "Aazma",
    record: "8-3",
    waiverPriority: 4,
    faabRemaining: 61,
    roster: [
      {
        id: "mobile-1",
        name: "Caleb Williams",
        team: "CHI",
        opponent: "MIN",
        position: "QB",
        rosterSlot: "QB",
        status: "active",
        projectedPoints: 19.4,
        stats: { passingYards: 286, passingTouchdowns: 2, interceptions: 1, rushingYards: 32 }
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
        id: "mobile-2",
        name: "Jayden Daniels",
        team: "WAS",
        opponent: "DAL",
        position: "QB",
        rosterSlot: "QB",
        status: "active",
        projectedPoints: 20.1,
        stats: { passingYards: 241, passingTouchdowns: 2, rushingYards: 54, rushingTouchdowns: 1 }
      }
    ]
  }
];

export default function App() {
  const matchup = buildMatchup(teams[0], teams[1], defaultScoringRules);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>BAAL League</Text>
        <Text style={styles.title}>Fantasy HQ</Text>

        <View style={styles.scoreboard}>
          <ScoreCard manager={matchup.home.team.manager} name={matchup.home.team.name} score={matchup.home.actualPoints} />
          <ScoreCard manager={matchup.away.team.manager} name={matchup.away.team.name} score={matchup.away.actualPoints} />
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Settings Ready</Text>
          <Text style={styles.panelText}>Auth, scoring, waivers, rosters, and league admin will share the Supabase backend with web.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ScoreCard({ manager, name, score }: { manager: string; name: string; score: number }) {
  return (
    <View style={styles.scoreCard}>
      <Text style={styles.manager}>{manager}</Text>
      <Text style={styles.teamName}>{name}</Text>
      <Text style={styles.score}>{formatPoints(score)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#f6f3ed",
    flex: 1
  },
  content: {
    gap: 18,
    padding: 20
  },
  eyebrow: {
    color: "#68717a",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  title: {
    color: "#172027",
    fontSize: 40,
    fontWeight: "900"
  },
  scoreboard: {
    gap: 12
  },
  scoreCard: {
    backgroundColor: "#ffffff",
    borderColor: "#d8ddd8",
    borderRadius: 8,
    borderWidth: 1,
    padding: 18
  },
  manager: {
    color: "#68717a",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  teamName: {
    color: "#172027",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 4
  },
  score: {
    color: "#2d6a4f",
    fontSize: 38,
    fontWeight: "900",
    marginTop: 10
  },
  panel: {
    backgroundColor: "#152235",
    borderRadius: 8,
    padding: 18
  },
  panelTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900"
  },
  panelText: {
    color: "#cfdae7",
    lineHeight: 21,
    marginTop: 6
  }
});
