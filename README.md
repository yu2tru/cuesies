# cuesies

Cuesies is a daily pool puzzle for the browser. Five tables a day, one goal each, fewest shots wins.
Opens on a home page (today's card, Levels replays, Collection, Stats, Streak) styled like Scoople and Stopple. Everything lives in `index.html` (Three.js + Supabase client from pinned jsDelivr URLs). Host it as a static page.

## Setup

1. Create a Supabase project and run `supabase.sql` in the SQL editor.
2. In `index.html`, fill in `SUPABASE_URL` and `SUPABASE_ANON_KEY` (top of the `<script>` block, "CONFIG").
3. Add five rows to `cuesies_levels` for each date (`level_order` 1–5). The `data` column is the level JSON.
   `supabase-new-levels.sql` has 12 ready-made tables that use the new pieces (placeholder dates in November 2026).

Upgrading from the old `poolsies_` tables? Run `supabase-rename.sql` once instead of step 1.

With empty keys, or if Supabase can't be reached or has fewer than 5 levels for today, the game plays the 5 built-in demo levels and hides the leaderboard.

## Where to change things (all in `index.html`)

| What | Where |
| --- | --- |
| Supabase keys | `SUPABASE_URL`, `SUPABASE_ANON_KEY` under "CONFIG" |
| Puzzle numbering | `LAUNCH_DATE` (the day that was "No. 1") |
| Demo levels | `DEMO_LEVELS` |
| Themes (floor, felt, rails, props) | `THEMES` |
| Obstacle models | `OBST` (box kinds: `toolbox`, `pizzaBox`, `book`, `napkinHolder`, `block`, `bookStack`, `toyWall`, `ramp`, `bumperRail`; circle kinds: `coffeeMug`, `cocoaMug`, `sodaCan`, `snowGlobe`, `sandcastle`, `cone`, `bowlingPin`, `beachBall`, `plant`, `chipStack`, `fan`, `bumper`, `trampoline`; either: `movable`) |
| New levels (not in the daily demo set) | `NEW_LEVELS` |
| 3D physics + new pieces | constants right after `FLOOR_Y` (see below) |
| Physics feel | constants under "table + physics constants" (`MAX_SPEED`, `MU`, `KV`, `E_RAIL`, ...) |
| Font | `--font` in the CSS `:root` (plus the Google Fonts `<link>`) |

Level JSON: positions are table units (x −1..1 across, z −2..2 along, +z is the near end). Obstacle and slow-zone `rotation` is in degrees. Circle obstacles use `radius`; boxes use `size: [w, d]`. Goal types: `count`, `stripes`, `colors`, `specific`, `order`, `last`.


## New pieces (optional level JSON)

Only tables that use one of these run the 3D physics; the original five tables keep the exact flat physics.

| Piece | JSON |
| --- | --- |
| Fan | `{"kind":"fan","pos":[x,z],"radius":0.1,"rotation":0,"strength":1,"range":1.5,"spread":30,"sweep":0}` (blows toward `rotation`; `sweep` = degrees it turns each way, only while balls roll) |
| Movable | `{"kind":"movable","model":"box"/"puck"/"car"/"beachBall","shape":"box"/"circle","size":[w,d] or "radius","height":0.16,"mass":1,"bouncy":false,"friction":null}` (slides when hit, never pocketed, stays put between shots, resets when the table restarts) |
| Bumper | `{"kind":"bumper","pos":[x,z],"radius":0.1,"kick":1,"pop":0}` (`pop` > 0 throws the ball up) |
| Bumper rail | `{"kind":"bumperRail","pos":[x,z],"size":[w,d],"rotation":0,"kick":1}` |
| Ramp | `{"kind":"ramp","pos":[x,z],"size":[length,width],"rotation":0,"angle":20}` (rises toward `rotation`; only the low edge lets balls on) |
| Trampoline | `{"kind":"trampoline","pos":[x,z],"radius":0.1,"bounce":1}` |
| Slope (whole table) | `"slope":{"direction":90,"amount":0.25}` (downhill direction in degrees, amount 0–1) |
| Felt color | `"felt":"#a3182b"` |
| Goal "last" | `"goal":{"type":"last","last":8}` (sink every ball; that one goes last, early costs +1) |

Every obstacle can also take `"height"`. Airborne balls fly over anything lower than they are.

Tuning (in `index.html`, right after `FLOOR_Y`): `GRAVITY`, `E_LAND` / `LAND_SETTLE` (landing bounce), `FAN_ACC` / `FAN_SWEEP_RATE`, `BUMPER_KICK`, `RAIL_KICK`, `POP_VY`, `SLOPE_G` (and `SLOPE_VIS` for how far the table visibly leans), `RAMP_ANGLE_DEFAULT`, `TRAMP_BASE` / `TRAMP_PER_SPEED` / `TRAMP_MAX`, `MOVABLE_MU`, `OBST_H` (default heights).

## Debug mode

Open the page with `?debug` for physics outlines with heights, fan zones, the slope arrow, pocket circles, a dotted path for every flight, and a level picker that includes the 12 new levels. Nothing played with `?debug` is sent to the leaderboard.
