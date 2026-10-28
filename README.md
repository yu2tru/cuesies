# cuesies

Cuesies is a daily pool puzzle for the browser. Five tables a day, one goal each, fewest shots wins.
Opens on a home page (today's card, Levels replays, Collection, Stats, Streak) styled like Scoople and Stopple. Everything lives in `index.html` (Three.js + Supabase client from pinned jsDelivr URLs). Host it as a static page.

## Setup

1. Create a Supabase project and run `supabase.sql` in the SQL editor.
2. In `index.html`, fill in `SUPABASE_URL` and `SUPABASE_ANON_KEY` (top of the `<script>` block, "CONFIG").
3. Add five rows to `cuesies_levels` for each date (`level_order` 1–5). The `data` column is the level JSON.
   `supabase-new-levels.sql` has 12 ready-made tables and `supabase-addon-levels.sql` 6 more (shaped tables and moving pieces) that use the new pieces (placeholder dates in November 2026).

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
| Ice table | `"surface":"ice"` (balls and movables glide about 1.5x farther; a puck keeps its own friction) |
| Water puddle | slow zone with `"kind":"water"`: no friction inside, so balls carry further than the dotted line shows |
| Props | `lamp` (circle, clicks on/off when hit), `umbrella` (circle, pole through the table), `teddy`, `cocktail` (circles), `dice` (box) |
| Room props | circles: `rootBeer`, `ketchup`, `milkshake`, `tire`, `paintCan`, `flowerPot`, `lemonade`, `sandBucket`, `lantern`, `ramen`, `bowlingBall`, `roulette`, `rubberDuck`, `stackRings`; boxes: `boardGame`, `cooler`, `logStack`, `laptop`, `succulent`, `speaker`, `bowlingShoe`, `cardDeck` |
| Conveyor belt | `{"kind":"conveyor","path":[[x,z],[x,z]],"width":0.15,"speed":1,"loop":false}` (carries rolling balls along; a ball rides belts at most ~3 s per shot) |
| Turntable | `{"kind":"turntable","model":"record"/"lazySusan","pos":[x,z],"radius":0.2,"spin":1,"label":"#e2483c","plates":0}` (bends rolling balls; the sign of spin picks the way) |
| Gopher holes | `{"kind":"gopherHole","id":"a1","pairId":"a2","pos":[x,z],"exitDirection":90,"exitSpeed":0.3}` (drop in one, pop out of its pair heading exitDirection; never a pocket) |
| Piston | `{"kind":"piston","pos":[x,z],"size":[w,d] (or "shape":"circle","radius"),"height":0.15,"period":2.5,"phase":0}` (up for half of each cycle; phase is a fraction of a cycle; waits while a ball sits on it) |
| Sliding drawer | `{"kind":"slider","from":[x,z],"to":[x,z],"size":[w,d],"period":3,"phase":0}` (shoves balls in its way, even resting ones; that push isn't a shot) |
| Roulette saucer | `{"kind":"roulette","pos":[x,z],"radius":0.35,"spin":1,"depth":0.06,"centerIsPocket":true}` (slopes toward a center hole; otherwise the ball returns to its spot for +1) |
| Shaped table | `"shape":{"outline":[[x,z],...],"islands":[[[x,z],...]],"cornerRadius":0.08},"pockets":[[x,z],...]` (outline = cushion line; pockets snap to the nearest rail; "pockets" alone keeps the normal rectangle) |
| Goal "last" | `"goal":{"type":"last","last":8}` (sink every ball; that one goes last, early costs +1) |

Every obstacle can also take `"height"`. Airborne balls fly over anything lower than they are.

Tuning (in `index.html`, right after `FLOOR_Y`): `GRAVITY`, `E_LAND` / `LAND_SETTLE` (landing bounce), `FAN_ACC` / `FAN_SWEEP_RATE`, `BUMPER_KICK`, `RAIL_KICK`, `POP_VY`, `SLOPE_G` (and `SLOPE_VIS` for how far the table visibly leans), `RAMP_ANGLE_DEFAULT`, `TRAMP_BASE` / `TRAMP_PER_SPEED` / `TRAMP_MAX`, `MOVABLE_MU`, `ICE_FRICTION`, `OBST_H` (default heights), `CONVEYOR_SPEED` / `CONVEYOR_GRIP` / `CONVEYOR_MAX_RIDE`, `TURNTABLE_CURVE` (and `TURNTABLE_VIS`), `GOPHER_EXIT` / `GOPHER_DELAY`, `PISTON_RISE` (period and phase are per piston/slider in the level), `ROULETTE_PULL` / `ROULETTE_CURVE` / `ROULETTE_DROP_SPEED` (spin, radius and depth are per saucer), `GOLD_COLOR` / `GOLD_ROUGHNESS`, `LAZY_SUSAN_SPEED` / `SUSAN_RING` (size is the turntable's radius; "plates": 3 puts solid sushi plates on it), `BELT_TILE` (chevron spacing).

Moving pieces all run on one clock that starts at 0 when a table loads and never pauses, so the pattern is the same for everyone and timing is part of the skill. Belts, turntables, the saucer and fans only push balls that are already rolling.

The 8 ball: sinking it when the goal doesn't call for it (or before the others on a "sink the 8 last" table) is +2 and it goes back to its spot.

## Music

Put tracks in `music/` and list them in `MUSIC_TRACKS` near the top of `index.html` (see `music/README.md`). They play shuffled with crossfades; the ♪ button appears once there's at least one.

## Debug mode

Open the page with `?debug` for physics outlines with heights, fan zones, the slope arrow, pocket circles, a dotted path for every flight, and a level picker that includes the 12 new levels. Nothing played with `?debug` is sent to the leaderboard.
