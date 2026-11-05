# cuesies

Cuesies is a daily pool puzzle for the browser. Five tables a day, one goal each, fewest shots wins.
Opens on a home page (today's card, Levels replays, Collection, Stats, Streak) styled like Scoople and Stopple. Everything lives in `index.html` (Three.js + Supabase client from pinned jsDelivr URLs). Host it as a static page.

## Setup

1. Create a Supabase project and run `supabase.sql` in the SQL editor.
2. In `index.html`, fill in `SUPABASE_URL` and `SUPABASE_ANON_KEY` (top of the `<script>` block, "CONFIG").
3. Add five rows to `cuesies_levels` for each date (`level_order` 1–5). The `data` column is the level JSON.
   `supabase-new-levels.sql` has 12 ready-made tables and `supabase-addon-levels.sql` 6 more (shaped tables and moving pieces), and `supabase-themed-levels.sql` 5 on themed tables (laundromat, bakery, campsite, science lab, bowling alley), that use the new pieces (placeholder dates in November 2026).

Upgrading from the old `poolsies_` tables? Run `supabase-rename.sql` once instead of step 1.

With empty keys, or if Supabase can't be reached or has fewer than 5 levels for today, the game plays the 5 built-in demo levels and hides the leaderboard.

## Where to change things (all in `index.html`)

| What | Where |
| --- | --- |
| Supabase keys | `SUPABASE_URL`, `SUPABASE_ANON_KEY` under "CONFIG" |
| Puzzle numbering | `LAUNCH_DATE` (the day that was "No. 1") |
| Demo levels | `DEMO_LEVELS` |
| Scenes (floor, wall, lighting, table styles, background props, on-table objects) | `SCENE_CATALOG` at the top of the script (levels pick one with `"scene"` or `"theme"`) |
| Obstacle models | `OBST` (box kinds: `toolbox`, `pizzaBox`, `book`, `napkinHolder`, `block`, `bookStack`, `toyWall`, `ramp`, `bumperRail`; circle kinds: `coffeeMug`, `cocoaMug`, `sodaCan`, `snowGlobe`, `sandcastle`, `cone`, `bowlingPin`, `beachBall`, `plant`, `chipStack`, `fan`, `bumper`, `trampoline`; either: `movable`) |
| New levels (not in the daily demo set) | `NEW_LEVELS` |
| 3D physics + new pieces | constants right after `FLOOR_Y` (see below) |
| Physics feel | constants under "table + physics constants" (`MAX_SPEED`, `MU`, `KV`, `E_RAIL`, ...) |
| Font | `--font` in the CSS `:root` (plus the Google Fonts `<link>`) |

Background props: a level gets its scene's `layout`. It can replace it with `"props": ["name", ...]`, drop some with `"hideProps": [...]`, or add with `"extraProps": [...]`. Each entry is a prop name from the scene's catalog, `["name", x, z, rotation]` to move one, or `["decorType", x, z, "floor"|"rail", rotation, {options}]` for a new placement.

Level JSON: positions are table units (x −1..1 across, z −2..2 along, +z is the near end). Obstacle and slow-zone `rotation` is in degrees. Circle obstacles use `radius`; boxes use `size: [w, d]`. Goal types: `count`, `stripes`, `colors`, `specific`, `order`, `last`.


## New pieces (optional level JSON)

Only tables that use one of these run the 3D physics; the original five tables keep the exact flat physics.

| Piece | JSON |
| --- | --- |
| Fan | `{"kind":"fan","pos":[x,z],"radius":0.1,"rotation":0,"strength":1,"range":1.5,"spread":30,"sweep":0}` (blows toward `rotation`; `sweep` = degrees it turns each way, only while balls roll) |
| Movable | `{"kind":"movable","model":"box"/"puck"/"car"/"beachBall"/"rug","shape":"box"/"circle","size":[w,d] or "radius","height":0.16,"mass":1,"bouncy":false,"friction":null}` (slides when hit, never pocketed, stays put between shots, resets when the table restarts; boxes and rugs also turn when hit off-center; a rug rolls across its length) |
| Bumper | `{"kind":"bumper","pos":[x,z],"radius":0.1,"kick":1,"pop":0}` (a pinball pop bumper; with `pop` > 0 it's a spring bumper that throws the ball up; the bounce direction depends only on where it's hit, never on speed) |
| Bumper rail | `{"kind":"bumperRail","pos":[x,z],"size":[w,d],"rotation":0,"kick":1}` |
| Ramp | `{"kind":"ramp","pos":[x,z],"size":[length,width],"rotation":0,"angle":20}` (rises toward `rotation`; only the low edge lets balls on) |
| Trampoline | `{"kind":"trampoline","pos":[x,z],"radius":0.13,"bounce":1}` (a mushroom bouncer) |
| Tilted patch | `"tilts":[{"poly":[[x,z],...],"direction":24,"amount":0.2}]` (only that part of the felt leans) |
| Toy blocks | `{"kind":"toyStack","pos":[x,z],"size":[w,d],"layers":["#ff6b57","#ffd166"]}` (one color per layer; each layer wobbles on its own) |
| Coffee hole | `{"kind":"coffeeHole","pos":[x,z],"radius":0.6}` (a round hole full of coffee; a ball that falls in counts like going off the table) |
| Pocket lid | `{"kind":"pocketCap","shape":"circle","pos":[x,z],"radius":0.2,"label":"CLOSED"}` (a giant chip that closes a pocket) |
| Slope (whole table) | `"slope":{"direction":90,"amount":0.25}` (downhill direction in degrees, amount 0–1) |
| Felt color | `"felt":"#a3182b"` |
| Ice table | `"surface":"ice"` (balls and movables glide about 1.5x farther; a puck keeps its own friction) |
| Water puddle | slow zone with `"kind":"water"`: no friction inside, so balls carry further than the dotted line shows |
| Slow zone strength | any slow zone can take `"friction"` (default 4.2) |
| Props | `lamp` (circle, clicks on/off when hit), `umbrella` (circle, pole through the table, sways when hit), `teddy`, `cocktail`, `wineGlass` (circles), `dice` (box) |
| Room props | circles: `rootBeer`, `ketchup`, `milkshake`, `tire`, `paintCan`, `flowerPot`, `lemonade`, `sandBucket`, `lantern`, `ramen`, `bowlingBall`, `roulette`, `rubberDuck`, `stackRings`, `noodleBox`, `nightLight`, `knitHat`, `tokenCup`, `arcadeStick`, `ticketPile`, `oilCan`, `hardHat`, `gearPart`; boxes: `gasCan`, `iceSkates`, `boardGame`, `cooler`, `logStack`, `laptop`, `succulent`, `speaker`, `bowlingShoe`, `cardDeck` |
| Conveyor belt | `{"kind":"conveyor","path":[[x,z],[x,z]],"width":0.15,"speed":1,"loop":false,"plates":0,"plateRadius":0.07}` (carries rolling balls along; a ball rides belts at most ~3 s per shot; plates ride it as solid pieces) |
| Turntable | `{"kind":"turntable","model":"record"/"lazySusan","pos":[x,z],"radius":0.2,"spin":1,"label":"#e2483c","plates":0}` (bends rolling balls; the sign of spin picks the way: + is clockwise from above; a record player's silver tonearm is solid, and `rotation` turns the whole player) |
| Gopher holes | `{"kind":"gopherHole","id":"a1","pairId":"a2","pos":[x,z],"exitDirection":90,"exitSpeed":0.3}` (drop in one, pop out of its pair heading exitDirection; never a pocket) |
| Piston | `{"kind":"piston","pos":[x,z],"size":[w,d] (or "shape":"circle","radius"),"height":0.15,"period":2.5,"phase":0}` (up for half of each cycle; phase is a fraction of a cycle; waits while a ball sits on it; in the factory it's a pair of sliding doors that open into housings at each end) |
| Sliding drawer | `{"kind":"slider","from":[x,z],"to":[x,z],"size":[w,d],"period":3,"phase":0}` (shoves balls in its way, even resting ones; that push isn't a shot) |
| Roulette saucer | `{"kind":"roulette","pos":[x,z],"radius":0.35,"spin":1,"depth":0.06,"centerIsPocket":true}` (slopes toward a center hole and carries balls around the way it spins; otherwise the ball returns to its spot for +1) |
| Shaped table | `"shape":{"outline":[[x,z],...],"islands":[[[x,z],...]],"cornerRadius":0.08},"pockets":[[x,z],...]` (outline = cushion line; pockets snap to the nearest rail; "pockets" alone keeps the normal rectangle) |
| Goal "last" | `"goal":{"type":"last","last":8}` (sink every ball; that one goes last, early costs +1) |
| Soap suds | slow zone `{"kind":"suds","shape":"circle","pos":[x,z],"radius":0.24}` (soaks up speed once as a ball plunges in, then it rolls slowly through) |
| Washer drum | `{"kind":"washer","pos":[x,z],"radius":0.22,"spin":1}` (set into the surface; bends rolling balls its spin way, harder near the rim, not at all in the middle) |
| Flour dust | slow zone `{"kind":"flour",...}` (light drag; balls wipe trails in it that stay for the rest of the attempt) |
| Dough blob | `{"kind":"dough","shape":"circle","pos":[x,z],"radius":0.1}` (a ball hitting it leaves with about 30% of its speed; it squashes and puffs back) |
| Mud | slow zone `{"kind":"mud",...}` (much heavier than any spill; ripples where balls pass) |
| Stream | slow zone `{"kind":"stream","shape":"box","pos":[x,z],"size":[length,width],"rotation":0,"strength":1,"waterfall":false}` (flows toward `rotation`, carries moving balls downstream; with `"waterfall":true`, where it crosses the table's edge the cushion opens and a ball carried over leaves the table: cue +2, others +1 and back to their spot) |
| Log bridge | `{"kind":"logBridge","pos":[x,z],"size":[w,d]}` (laid across a stream; balls on it aren't pushed by the water) |
| Magnet | `{"kind":"magnet","pos":[x,z],"radius":0.11,"range":0.8,"strength":1,"rotation":0}` (pulls rolling balls toward it, harder the closer; the horseshoe opens toward `rotation`) |
| Boost pad | slow zone `{"kind":"boost","shape":"box","pos":[x,z],"size":[w,d],"rotation":-90,"strength":1}` (pushes balls crossing it toward `rotation`) |
| Oiled lane | slow zone `{"kind":"oil",...}` (almost no friction; slopes, magnets and spinners don't bend a ball on it) |
| Gutter | slow zone `{"kind":"gutter","shape":"box","pos":[x,z],"size":[length,width],"rotation":-90}` (a ball that drops in rides it to the end, toward `rotation`; if the end runs into a pit it's lost there, never the pocket) |
| Pin pit | slow zone `{"kind":"pit","shape":"box",...}` (a drop-off: the cushion opens where it overlaps the table edge; a ball that rolls in is lost, cue +2, others +1 and back to their spot; pins that fall in are gone) |
| Walls | `"walls":[[[x,z],...]]` (free-standing walls, cushions on both sides; on the bowling lane, the curved backstop around the pocket) |
| Floor height | scene `"floorY"` (the bowling alley's lane sits right on the floor) |
| Table surface | `"friction":1.15` (the table's own rolling friction: 0.85 for lane wood, 1.15 for frosting; the power line uses it) |
| Raised deck | `"deck":{"poly":[[x,z],...],"height":0.1,"ramp":{"from":[x,z],"to":[x,z],"width":0.42},"walls":[[[x,z],...]]}` (a second, higher level; the ramp runs from the lower floor up to the deck and pulls balls back down like real gravity; wall lines are cushions on both sides) |
| Pocket in the surface | `"freePockets":[[x,z]]` (a round pocket anywhere on the surface or the deck, like a petri dish) |
| New movables | `"model"`: `"cart"` (laundry cart), `"rollingPin"` (rolls across its length), `"pinecone"` (light), `"pin"` (bowling pin: tips over and scatters), `"bowlingBall"` (heavy, rolls) |
| New props | circles: `detergent`, `layeredCake`, `cupcake`, `sprinkleJar`, `beaker`, `flask`, `deskGlobe`; boxes: `towelStack`, `log`, `marshmallowStick`, `testTubeRack` |

Every obstacle can also take `"height"`. Airborne balls fly over anything lower than they are.

Tuning for the themed rooms (right after `MAX_SHOT_TIME`): `SUDS_SOAK` / `SUDS_FRICTION`, `WASHER_CURVE`, `FLOUR_FRICTION`, `DOUGH_KEEP`, `MUD_FRICTION`, `STREAM_SPEED` / `STREAM_GRIP`, `MAGNET_ACC`, `BOOST_ACC`, `OIL_FRICTION`, `GUTTER_SPEED`; per piece, `strength` (stream, magnet, boost), `range` (magnet), `spin` (washer) and `friction` (any slow zone).

Tuning (in `index.html`, right after `FLOOR_Y`): `GRAVITY`, `E_LAND` / `LAND_SETTLE` (landing bounce), `FAN_ACC` / `FAN_SWEEP_RATE`, `BUMPER_KICK`, `RAIL_KICK`, `POP_VY`, `SLOPE_G` (and `SLOPE_VIS` for how far the table visibly leans), `RAMP_ANGLE_DEFAULT`, `TRAMP_BASE` / `TRAMP_PER_SPEED` / `TRAMP_MAX`, `MOVABLE_MU`, `ICE_FRICTION`, `OBST_H` (default heights), `CONVEYOR_SPEED` / `CONVEYOR_GRIP` / `CONVEYOR_MAX_RIDE`, `TURNTABLE_CURVE` (and `TURNTABLE_VIS`), `GOPHER_DELAY` (balls come out at the speed they went in), `PISTON_RISE` (period and phase are per piston/slider in the level), `ROULETTE_PULL` / `ROULETTE_GRIP` / `ROULETTE_DRAG` / `ROULETTE_SWIRL` / `ROULETTE_DROP_SPEED`, `BUMPER_BOUNCE`, `DOOR_H` (spin, radius and depth are per saucer), `GOLD_COLOR` / `GOLD_ROUGHNESS`, `LAZY_SUSAN_SPEED` / `SUSAN_RING` (size is the turntable's radius; "plates": 3 puts solid sushi plates on it), `BELT_TILE` (chevron spacing), `PRESS_LIFT` / `PRESS_HEAD` (overhead presses), `BOX_TURN_MU` / `BOX_MAX_SPIN` (spinning boxes), `TOY_LAYER` (toy block height), `WALL_Z` (where scene walls stand).

Moving pieces all run on one clock that starts at 0 when a table loads and never pauses, so the pattern is the same for everyone and timing is part of the skill. Belts, turntables, the saucer and fans only push balls that are already rolling.

The 8 ball: sinking it when the goal doesn't call for it (or before the others on a "sink the 8 last" table) is +2 and it goes back to its spot.

## Scene catalog

Every level picks a scene with `"theme"` (or `"scene"`). The five rooms at the bottom build their own table (`tableKind`) instead of a pool table; any level using them gets that table, with its own outline and pockets.

| Key | Place | Table | Floor | Wall | Background props | On-table objects | Effects |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `basement` | Basement game room | Classic pool table | planks | panel | rug, dartboard, wallLamp, plant, cues, beanbag, sodaCan, chalk, armchair, boardGame, rootBeer, standFan | rootBeer, boardGame, book, bookStack, lamp, ramp |  |
| `library` | Old library | Classic pool table | tiles | shelves | rug, bookshelf, armchair, globe, floorLamp, boardGame, bookStack, wallLamp, wallClock | lamp, book, bookStack, ramp, coffeeMug |  |
| `diner` | Diner | Classic pool table | linoleum | diner | stool, jukebox, booth, wallClock, bottle, glass, ketchup, milkshake | coffeeMug, ketchup, milkshake, napkinHolder, coffeeHole |  |
| `garage` | Garage | Classic pool table | concrete | pegboard | tires, cone, gasCan, toolboxDecor, sodaCan, wrench, paintCan, tire, crate, shopLight, standFan, workbench | toolbox, cone, sodaCan, tire, paintCan, gasCan, fan |  |
| `patio` | Backyard patio | Classic pool table | deck | siding | planter, grill, umbrella, lemonadeGlass, flowerPot, patioChair, wallLamp, standFan | umbrella, plant, flowerPot, lemonade |  |
| `boardwalk` | Beach boardwalk | Classic pool table | sand | ocean | umbrella, beachBall, towelDecor, bucket, starfish, lemonadeGlass, cooler, sandBucket, surfboard, lifeguardChair | sandcastle, beachBall, sandBucket, cooler, fan |  |
| `cabin` | Ski cabin | Classic pool table | knotPlanks | logs | rug, firewood, pine, skis, lantern, mugDecor, armchair, hockeySticks, woodStove, wallLamp, skatesDecor | cocoaMug, snowGlobe, book, lantern, nightLight, iceSkates, knitHat |  |
| `dorm` | College dorm (moving day) | Classic pool table | carpet | dorm | movingBoxes, lavaLamp, pizzaDecor, takeoutBoxes, deliveryBag, laptop, packingTape, rolledRug, movingTruck, sodaCan, fairyLights, fridge | movable, pizzaBox, laptop, noodleBox, ramen, sodaCan |  |
| `rooftop` | Rooftop bar | Classic pool table | tiles | skyline | flowerPlanter, stringLights, barStool, glass, acUnit, speakerDecor, plant | ramp, fan, succulent, speaker, cocktail |  |
| `bowling` | Bowling alley lounge | Classic pool table | lanes | lanes | pins, bowlingBall, ballReturn, sodaCan, bowlingShoe, neonSign, booth | bowlingPin, bowlingShoe, bowlingBall, sodaCan |  |
| `casino` | Casino lounge | Classic pool table | medallion | casino | machineWall, slotMachine, velvetRope, cardTable, chipRack, chipStacks, barStool, dice, cardDeck | bumper, bumperRail, chipStack, dice, cardDeck, wineGlass, cocktail, roulette, pocketCap, slotMachine |  |
| `records` | Record store | Classic pool table | checker | brick | recordCrate, listeningBooth, posterWall, neonSign, cassetteStack, guitarAmp, guitarStand, vinylWall, headphones, speakerDecor | turntable, boombox, lpStack |  |
| `sushi` | Sushi bar | Classic pool table | tatami | slats | shoji, noren, paperLantern, bamboo, bonsai, sakeSet, teapot | conveyor, turntable |  |
| `garden` | Backyard garden | Classic pool table | grass | hedge | wateringCan, gnome, fence, wheelbarrow, flowerPot, steppingStones, pathLight, birdbath, flowerClump, gopherDecor, patioChair, grill, lemonadeGlass, umbrella | gopherHole, flowerPot, plant, lemonade, umbrella, gnome, wateringCan |  |
| `factory` | Factory floor | Classic pool table | diamondPlate | factory | gear, crateStack, forklift, pipes, warningLight, barrels, pallet, controlPanel, shopLight, standFan | conveyor, piston, oilCan, hardHat, gearPart |  |
| `arcade` | Arcade | Classic pool table | neon | arcade | arcadeCabinet, clawMachine, prizeCounter, ticketRolls, skeeBall, neonSign, airHockey | piston, slider, tokenCup, arcadeStick, ticketPile |  |
| `playroom` | Kids' playroom | Classic pool table | foam | nursery | toyBlocks, teddy, duck, beanbag, stackRings, rubberDuck, toyShelf, rockingHorse, wallClock | toyStack, toyWall, trampoline, teddy, stackRings, rubberDuck |  |
| `laundromat` | Laundromat | L-shaped laminate folding counter: towel-roll cushions, washer-door pockets, cabinet base | checker | laundromat | washerRow, dryerStack, foldingTable, vendingMachine, laundryBasket, wetFloorSign | detergent, towelStack, movable:cart, suds, washer | suds, washer drums |
| `bakery` | Bakery | Giant cake stand: frosting top, piped border, donut-hole pockets, pedestal | planks | bakery | displayCase, standMixer, flourSack, coolingRack, chalkboard | layeredCake, cupcake, movable:rollingPin, sprinkleJar, flour, dough | flour dust, dough blobs |
| `campsite` | Campsite | Tree-trunk slab: growth rings, bark rim, knothole pockets, stump base | dirt | forest | tent, campfire, pineTree, canoe, lanternPost, log | log, cooler, marshmallowStick, movable:pinecone, mud, stream, logBridge | mud, stream, log bridge, waterfall edge |
| `lab` | Science lab | Lab bench: black slate with grid, glowing glass-tube rails, petri-dish pockets (can be two-level) | tiles | lab | labBench, bubblingBeakers, periodicPoster, microscope, glowCoil | beaker, flask, testTubeRack, deskGlobe, magnet, boost | magnets, boost pads, raised deck + ramp |
| `bowlingAlley` | Bowling alley | Bowling lane: polished boards with arrows, built-in gutters, pin-pit pocket | casino | lanes | neighborLane, ballReturn, shoeCounter, scoreboard, neonSign | movable:pin, movable:bowlingBall, bowlingShoe, oil, gutter | oiled lane, gutters |

## Music

Put tracks in `music/` and list them in `MUSIC_TRACKS` near the top of `index.html` (see `music/README.md`). They play shuffled with crossfades; the ♪ button appears once there's at least one.

## Renders mode

Open the game with `?renders` (for example `https://yu2tru.github.io/cuesies/?renders`) to look at every object on its own instead of playing. The game doesn't start, nothing is saved, and nothing is sent to Supabase; the code lives in `renders.js` and is only loaded in this mode.

- **Previous / Next** buttons (or ← →) step through every on-table piece, movable, background prop and the ball. Drag to turn all the way around (and underneath), pinch or scroll to zoom.
- **Look** (or keys 1–4): A = the game as it is, B = new lighting (room environment, key + rim light, soft contact shadow), C = smoother geometry (double segments, creased normals), D = B + C.
- **Snap** (or P) downloads a PNG of the current object in all four looks, from the current angle.

## Debug mode

Open the page with `?debug` for physics outlines with heights, fan zones, the slope arrow, pocket circles, a dotted path for every flight, and a level picker that includes the 18 new levels, and a button that turns the hitboxes on and off. Nothing played with `?debug` is sent to the leaderboard.
