# poolsies

A daily pool puzzle for the browser. Five tables a day, one goal each, fewest shots wins.
Everything lives in `index.html` (Three.js + Supabase client from pinned jsDelivr URLs). Host it as a static page.

## Setup

1. Create a Supabase project and run `supabase.sql` in the SQL editor.
2. In `index.html`, fill in `SUPABASE_URL` and `SUPABASE_ANON_KEY` (top of the `<script>` block, "CONFIG").
3. Add five rows to `poolsies_levels` for each date (`level_order` 1–5). The `data` column is the level JSON.

With empty keys, or if Supabase can't be reached or has fewer than 5 levels for today, the game plays the 5 built-in demo levels and hides the leaderboard.

## Where to change things (all in `index.html`)

| What | Where |
| --- | --- |
| Supabase keys | `SUPABASE_URL`, `SUPABASE_ANON_KEY` under "CONFIG" |
| Puzzle numbering | `LAUNCH_DATE` (the day that was "No. 1") |
| Demo levels | `DEMO_LEVELS` |
| Themes (floor, felt, rails, props) | `THEMES` |
| Obstacle models | `OBST` (box kinds: `toolbox`, `pizzaBox`, `book`, `napkinHolder`, `block`; circle kinds: `coffeeMug`, `cocoaMug`, `sodaCan`, `snowGlobe`, `sandcastle`, `cone`, `bowlingPin`, `beachBall`, `plant`, `bumper`) |
| Physics feel | constants under "table + physics constants" (`MAX_SPEED`, `MU`, `KV`, `E_RAIL`, ...) |
| Font | `--font` in the CSS `:root` (plus the Google Fonts `<link>`) |

Level JSON: positions are table units (x −1..1 across, z −2..2 along, +z is the near end). Obstacle and slow-zone `rotation` is in degrees. Circle obstacles use `radius`; boxes use `size: [w, d]`. Goal types: `count`, `stripes`, `colors`, `specific`, `order`.
