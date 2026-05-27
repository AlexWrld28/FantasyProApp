export type CollegeFootballPlayer = {
  id?: string | number;
  name: string;
  team?: string;
  position?: string;
  hometown?: string;
  height?: number;
  weight?: number;
  teamColor?: string;
  teamColorSecondary?: string;
};

export type TeamAsset = {
  school: string;
  mascot: string;
  abbreviation: string;
  conference: string;
  division: string;
  logoUrl: string;
};

export type StadiumAsset = {
  team: string;
  stadium: string;
  conference: string;
  capacity: string;
  built: string;
  expanded: string;
  latitude: number;
  longitude: number;
};

export const baalLegacyCapabilities = [
  "CollegeFootballData player search",
  "Weekly player stat lookup",
  "Team logo lookup",
  "Stadium geocoding",
  "Map rendering inputs"
] as const;

export function normalizeSearchTerm(value: string): string {
  return value.trim().toLocaleLowerCase();
}

export function normalizeCfbdPlayer(input: Record<string, unknown>): CollegeFootballPlayer {
  return {
    id: stringish(input.id),
    name: String(input.name ?? input.full_name ?? ""),
    team: stringish(input.team),
    position: stringish(input.position),
    hometown: stringish(input.hometown),
    height: numberish(input.height),
    weight: numberish(input.weight),
    teamColor: stringish(input.teamColor ?? input.team_color),
    teamColorSecondary: stringish(input.teamColorSecondary ?? input.team_color_secondary)
  };
}

export function buildCfbdHeaders(apiKey: string): HeadersInit {
  return {
    Authorization: `Bearer ${apiKey}`
  };
}

function stringish(value: unknown): string | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  return String(value);
}

function numberish(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
