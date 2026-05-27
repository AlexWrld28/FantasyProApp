# BAAL Fantasy Platform

BAAL is being expanded from a desktop college-football lookup tool into a private fantasy football league platform for web, iOS, and Android.

## Project Layout

```text
apps/web                 Next.js hosted league app
apps/mobile              Expo mobile app shell
packages/fantasy-engine  Shared scoring and matchup logic
packages/football-data   BAAL football-data adapters
supabase                 Database migrations and Edge Functions
BAALv1.7.py              Original PyQt desktop app
```

## Web App

```bash
npm install
npm run dev:web
```

The web app includes the first pass of the league dashboard, fantasy scoring screen, roster room, and league settings.

## Supabase

Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CFBD_API_KEY=
```

Apply `supabase/migrations/0001_initial_schema.sql` to create auth-backed league, team, roster, scoring, matchup, and stat tables.

## Legacy Desktop App

```bash
python3 -m pip install -r requirements.txt
python3 BAALv1.7.py
```

If you have a College Football Data API key, set `CFBD_API_KEY` before launching. Player search and stat lookup require a valid key from CollegeFootballData.com.

The legacy app contains the original BAAL capabilities:

- `CollegeFootballClient` owns CFBD API calls.
- `CsvTeamRepository` owns local CSV loading and team lookup.
- `ImageService` owns network image fetching and resizing.
- `MapRenderer` owns Folium map creation.
- `PlayerSearchApp` owns Qt widgets and event handling.
