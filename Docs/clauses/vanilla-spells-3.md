# Clauses — vanilla spells, the third batch

*Spell tracker, clausified. Sixty pf2e Player Core spells, each chosen for a **shape** the first hundred
rows' worth of work (the pilot in `Docs/vanilla.md` and the forty in `vanilla-spells.md`) did not exercise.
Every spell is broken into **clauses**: independently-failable statements quoted from pf2e's own text, one
row each.*

**Tracker issue:** #57 · **Source:** pf2e 8.4.1's own spell text, as the sheet prints it
(`npm run index:pf2e` writes it to `build/data/pf2e-spell-text.json`).

## How a row is marked

| Mark | Meaning |
| :-- | :-- |
| ☐ | Not yet driven |
| ✅ | Driven live; the clause happened by itself |
| ⚠️ | Driven live; partially happens — the gap is named in **Evidence** |
| ❌ | Driven live; does not happen |
| 🔧 | Was ❌ or ⚠️, a fix has landed, awaiting re-drive |
| — | Nothing to automate (pure roleplaying / GM ruling) |

**Clause** is a verbatim fragment of the spell's text. `npm test` asserts it still is one, so a paraphrase
here or a pf2e rewording fails the build. **Must happen** is what the drive has to see. **Static check**
names what guards it offline (an entry in `content/vanilla/`, a test); **Evidence** names what proved it in
world `pf`. A spell is done when every one of its clauses is ✅ or —.

Clause IDs are the spell's ID and a letter: `VS-41c` is the third clause of VS-41. Drives run with this
module alone — PF2e Automations and PF2e Assistant off.

*How a clause is driven — the rig, the traps and what a ✅ owes — is `Docs/tools/live-verification.md`.*

## The spells

| ID | Spell | Rank | Shape | Batch |
| :-- | :-- | :-- | :-- | :-- |
| VS-41 | `floating-flame` | 2 | An area moved on Sustain, harming along its path | 1 |
| VS-42 | `toxic-cloud` | 5 | An area that drifts away from the caster | 1 |
| VS-43 | `lightning-storm` | 5 | A storm that calls a bolt on each Sustain | 1 |
| VS-44 | `falling-stars` | 9 | Four bursts, one save | 1 |
| VS-45 | `gravity-well` | 3 | Pulled toward a centre | 1 |
| VS-46 | `repulsion` | 6 | An aura that stops approach | 1 |
| VS-47 | `wall-of-stone` | 5 | A wall of breakable sections | 2 |
| VS-48 | `wall-of-thorns` | 3 | Damage for every move into the wall | 2 |
| VS-49 | `hypnotize` | 3 | A cloud that fascinates | 2 |
| VS-50 | `slither` | 5 | Grabbed or restrained by the ground | 2 |
| VS-51 | `tangling-creepers` | 6 | A vine that strikes from the area on Sustain | 2 |
| VS-52 | `weapon-storm` | 4 | Damage dice from the weapon in hand | 2 |
| VS-53 | `spiritual-armament` | 2 | Sustain repeats the attack | 3 |
| VS-54 | `telekinetic-maneuver` | 2 | A maneuver rolled with the spell attack | 3 |
| VS-55 | `blazing-bolt` | 2 | A ray per action, the penalty after all of them | 3 |
| VS-56 | `live-wire` | 1 | Damage on a miss | 3 |
| VS-57 | `disintegrate` | 6 | An attack, then a save; dust at 0 | 3 |
| VS-58 | `blister` | 5 | Charges spent by an action, each a cone from the target | 3 |
| VS-59 | `spider-sting` | 1 | An affliction with stages | 4 |
| VS-60 | `seal-fate` | 4 | A chosen weakness that kills | 4 |
| VS-61 | `vision-of-death` | 4 | Killed at 0 by this spell; fleeing while frightened | 4 |
| VS-62 | `wave-of-despair` | 5 | A save at each turn start decides that turn | 4 |
| VS-63 | `phantasmal-calamity` | 6 | A second save on a critical failure | 4 |
| VS-64 | `massacre` | 9 | A backlash when nobody dies | 4 |
| VS-65 | `schadenfreude` | 1 | A reaction to your own critical failure | 5 |
| VS-66 | `blinding-fury` | 6 | A reaction to being hurt: unseen by the one who hurt you | 5 |
| VS-67 | `breath-of-life` | 5 | A reaction to a death | 5 |
| VS-68 | `stabilize` | 1 | Dying ended, unconscious kept | 5 |
| VS-69 | `sound-body` | 2 | A counteract against a condition, or a suppression | 5 |
| VS-70 | `cleanse-affliction` | 2 | An affliction's stage lowered | 5 |
| VS-71 | `enlarge` | 2 | A size change | 6 |
| VS-72 | `animal-form` | 2 | A battle form | 6 |
| VS-73 | `fly` | 4 | A Speed granted | 6 |
| VS-74 | `earthbind` | 3 | Brought down and kept down | 6 |
| VS-75 | `levitate` | 3 | Elevation moved on Sustain | 6 |
| VS-76 | `vapor-form` | 4 | Actions forbidden | 6 |
| VS-77 | `resist-energy` | 2 | A resistance of a chosen type | 7 |
| VS-78 | `mountain-resilience` | 4 | A duration worn down by hits | 7 |
| VS-79 | `protection` | 1 | A bonus that becomes an aura from a rank | 7 |
| VS-80 | `fire-shield` | 4 | A shield that burns who it blocks | 7 |
| VS-81 | `share-life` | 2 | Damage split with the caster | 7 |
| VS-82 | `protector-tree` | 1 | Something that takes the blow for an ally | 7 |
| VS-83 | `guidance` | 1 | A bonus spent by the roll it is used on | 8 |
| VS-84 | `nudge-fate` | 1 | A bonus applied after the roll, when it matters | 8 |
| VS-85 | `runic-weapon` | 1 | A weapon given runes | 8 |
| VS-86 | `infuse-vitality` | 1 | Targets by actions; Strikes deal more | 8 |
| VS-87 | `moon-frenzy` | 5 | Strikes granted | 8 |
| VS-88 | `evil-eye` | 1 | A condition that can't drop below a value | 8 |
| VS-89 | `unfettered-movement` | 4 | An Escape that always succeeds | 9 |
| VS-90 | `planar-tether` | 4 | Teleportation counteracted | 9 |
| VS-91 | `blur` | 2 | Concealed: a flat check to hit | 9 |
| VS-92 | `silence` | 2 | Spellcasting refused | 9 |
| VS-93 | `summon-animal` | 1 | A summoned creature | 9 |
| VS-94 | `final-sacrifice` | 2 | A minion spent as an area | 9 |
| VS-95 | `darkvision` | 2 | A sense granted | 10 |
| VS-96 | `see-the-unseen` | 2 | The invisible seen, as concealed | 10 |
| VS-97 | `revealing-light` | 2 | Invisible made concealed, concealment taken away | 10 |
| VS-98 | `light` | 1 | A light that is placed, attached and moved | 10 |
| VS-99 | `detect-magic` | 1 | Information told to the caster | 10 |
| VS-100 | `vital-beacon` | 4 | Healing others take from you, weaker each time | 10 |

## Batch 1 — Areas that move or multiply

### VS-41 · Floating Flame

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-41a | "The flame deals 3d6 fire damage to each creature in the square in which it appears, with a basic Reflex save" | A 5-ft square is placed within 30 ft; each creature in it rolls a basic Reflex save against 3d6 fire | `content/vanilla/floating-flame.json` (areaTargeting, a lingering area with `sustain.move`) | ✅ | Aries cast it at rank 2 in a combat with Capricorn, Leo and ZZ Victim in a row (3800/3900/4000, 1500). The placement was a 5-ft square; on Capricorn's square it targeted **Capricorn alone**, and pf2e's card rolled **3d6 fire** with its basic Reflex save. On an empty square: "Nothing in the area", and *No* cast it with nobody caught. The flame stayed as a Region, and Aries got *Sustain Drive: Floating Flame* |
| VS-41b | "When you Sustain this spell, you can levitate the flame up to 10 feet" | Sustaining moves the square up to 10 ft, and no farther | `chooseFlight`, `COMPASS` in `scripts/targeting/lingering.mjs` | ✅ | Sustaining in round 2 asked "Move Floating Flame": eight directions and a distance of **5 or 10 ft** (10 preselected, nothing farther). East 10 → the square went 3800 → **4000**; a later 5 ft south moved the other flame **one square** |
| VS-41c | "It then deals damage to each creature whose space it shared at any point during its flight" | Every creature the square passed over saves, not only those where it stops | `sweptPath`, `overlaps` tests | ✅ | East 10 ft from Capricorn's square: **Capricorn, Leo and ZZ Victim** (start, middle, end) each saved; Aries, off the path, was untouched (200 → 200). Back west 10 in round 3: the same three again. A 5-ft move over empty ground: "over 0 creature(s)" |
| VS-41d | "you roll the damage once each time you Sustain" | One damage roll per Sustain, shared by everyone it hits | `burnAlong` | ✅ | One roll per Sustain — "Floating Flame — its flight" **3d6 = 14** — then each save took its share of it: Capricorn and Leo succeeded (**7** each), ZZ Victim critically failed (**28**). Round 3: one roll of 11 → 5, 5, 22 |
| VS-41e | "A given creature can take damage from floating flame only once per round" | A creature already burned this round is passed over | `alreadyBurned` test; the area's `burned` record | ✅ | The flight records each creature it burned against the round (`burned` = round 2 for all three). A second Sustain in the same round was refused — "Floating Flame has already been Sustained this round" — with no dialog and no damage, so nobody could be burned twice; in round 3 the same three were burned again |
| VS-41f | "The damage increases by 1d6" | Rank 3 deals 4d6 | `scaledSustain` (heightening on the area) | ✅ | Cast again at **rank 3**: the new flame's Sustain damage reads **4d6** (the rank-2 flame's reads 3d6) |

### VS-42 · Toxic Cloud

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-42a | "This functions as Mist" | Inside the 20-ft burst, creatures are concealed as with *Mist* (VS-07) | `content/vanilla/toxic-cloud.json` (`inside`: *Mist*'s concealment) | ✅ | Aries cast it at rank 5 on a 20-ft burst centred at (4100, 1500): Capricorn, ZZ Victim and the Ghoul inside were **concealed** (with the *Toxic Cloud* inside-effect); Aries, outside, was not. When it was dismissed, the concealment came off |
| VS-42b | "the area moves 10 feet away from you each round" | Each round the area moves 10 ft directly away from the caster | `drifts`, `Lingering.drift`, `drifted` test | ✅ | At the start of Aries' turn in round 2 the cloud moved **10 ft east** (4100 → 4300), directly away from Aries in the west. Aries was then moved north; at round 3's turn start it moved **10 ft south** (1500 → 1700) — away from where Aries stood |
| VS-42c | "You deal 6d8 poison damage to each breathing creature that starts its turn in the spell's area" | A creature starting its turn inside rolls a basic Fortitude save against 6d8 poison; one that doesn't breathe is passed over | lingering `save` (basic Fortitude, `events: [tokenTurnStart]`, `targetPredicate`: not undead, not construct) | ✅ | Capricorn's turn start: Fortitude vs DC 34, failure → **6d8 poison = 31**. ZZ Victim's: critical failure → **68** (doubled). The **Ghoul** (undead, which doesn't breathe) started its turn inside and was passed over — no save, no damage. Aries, outside, nothing |
| VS-42d | "You can Dismiss the spell" | Dismissing it removes the area | `scripts/riders/dismiss.mjs` (`dismiss: true` grants *Dismiss Toxic Cloud*) | ✅ | Aries held **Dismiss Drive: Toxic Cloud** (1 action, concentrate). Using it: "Aries dismisses Toxic Cloud.", the Region gone, its concealment off Capricorn and the Ghoul, and the action gone from the sheet. Found on the way: the area's own clean-up removed the action first and swallowed the chat line; the line now comes first |
| VS-42e | "The damage increases by 1d8" | Rank 6 deals 7d8 | `scaledSave` (heightening on the area) | ✅ | Cast at **rank 6**: the cloud's turn-start damage reads **7d8** (rank 5: 6d8) |

### VS-43 · Lightning Storm

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-43a | "call down one lightning bolt within the spell's area" | At the cast, the storm's 20-ft burst is placed and one bolt is aimed inside it | `content/vanilla/lightning-storm.json` (a placed storm, `sustain.bolt`); `Lingering.bolt` runs once at the cast | ✅ | Aries cast it at rank 5 with the storm over Capricorn and Leo (ZZ Victim outside). Right after the placement, "Lightning Storm: a bolt" offered **Capricorn, Leo, On no one** — not ZZ Victim. The storm stayed as a Region, with *Sustain Drive: Lightning Storm* on Aries |
| VS-43b | "The bolt is a vertical line from the top of the storm cloud to the ground below, dealing 4d12 electricity damage to creatures in the line (basic Reflex save)" | The creatures in the bolt's square roll a basic Reflex save against 4d12 electricity | `Lingering.strike` (the GM rolls it, through the relay) | ✅ | Bolt on Leo: "Lightning Storm — a lightning bolt" **4d12 electricity = 38**; Leo's Reflex vs DC 34 failed → **38** (200 → 162). Nobody else was touched. A vertical line on a flat map is one square, so the bolt is aimed by the creature it falls on |
| VS-43c | "the first time you Sustain the Spell each round, you can call another lightning bolt within the area" | The first Sustain in a round aims another bolt inside the storm; a bolt outside it is refused | `sustain.bolt`; `Sustain.onRegion` → `bolt` | ✅ | Round 2, Sustain: the bolt dialog offered every creature inside **either** cloud (Capricorn, Leo, ZZ Victim); on ZZ Victim, **4d12 = 29**, a failure (400 → 371). "Lightning Storm is Sustained — now a bolt falls on ZZ Victim" |
| VS-43d | "you can still call down only one bolt per turn" | A second Sustain in the same turn calls no bolt | one *Sustain* per cast (`castId`, granted for the first cloud only); `canSustain` | ✅ | Two clouds, **one** Sustain action. Sustaining again in round 2: "Lightning Storm has already been Sustained this round.", no dialog, no bolt. Round 3 left unsustained: at the end of Aries' turn "Aries did not Sustain Lightning Storm; it ends." — **both** clouds and the action gone (the spell's duration is "sustained", `sustain.lapses`) |
| VS-43e | "you can create two non-overlapping clouds instead of one" | The caster may place two storms that don't overlap (outdoors is the table's call); either takes the bolt | `areaTargetingShapes` (one cloud, or `areas: 2`); `areaTargeting.apart: 40`, `tooClose` test | ✅ | The cast asked **One storm cloud / Two storm clouds (outdoors)** — whether it is outdoors is the table's call. Two clouds placed 20 ft apart: "Those areas are too close together: their centres must be at least 40 feet apart. Aim them again." and back to aiming; placed 40 ft apart they stood, with one `castId`. Found on the way: a shape's `areas` never reached the placement, and neither did a count from `registerAreaCount` — `configFor` ignored the override — so both now do |
| VS-43f | "The damage of each bolt increases by 1d12" | Rank 7 deals 5d12 | `scaledDamage` with `perStepInterval: 2` | ✅ | Cast at **rank 7**: the bolt reads **5d12** (rank 5: 4d12) |

### VS-44 · Falling Stars

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-44a | "Choose for the falling stars to be airbursts (sonic), asteroids (fire), comets (cold), or plasma (electricity)" | The cast asks for one of four kinds; the energy damage takes its type | `content/vanilla/falling-stars.json` (`areaTargetingShapes`: four choices, each loading pf2e's own variant by `overlay`); `typeFromSpell` | ✅ | Aries cast it at rank 9: the cast asked **Asteroids (fire) / Airbursts (sonic) / Comets (cold) / Plasma (electricity)**. Comets → the energy roll was **14d6 cold**; Asteroids (rank 10) → **fire**. The energy's type is read off the chosen variant's own damage |
| VS-44b | "The spell gains the trait of the falling star type you chose" | The chosen trait is on the cast | pf2e's overlays, loaded through the shape's `overlay` | ✅ | The Comets card: "Falling Stars (Comets)", with `origin:item:trait:cold` among its roll options; the Asteroids cast was "Falling Stars (Asteroids)" |
| VS-44c | "The four stars' central 10-foot bursts can't overlap" | Four 40-ft bursts are placed; a centre within 20 ft of another's is refused | `areaTargeting.apart: 20`; `tooClose` test | ✅ | Four 40-ft bursts placed in turn. Two centres 5 ft apart: "Those areas are too close together: their centres must be at least 20 feet apart. Aim them again." and back to aiming. Centres 45 ft and more apart stood |
| VS-44d | "Each falling star deals 6d10 bludgeoning damage to each creature in the 10-foot burst at the center of its area of effect" | Creatures within 10 ft of a star's centre take the bludgeoning | `areaTargeting.zones` (`centre`, within 10 ft), stamped on the card by `scripts/targeting/zones.mjs`; `withinOfAny` test | ✅ | Stars at (4100, 1500), (5400, 1500) and two far off. The card named the **centre** zone: Capricorn (beside the first centre) and ZZ Victim (beside the second) — not Leo, between the two. Capricorn and ZZ Victim took the **6d10 bludgeoning = 46**; Leo didn't |
| VS-44e | "dealing 14d6 energy damage of the type you chose to each creature in its 40-foot burst" | Every creature in a star's 40-ft burst takes the energy | `area-damage` parts | ✅ | Every creature in a burst — Capricorn, Leo, ZZ Victim — took the **14d6 cold = 45**. Aries, 55 ft from the nearest centre, outside every burst, wasn't targeted |
| VS-44f | "attempts one basic Reflex save against the spell no matter how many overlapping explosions it's caught in" | One save per creature, whatever the overlaps | `area-damage` (one save per creature) | ✅ | One Reflex save each, against DC 34: Capricorn failed → 46 + 45 = **91**; Leo succeeded → **22** (half of 45); ZZ Victim critically failed → **182** (double of 91). Each part was rolled **once** for the whole cast ("rolled once for everyone it reaches") |
| VS-44g | "can take each type of damage only once" | A creature caught by two stars takes the bludgeoning once and the energy once | `area-damage` (each part once; `typedTotals`) | ✅ | Leo stood inside **both** stars' 40-ft bursts and took the cold once — 22, not 44; Capricorn's 91 was one roll of two instances (bludgeoning and cold), so each type met its resistances once |
| VS-44h | "The bludgeoning damage increases by 1d10, and the energy damage increases by 2d6" | Rank 10: 7d10 and 16d6 | `perStep` on each part, grown by the cast's steps | ✅ | Cast at **rank 10**: "7d10 bludgeoning" and "16d6 fire" |

### VS-45 · Gravity Well

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-45a | "All creatures and unsecured objects in the area move towards the center, depending on their Reflex saving throws" | Each creature in the 30-ft burst saves and moves toward the burst's centre | `content/vanilla/gravity-well.json` (`areaTargeting.markCentre`; a `pull` rider); `scripts/riders/pull.mjs` | ⚠️ | Aries placed the 30-ft burst at (4100, 1500): Capricorn, Leo and ZZ Victim inside were targeted, the centre was stamped on the card, and each rolled one Reflex save against DC 34 and was moved toward the centre by its result. **Gap:** unsecured objects (loot tokens and the like) are not moved — they have no save to read a distance from, and the spell doesn't say what they roll |
| VS-45b | "This follows the rules for forced movement" | The move stops at walls and occupied spaces, and triggers no reactions | `pullSteps` test; `blockedByWall`, `overlapsAny` | ✅ | The moves are written straight onto the tokens — forced movement, so no movement is spent and no reaction is offered. ZZ Victim's 30-ft pull **stopped beside Capricorn**, who had taken the square at the centre, rather than overlapping him. A wall between a creature and the centre keeps it out of the area in the first place (line of effect, which counts movement-blocking walls): with a wall across ZZ Victim's path it was **not targeted at all**, so nothing is ever pulled through a wall |
| VS-45c | "creatures and objects nearer to the center move first" | Moves resolve from the centre outward, so the nearer creature takes the space | `resolvePull` (all saves first, then the moves sorted by distance) | ✅ | Every save was rolled before anyone moved; Capricorn and Leo (15 ft from the centre) moved before ZZ Victim (20 ft), so Capricorn reached the square at the centre first and ZZ Victim, a critical failure, stopped short of it: "ZZ Victim is pulled 15 ft toward the centre (of 30)" |
| VS-45d | "Critical Success The creature is unaffected" | No move | `pullFeet` test (`feet.criticalSuccess: 0`) | ✅ | Leo, with a temporary +30 to Reflex, rolled a **critical success** (by +38): not moved — 3700 → 3700, and no line for him in the pull report |
| VS-45e | "Success The creature moves 5 feet toward the center" | 5 ft | `pullFeet` | ✅ | Leo, success: 3700 → **3800** (5 ft), "pulled 5 ft toward the centre (of 5)"; in the second cast Capricorn, success: 4400 → 4300 |
| VS-45f | "Failure The creature moves 15 feet toward the center" | 15 ft | `pullFeet` | ✅ | Capricorn, failure: 4400 → **4100** (15 ft), onto the square at the centre |
| VS-45g | "Critical Failure The creature moves 30 feet toward the center" | 30 ft, stopping at the centre | `pullFeet`; `pullSteps` never passes the centre | ✅ | ZZ Victim, critical failure (Reflex +0): pulled from (4100, 1900) up to (4100, 1600) — 15 of its 30 ft, the rest blocked by Capricorn at the centre |

### VS-46 · Repulsion

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-46a | "you can make the area any radius you choose, up to 40 feet" | The cast asks for a radius from 5 to 40 ft; the emanation follows the caster | `content/vanilla/repulsion.json` (`areaTargetingShapes`: emanations of 5 to 40 ft; a lingering area with `followsCaster` and `repels`) | ✅ | Aries cast it at rank 6: the cast offered **5-foot … 40-foot emanation**, eight choices; 20 ft made a 20-ft emanation Region on Aries (radius 400 px). Walking Aries 5 ft east moved the aura's base with him (3500 → 3600) |
| VS-46b | "A creature must attempt a Will save if it's within the area when you Cast the Spell or as soon as it enters the area while the spell is in effect" | Creatures inside at the cast save; one that enters later saves on entering | `Repels.save` (at the creation for everyone inside; on `tokenEnter` after) | ✅ | At the cast, ZZ Victim and Capricorn — inside — rolled Will against DC 34 (critical failure, failure) and the results were kept on the aura; Leo, outside, rolled nothing. Leo then walked in: **one** Will save on entering (failure) |
| VS-46c | "Once a creature has attempted the save, it uses the same result for that casting of repulsion" | Leaving and coming back asks no new save | `repelled` (kept per creature, per casting) | ✅ | Leo walked out and back in: **no** second save (Leo's saves during the drive: 1) |
| VS-46d | "Any restrictions on a creature's movement apply only if it voluntarily moves toward you" | Moving sideways or away is never stopped | `movesCloser`, `barsApproach` tests; `preMoveToken` passes `forcedMovement` | ✅ | ZZ Victim (critical failure) 15 ft from Aries: a step away (3800 → 3900) and a step sideways (1500 → 1600, ending farther off) were allowed; only steps ending nearer Aries inside the aura were refused. A move closer marked `forcedMovement` — as the module's own pushes, pulls and teleports are — went through (3900 → 3700) |
| VS-46e | "if you move closer to a creature, it doesn't then need to move away" | The caster walking up to a creature moves nobody | nothing moves anyone but the mover; `followsCaster` | ✅ | Aries walked 5 ft toward ZZ Victim, who had failed: ZZ Victim stayed at (3700, 1600); only the aura moved, with Aries |
| VS-46f | "Success The creature treats each square in the area as difficult terrain when moving closer to you" | A step toward the caster inside the aura costs double | `Repels.register` — a stage on the movement cost (`scripts/lib/movement-cost.mjs`, one wrap on `Token#_getMovementCostFunction`) | ✅ | The Ghoul (temporarily Will +29) succeeded. Its moves inside the aura, priced by Foundry's own path measure: one square **closer** costs **10** ft and two cost **20**; one square **away** costs **5**, one **sideways** 5. Found on the way: a Region's terrain behavior is priced by where a step lands, never by which way it goes — so the price is set per step, where the direction is known |
| VS-46g | "Failure The creature can't move closer to you within the area" | A move that would end nearer the caster inside the aura is stopped | `preMoveToken` (on the mover's own client) | ✅ | ZZ Victim, then Leo (both failures), trying to step closer to Aries inside the aura: the move was refused — "ZZ Victim can't move closer to Aries within Repulsion.", "Leo can't move closer to Aries within Repulsion." — and the token stayed put |
| VS-46h | "Critical Success The creature's movement is not restricted" | Nothing | `barsApproach` (a critical success bars nothing); the cost stage only touches a success | ✅ | The Ghoul (temporarily Will +40) critically succeeded: a step closer cost **5** and the move went through (3100 → 3200) |

## Batch 2 — Walls and grasping ground

### VS-47 · Wall of Stone

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-47a | "You create a 1-inch-thick wall of stone up to 120 feet long, and 20 feet high" | A wall up to 120 ft long is drawn, blocking movement and sight | `content/vanilla/wall-of-stone.json` (`lingering.barrier`, kind `border`); `scripts/targeting/barrier.mjs` | ✅ | Cast at rank 5, the spell offered its runs (120, 60 or 30 ft straight; 2×60, 3×40, 4×30 with bends). A 60-ft run aimed east from (4000, 1210) built **six** wall segments along y = 1200, 4000 → 5200, each blocking movement and sight (Foundry's collision tests, through the wall: blocked). The run was handed to the builder directly — the canvas kept re-panning under the cursor, so the click itself was not reliable to script; the placement it stands in for is the same line placement Wall of Fire (VS-06) drove |
| VS-47b | "You can shape the wall's path, placing each 5 feet of the wall on the border between squares" | The path may bend; every segment lies on a grid line | `snappedRun`, `borderSections` tests | ✅ | A run started at (4000, 1210) pointing 3° was laid from the grid point (4000, 1200) straight along the grid line — every segment on a border between squares. Bends are runs placed one after another (the 2-, 3- and 4-run choices), each snapped the same way |
| VS-47c | "The wall doesn't need to stand vertically, so you can use it to form a bridge or set of stairs" | — | | — | Nothing to automate: a flat map has no bridge or stairs; the table's call |
| VS-47d | "You must conjure the wall in an unbroken open space so its edges don't pass through any creatures or objects, or the spell is lost" | A path across an occupied square is refused and the spell is lost | `crossesInterior` test; the build checks every segment against every creature | ✅ | With Leo made Large and standing across y = 1200, the same run built nothing: "Drive: Wall of Stone is lost: its wall would pass through Leo." — no walls, no sections. A creature merely beside the line (Capricorn, below it) did not stop it |
| VS-47e | "Each 10-foot-by-10-foot section of the wall has AC 10, Hardness 14, and 50 Hit Points" | Each 10-ft section can be attacked and damaged on its own | one hazard actor per cast; one unlinked hazard token per 10-ft section (`sectionHp`) | ✅ | Six section tokens, each its own Hit Points: **AC 10, Hardness 14, 50 HP**. 40 bludgeoning on the second section took **26** (Hardness off), the others untouched |
| VS-47f | "it's immune to critical hits and precision damage" | A critical hit on a section counts as a hit; precision damage does nothing | the hazard's immunities: `critical-hits`, `precision` (pf2e's own IWR) | ✅ | A critical Strike from Leo (2 × (1d4 + 1) = 6) on a section, its Hardness set to 0 for the test: **3** taken — pf2e undid the doubling. 30 + 10 precision slashing: **16** taken (30 − 14), the precision ignored |
| VS-47g | "A destroyed section of the wall can be moved through, but the rubble created from it is difficult terrain" | A section at 0 HP opens, and its squares become difficult terrain | a DamageBus stage at 0 HP (`Barrier.breach`), rubble as a difficult-terrain Region | ✅ | The second blow took the section to 0: "Drive: Wall of Stone (section) is destroyed; its rubble is difficult terrain." Its wall segment and token gone, the gap no longer blocks movement, and a **Rubble** Region (the four squares either side of it) costs **10** ft to step into |
| VS-47h | "The Hit Points of each section of the wall increase by 15" | Rank 7: 65 HP | `sectionHp` (+15 every two ranks) | ✅ | Built at **rank 7**: a section's Hit Points **65** |

### VS-48 · Wall of Thorns

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-48a | "You create a 5-foot-thick wall of brambles and thorns in a straight line up to 60 feet long and 10 feet high" | A straight line of squares up to 60 ft | `content/vanilla/wall-of-thorns.json` (`lingering.barrier`, kind `squares`; a line of 60, 30 or 10 ft) | ✅ | A 60-ft line east from (4000, 1200) — handed to the builder, as for VS-47 — became **twelve squares** in a straight row, six 10-ft sections of two squares each, every section its own Region of the spell's ground and a hazard token |
| VS-48b | "You must create the wall in an unbroken open space so its edges don't pass through any creatures or objects, or the spell is lost" | A line across an occupied square is refused | the build checks every square against every creature | ✅ | With Capricorn standing on the row: "Drive: Wall of Thorns is lost: its wall would pass through Capricorn." — nothing built. Moved off it, the wall stood |
| VS-48c | "Everything on each side of the wall has cover from creatures on the opposite side" | An attack across the wall counts cover | a check-pipeline stage, `cover from a wall of squares` (`crossesAny` test) | ✅ | Leo struck Capricorn across the wall: the attack was against **DC 36** — Capricorn's AC 34 with standard cover's +2. The same Strike with Capricorn beside Leo, nothing between: **DC 34** |
| VS-48d | "the wall's spaces are difficult terrain" | Its squares cost double | `difficultTerrain: 2` on each section's Region | ✅ | Capricorn stepping from below the wall into it: Foundry's path cost **10** ft for the one square |
| VS-48e | "For every move action a creature uses to enter at least one of the wall's spaces, that creature takes 3d4 piercing damage" | 3d4 piercing, no save, once per move action however many of its squares are entered | `events: [tokenMoveIn]`, `damage` 3d4 piercing (no save); `firstForMovement` keyed on the wall, not the section | ✅ | One move action into the wall and along it through **two** sections: **one** "Wall of Thorns — Capricorn" 3d4 piercing = 8. Out, then a second move action back in: 3d4 = 10 again |
| VS-48f | "Each 10-foot-by-10-foot section of the wall has AC 10, Hardness 10, and 20 Hit Points" | Each section can be damaged on its own | `sectionHp`; the hazard's AC, Hardness, immunities | ✅ | Each section: **AC 10, Hardness 10, 20 HP**, immune to critical hits and precision (the same hazard as VS-47, whose immunities were driven there) |
| VS-48g | "A destroyed section can be moved through freely" | A destroyed section stops hurting and is no longer difficult terrain | `Barrier.breach` (no rubble for a wall of squares) | ✅ | 30 slashing on a section (20 after Hardness) destroyed it: its token and its Region gone, no rubble. Stepping into its squares then cost **5** ft and dealt no damage. Found on the way: a section's Region and the wall's own expiry could be deleted twice on the same tick, and one failed delete left the rest of the wall standing — each removal is now its own, and quietly past one already gone |
| VS-48h | "The Hit Points of each section of the wall increase by 5, and the piercing damage increases by 1d4" | Rank 4: 25 HP, 4d4 | `hpPerStep: 5`; the damage's `perStep: 1d4` | ✅ | Built at **rank 4**: a section's Hit Points **25**, its damage **4d4**. The 1-minute duration: a fresh 30-ft wall still stood after 30 seconds and was entirely gone — sections, Regions and hazard — after the minute |

### VS-49 · Hypnotize

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-49a | "Creatures are Dazzled while inside the cloud" | Dazzled on entering the 10-ft burst, gone on leaving it | `content/vanilla/hypnotize.json` (`lingering.inside`: dazzled) | ✅ | Aries cast it (rank 3) on a 10-ft burst at (4100, 1500) — placed through Foundry's own placement, the shape put at that point and confirmed. Capricorn and ZZ Victim inside were **dazzled**; Leo outside wasn't. Leo walked in: dazzled. Capricorn walked out: no longer dazzled |
| VS-49b | "a creature must attempt a Will saving throw if it is inside the cloud when you cast it, when it enters the cloud, when it ends its turn within the cloud" | A Will save at the cast, on entering, and at the end of each turn inside | the cast's save (pf2e's card, `riders`); lingering `save` on `tokenMoveIn` and `tokenTurnEnd` | ✅ | At the cast, the card's Will save for the two inside (critical failure, failure). Leo entering: a Will save on the way in (success). At the end of Leo's turn inside: another (success) |
| VS-49c | "or if it uses a Seek or Interact action on the cloud" | Seeking the cloud asks the save too | — | ⚠️ | **Gap:** a Seek or Interact *aimed at the cloud* asks no save — pf2e's Seek and Interact name no area as their object, so there is nothing to recognise one by. Left to the table |
| VS-49d | "A creature currently Fascinated by hypnotize doesn't attempt new saves" | No save while it is fascinated by this cloud | `targetPredicate`: not `target:condition:fascinated` | ✅ | Capricorn and ZZ Victim, fascinated, ended their turns inside the cloud: **no** save for either; Leo, not fascinated, saved at the end of his |
| VS-49e | "Success The target is unaffected" | Nothing | no rider on success | ✅ | Leo's successes left him only the dazzled the cloud gives anyone inside |
| VS-49f | "Failure The target is fascinated by the cloud" | Fascinated | an effect granting pf2e's *Fascinated*, `withArea` | ✅ | Capricorn, failure: "fascinated by the cloud" — fascinated, and still fascinated after walking out of the cloud. When the spell ended, the fascination went with it, inside or out |
| VS-49g | "While it remains fascinated, it can't use reactions" | A critical failure also takes reactions away while fascinated | the critical failure's effect: "fascinated by the cloud: no reactions" | ⚠️ | ZZ Victim, critical failure: fascinated, with the effect naming the lost reactions, both ending with the cloud. **Gap:** pf2e has no way to refuse a reaction, so the "can't use reactions" is a label on the sheet, not enforced |

### VS-50 · Slither

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-50a | "it's Grabbed or Restrained depending on its Reflex save" | Each creature in the 20-ft burst at the cast saves | `content/vanilla/slither.json` (riders by the save's outcome) | ✅ | Aries cast it (rank 5) on a 20-ft burst at (4100, 1500), placed through Foundry's placement: Capricorn and ZZ Victim inside were targeted, Leo outside wasn't. Each rolled the card's Reflex save against DC 34 (ZZ Victim critical failure, Capricorn failure) |
| VS-50b | "A creature that ends its turn in the area must also attempt this save, even if it's already grabbed or restrained by the snakes" | A save at the end of every turn inside, grabbed or not | lingering `save` on `tokenTurnEnd`; `onePerTarget` | ✅ | At the end of their turns inside: Capricorn (freed by then) failure → held again; ZZ Victim, already restrained, critical failure → damaged again, still **one** snake on him |
| VS-50c | "Failure The creature takes full damage and is grabbed by a snake" | Piercing and persistent poison damage, and grabbed | failure riders: 3d6 piercing, 1d6 persistent poison, a snake that grabs | ✅ | Capricorn: 13 piercing (200 → 187), persistent poison **1d6**, **grabbed**, an Escape action, and a *shadow snake* hazard holding him |
| VS-50d | "As failure, but the creature takes double damage and is restrained by a snake" | Double damage, restrained | critical failure riders: damage ×2, 2d6 persistent, a snake that restrains | ✅ | ZZ Victim: 20 piercing, persistent poison **2d6**, **restrained**, and its own snake |
| VS-50e | "The snakes' Escape DC is equal to your spell DC" | An Escape against the caster's spell DC frees it | `encasement` with `escapeDc: "spell"` | ✅ | ZZ Victim's *Escape shadow snake*: Athletics against **DC 34** — the spell DC — critical failure, "does not break free", still restrained |
| VS-50f | "A creature can attack a snake to release the creature" | A snake can be struck (AC = spell DC); 12 damage at once destroys it and frees its creature | `encasement` with `ac: "spell"`, `hp: 12`, `atOnce` | ✅ | Each snake: **AC 34** (the spell DC), 12 HP. 11 slashing on Capricorn's snake: back to **12** — no harm done. 12 at once: destroyed, and Capricorn released (no grabbed, no Escape left) |
| VS-50g | "Success The creature is unaffected" | Nothing | no rider on success | ✅ | The success and critical-success branches carry nothing; Leo, outside the area, was never asked. (Both creatures inside failed or worse on every roll of the drive.) |
| VS-50h | "You can Dismiss the spell" | Dismissing it frees everyone | `dismiss: true`; the snakes `withArea` | ✅ | *Dismiss Drive: Slither*: "Aries dismisses Slither.", then "ZZ Victim breaks free of shadow snake.", "Capricorn breaks free of shadow snake." — the snakes, their holds and their Escape actions gone |
| VS-50i | "The persistent poison damage increases by 1d6 and snake HP increases by 6" | Rank 7: 2d6 persistent, 18 to destroy a snake | `perStep` with `perStepInterval: 2`; `hpPerStep: 6`, `hpPerStepInterval: 2` | ✅ | Cast at **rank 7**: ZZ Victim's critical failure brought **4d6** persistent poison (2 × 2d6) and a snake of **18** HP |

### VS-51 · Tangling Creepers

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-51a | "takes a –10-foot circumstance penalty to its Speeds while in the area" | A creature in the 40-ft burst has –10 ft Speeds, gone on leaving | `content/vanilla/tangling-creepers.json` (`lingering.inside`: a –10 ft circumstance penalty to land, climb and swim Speeds) | ✅ | Aries cast it (rank 6) on a 40-ft burst at (4100, 1500), 10 minutes. Capricorn inside: land Speed **15**; walked out: **25**; back in: 15 again. The penalty is to land, climb and swim — not fly |
| VS-51b | "Once per round, you can Sustain the spell to make a vine lash out from any square within the expanse of creepers" | Sustaining (once a round) offers the vine's attack | `sustain.vine`; `canSustain` | ✅ | Round 2, Sustain: "Tangling Creepers: a vine" offered the creatures within its reach. A second Sustain that round: "Tangling Creepers has already been Sustained this round." — no vine |
| VS-51c | "This vine has a 15-foot reach" | A target within 15 ft of the area | `reachOf` test (edge to edge, 15 ft) | ✅ | Offered: Capricorn and D5 (inside), ZZ Victim (5 ft outside the edge). Leo, 40 ft out, was not |
| VS-51d | "Make a melee spell attack roll against the target" | The caster's melee spell attack against AC | the spell's own spellcasting statistic, against the target's AC | ✅ | "the vine's spell attack" against ZZ Victim: **DC 10** (his AC), success; against Capricorn: **DC 34** (his AC), success |
| VS-51e | "on a success, the vine pulls the target into the creepers" | A target outside the area is moved into it | a hit outside the area pulls the target square by square toward its middle until inside (`forcedMovement`) | ✅ | ZZ Victim, outside at (5000, 1500): pulled to (4800, 1500), **inside** the creepers. Capricorn, already inside, stayed where he was |
| VS-51f | "makes it Immobilized for 1 round or until the creature Escapes (against your spell DC), whichever comes first" | Immobilized for a round, with an Escape | `vine.riders`: immobilized, 1 round, `escapeDc: "spell"` | ✅ | ZZ Victim: *Immobilized* for **1 round** and *Escape Drive: Tangling Creepers* — Athletics against **DC 34** (the spell DC), critical failure. One round on, at the end of Aries' next turn, the immobilized ended by itself |

### VS-52 · Weapon Storm

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-52a | "You swing a weapon you're holding" | No held weapon, no cast | `content/vanilla/weapon-storm.json` (`requires: "held-weapon"`); a cast stage, `what a spell needs` (`scripts/vanilla/requires.mjs`) | ✅ | Aries with nothing in hand: "Drive: Weapon Storm needs a weapon in hand." — nothing posted, nothing aimed. With a longsword in hand, the cast went ahead. Holding a bastard sword and a club, the cast asked **which weapon** (both offered); the club gave 4d6 bludgeoning |
| VS-52b | "Area 30-foot cone or 10-foot emanation" | The cast asks cone or emanation | `areaTargetingShapes`: pf2e's own *Cone* and *Emanation* variants; `anchor: "caster"` | ✅ | The cast offered **A 30-foot cone / A 10-foot emanation**. The cone opened from Aries' edge toward the aim and caught ZZ Victim and Capricorn; the emanation went on no cursor and caught Capricorn, 10 ft away. Found on the way: one `anchor` for both shapes put the emanation on the cursor — "from the caster" is now an emanation's own self-anchoring |
| VS-52c | "This flurry deals four dice of damage to creatures in the area" | Four dice | `area-damage` with `weaponDice: 4`, rolled once for the cast | ✅ | Longsword: **4d8** = 21, one roll for everyone it reached |
| VS-52d | "This damage has the same type as the weapon and uses the same die size" | A longsword's d8 slashing gives 4d8 slashing | `dieAsHeld` (the weapon's die and damage type) | ✅ | Longsword (d8 slashing) → **4d8 slashing**; club (d6 bludgeoning) → **4d6 bludgeoning** |
| VS-52e | "if you were wielding a two-hand weapon in both hands, you'd use its two-hand damage die" | A bastard sword held in two hands gives 4d12 | `dieAsHeld` test (two-hand die only in both hands) | ✅ | Bastard sword held in **two** hands, rank 5: **5d12 slashing** — its two-hand d12, not its d8 |
| VS-52f | "Critical Failure The target takes double damage and is subject to the weapon's critical specialization effect" | Double damage and the weapon group's critical specialization | `critSpecialization` (`CRITICAL_SPECIALIZATIONS` in `scripts/riders/weapon.mjs`, pf2e's text for the rest) | ⚠️ | Critical failures: with the **longsword**, ZZ Victim took 42 (double) and was **off-guard until the start of Aries' next turn** (sword); with the **club**, 20 and **pushed 10 feet** away (club); with a **battle axe**, 36 and pf2e's own text for the axe's specialization posted. **Gap:** groups whose effect needs a choice the table makes — axe (a second creature), bow (a surface), pick, bomb, grenade, sniper — and the persistent-damage groups are said, not applied; the effects of sword, spear, cryo, hammer, flail, brawling, firearm, sling, shock, laser, mental, poison, projectile, sonic, club, shield and polearm are applied |
| VS-52g | "Add another damage die" | Rank 5: five dice | `perStepDice: 1` | ✅ | Rank **5**: five dice (5d12 with the bastard sword in both hands) |

## Batch 3 — Attacks

### VS-53 · Spiritual Armament

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-53a | "Attempt a spell attack roll against the target's AC, dealing 2d8 damage on a hit (or double damage on a critical hit)" | A spell attack; 2d8 on a hit, 4d8 on a critical hit | pf2e's own spell card (attack, then damage) | ✅ | Aries (a longsword in hand) cast it at Capricorn: the card offered pf2e's spell attack against his AC and **2d8 piercing** damage; a critical hit doubles it on pf2e's damage button, as for any attack spell |
| VS-53b | "The damage type is the same as the chosen weapon (or any of its types for a versatile weapon)" | The cast asks for a held weapon; its type (or a versatile one) is the damage's | `content/vanilla/spiritual-armament.json` (`requires: "held-weapon"`, `variantFromWeapon`); a cast stage, `a variant from the weapon in hand`; `weaponDamageTypes` test | ✅ | The cast offered **Slashing, Piercing, Spirit** — the longsword's own type and the piercing its versatile trait adds. Piercing cast pf2e's *Spiritual Armament (Piercing)*: damage 2d8 **piercing**; at rank 4, Slashing: 3d8 **slashing** |
| VS-53c | "The attack deals spirit damage instead if that would be more detrimental to the creature (as determined by the GM)" | The GM may switch to spirit | *Spirit* among the choices, the GM's call | ✅ | **Spirit** is always offered, with the note that it is the GM's call; choosing it casts pf2e's *Spiritual Armament (Spirit)* |
| VS-53d | "This attack uses and contributes to your multiple attack penalty" | The attack takes and raises the caster's MAP | pf2e's card: the attack at each step of the multiple attack penalty | ⚠️ | The card's attack is offered at MAP 0, –5 and –10 (pf2e's three buttons); the roll records `map:increases:0`. **Gap:** pf2e keeps no count of the attacks a creature has made, so "contributes to your multiple attack penalty" is the player's to track — nothing here or in pf2e advances it |
| VS-53e | "Each time you Sustain the spell, you can repeat the attack against any creature within 120 feet" | Sustain offers a new attack against any creature within 120 ft | `sustained: { repeat: true }` — the Sustain casts the spell again at its rank and variant | ✅ | Round 2, *Sustain Drive: Spiritual Armament*: "Sustained — the attack again." and a fresh *Spiritual Armament (Piercing)* card at rank 2 to attack any creature from. Round 3 left unsustained: "Aries did not Sustain Drive: Spiritual Armament; it ends." — the marker and the action gone |
| VS-53f | "If you sanctify the spell, the attacks are sanctified as well" | — | | — | Nothing to automate: sanctification is the caster's own trait choice, carried by pf2e |
| VS-53g | "The damage increases by 1d8" | Rank 4: 3d8 | pf2e's own heightening (+1d8 every 2 ranks) | ✅ | Cast at **rank 4**: **3d8** |

### VS-54 · Telekinetic Maneuver

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-54a | "You can attempt to Disarm, Shove, Reposition, or Trip the target" | The cast asks which of the four | `content/vanilla/telekinetic-maneuver.json`: a `choice` of four options | ✅ | Casting at ZZ Victim, then at Capricorn, posted "Which maneuver, with your spell attack?" with **Disarm, Shove, Reposition, Trip**; the buttons are spent once one is pressed |
| VS-54b | "using a spell attack roll instead of an Athletics check" | The roll is the caster's spell attack against the maneuver's DC (Reflex for Disarm and Trip, Fortitude for Shove and Reposition) | `contest` apply type (`statistic: "spell-attack"`, `against`) | ✅ | Every roll was Aries' spell attack, **Expert +24**, the spellcasting entry's. Capricorn given +5 Reflex: Disarm and Trip rolled against **DC 39** (Reflex), Shove and Reposition against **DC 34** (Fortitude). Aries prone rolled 32, the –2 included |
| VS-54c | "you move a foe or something they carry" | The maneuver's outcome happens: Shove pushes, Trip knocks prone, Disarm penalises or drops, Reposition moves | nested riders by the caster's result; `disarm` apply type; `teleport` (`stopsAtWalls`, `direction: "choose"`); `toOrigin` | ✅ | **Disarm**: crit success, ZZ Victim "drops Longsword" (carried: dropped); success, pf2e's *Effect: Disarm (Success)* on Capricorn's longsword, its Strike –2, with no prompt; crit fail, Aries **off-guard** until the start of its turn. **Shove**: success 5 ft away (4000→4100), crit success 10 ft (→4300), crit fail Aries **prone**. **Reposition**: success asked "Which way does Capricorn go?" (eight directions, away, toward) and South moved it 5 ft; crit fail asked "Move Aries up to 5 feet" and moved Aries. **Trip**: success, Capricorn prone; crit success, prone and **6 bludgeoning** (1d6); crit fail, Aries prone |

### VS-55 · Blazing Bolt

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-55a | "Make a spell attack roll against a single creature" | One spell attack per ray | `rays` apply type (`self: true`, every target): `spell.rollAttack` with `target` | ✅ | One pf2e *Arcane Spell Attack* per creature, each against that creature's own AC: ZZ Victim (AC 10), Ghoul Soldier (AC 17), Capricorn (AC 34) |
| VS-55b | "On a hit, the target takes 2d6 fire damage, and on a critical hit, the target takes double damage" | One action: 2d6, doubled on a critical hit | `rays`: the cast variant's own damage roll, applied ×2 on a critical hit | ✅ | One action, rank 2: a critical hit on ZZ Victim rolled **2d6 fire** = 4 and ZZ Victim took **8**. A miss (Capricorn, 26 against AC 34) rolled no damage |
| VS-55c | "For each additional action you use when Casting the Spell, you can fire an additional ray at a different target" | Two actions, two rays; three, three; each at a different creature | cast stage `the actions spent` (`actionVariants`, `targetsPerAction`); `actionChoices` test | ✅ | Two creatures targeted: the cast offered **2 actions / 3 actions** only, and two actions fired two rays (Capricorn, Ghoul Soldier). Three targeted: **3 actions** only, three rays. One targeted: 1, 2 or 3 |
| VS-55d | "to a maximum of three rays targeting three different targets for 3 actions" | Never more than three, never the same creature twice | `actionChoices` (more targets than three → none); pf2e's targets are one per creature | ✅ | Four creatures targeted: "Drive: Blazing Bolt reaches at most 3 creatures; 4 are targeted." — nothing cast. A ray per creature in Foundry's target set, which holds each creature once |
| VS-55e | "These attacks each increase your multiple attack penalty" | After the rays, the MAP has gone up once per ray | `rays`: the count, said | ⚠️ | After the rays: "Aries's multiple attack penalty now counts 3 more attacks." (2 for two rays). **Gap:** pf2e keeps no count of the attacks a creature has made, so the next attack's penalty is the player's to pick — as for VS-53d |
| VS-55f | "you don't increase your multiple attack penalty until after you make all the spell attack rolls for blazing bolt" | Every ray of one cast rolls at the same penalty | `sameAttackPenalty`: one penalty chosen at the cast, every ray at it | ✅ | "Every attack at:" the second attack's penalty → the first ray rolled **+19** (24 – 5); the third → both rays **+14** (Capricorn and Ghoul Soldier); none → all three at +24 |
| VS-55g | "If you spend 2 or more actions Casting the Spell, the damage increases to 4d6 fire damage on a hit" | Two or three actions: 4d6 per ray | `actionVariants`: pf2e's *2 or 3* variant for both | ✅ | Two actions, rank 2: **4d6 fire** per ray (Ghoul Soldier, a critical hit: 11, took 22); three actions: 4d6 on each of the three |
| VS-55h | "The damage to each target increases by 1d6 for the 1-action version, or by 2d6 for the 2-action and 3-action versions" | Rank 3: 3d6 or 6d6 | pf2e's own heightening of each variant | ✅ | Rank 3, one action: **3d6**; rank 3, two actions: **6d6** (20, a critical hit, 40 taken) |

### VS-56 · Live Wire

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-56a | "The wire deals 1d4 slashing damage and 1d4 electricity damage, depending on your spell attack roll against the target's AC" | A spell attack decides the damage | `content/vanilla/live-wire.json`: `rays` (one target), the spell attack against AC | ✅ | Aries' *Arcane Spell Attack* against Capricorn's **AC 34**; the result chose the damage, as below |
| VS-56b | "Critical Success The target takes double damage" | Both doubled, and persistent electricity | `rays` ×2 on a critical hit; nested `persistent-damage` (`1d4`, `perStep: "1d4"`, `perStepInterval: 2`) on `criticalSuccess` | ✅ | Critical hit (44), rank 10: **5d4 slashing + 5d4 electricity** = 26, Capricorn took **52**, and **5d4 persistent electricity** — pf2e's (ceil(rank / 2))d4 |
| VS-56c | "Success The target takes full damage" | 1d4 slashing and 1d4 electricity | `rays`: the full roll on a hit | ✅ | Hit (39): 5d4 slashing + 5d4 electricity = 24, Capricorn took 24; no persistent damage |
| VS-56d | "Failure The target takes the electricity damage, but not the slashing damage" | A miss still deals 1d4 electricity | `failure: ["electricity"]`; `keptInstances` test | ✅ | Miss (29): **5d4 electricity** alone = 14, Capricorn took 14 |
| VS-56e | "Critical Failure The target is unaffected" | Nothing | `rays`: nothing on a critical miss | ✅ | Critical miss (natural 1, 25): no damage roll, Capricorn still at 200 |
| VS-56f | "The slashing damage, initial electricity damage, and persistent electricity damage on a critical hit each increase by 1d4" | Heightened to rank 3: 2d4 and 2d4 | pf2e's own heightening (+1d4 every 2 ranks); `perStep` every 2 for the persistent damage | ✅ | A level-5 caster (rank 3): **2d4 slashing + 2d4 electricity** = 9, ×2 = 18 on the critical hit, and **2d4** persistent electricity |

### VS-57 · Disintegrate

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-57a | "Make a spell attack against the target" | A spell attack first; a miss does nothing | `content/vanilla/disintegrate.json`: `rays` (one target) — the spell attack first | ✅ | Aries' *Arcane Spell Attack* against Capricorn's AC 34 came first each time; a miss (27) did nothing — no save, no damage, Capricorn at 200 |
| VS-57b | "If you hit a creature, it takes 12d10 damage (no damage type) with a basic Fortitude save" | On a hit, a basic Fortitude save against 12d10 untyped | `rays` `save: { statistic: "fortitude" }`: on a hit, the creature's Fortitude against the spell DC, a basic save's share of pf2e's own roll | ✅ | Hit (36): Capricorn's *Fortitude Saving Throw* against **DC 34**, a success (34) → **12d10** = 71 untyped, Capricorn took **35**. ZZ Victim, a critical failure: 79, took **158** |
| VS-57c | "If you critically hit, the target gets a result one degree of success worse than the outcome of its Fortitude save" | A critical hit lowers the save one step | `worseOnCritical`; `worseDegree` test | ✅ | Critical hit (44), Capricorn's save a success (34): "A critical hit: Capricorn's Success is a Failure." — 65 rolled, **65** taken, full damage |
| VS-57d | "A creature reduced to 0 HP is blasted to fine powder; its gear remains" | 0 HP is death, not dying | nested `death` (`hpFraction: 0`, its text localized) on a hit; the *automateDeath* setting | ✅ | ZZ Victim (an NPC) at 30 HP, critically hit and failing: 158 damage, "ZZ Victim is reduced to 0 Hit Points — it is blasted to fine powder; its gear remains." and marked **dead**, not dying. A player character gets the GM's prompt instead, as the *automateDeath* setting (NPCs) asks |
| VS-57e | "If you hit an object or force construct (such as a wall of force), it's destroyed with no save" | A wall section or a placed object hit is destroyed | `objects: "destroy"` (`destroyObject`: a wall section through `Barrier.breach`, a hazard to 0 HP) | ✅ | A hit on a section of Aries' *Wall of Stone*: no save, "Drive: Wall of Stone (section) is destroyed; its rubble is difficult terrain." — its wall and token gone. A hit on a hazard (a statue, 50 HP): "Drive: Disintegrate destroys Drive: Statue.", its HP to **0** |
| VS-57f | "A single casting can destroy no more than a 10-foot cube of matter" | One 10-ft section at most | one target, one section (`Barrier` sections are 10 feet) | ✅ | The 30-foot wall stood as three 10-foot sections; Disintegrate on the middle one took it alone — the sections at either end stood |
| VS-57g | "The damage increases by 2d10" | Rank 7: 14d10 | pf2e's own heightening (+2d10) | ✅ | Rank 7: **14d10** (79, Capricorn failing, took 79) |

### VS-58 · Blister

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-58a | "Success The target grows one blister" | One blister on the target | `content/vanilla/blister.json`: a `success` rider, an effect with `badge: 1` | ✅ | ZZ Victim (Fortitude +30 for the test) saved with a success (34 against DC 34): *Drive: Blister: Blisters* with a counter of **1** |
| VS-58b | "Failure As success, but the target grows two blisters" | Two | `failure`: `badge: 2` | ✅ | A failure (20 against DC 34): Blisters **×2** |
| VS-58c | "Critical Failure As success, but the target grows four blisters" | Four | `criticalFailure`: `badge: 4` | ✅ | A critical failure (2): Blisters **×4**, at rank 5 and at rank 6 |
| VS-58d | "Critical Success The target is unaffected" | None | no rider on `criticalSuccess` | ✅ | A critical success (44): no effect on ZZ Victim, no action for Aries |
| VS-58e | "You can spend a single action, which has the concentrate trait, to pop a blister" | The caster has a one-action *Pop a Blister* while blisters remain | `originAction` on the effect (`scripts/riders/origin-action.mjs`): a one-action, concentrate *Pop a Blister* on the caster | ✅ | With the blisters came **Pop a Blister** on Aries' sheet — 1 action, *concentrate*: "from ZZ Victim, the creature Drive: Blister marked. Each use spends one." Using it: "Blisters: 1 left." |
| VS-58f | "originating from the target takes 7d6 acid damage (basic Fortitude save)" | The target and everyone in a 15-ft cone from it save against 7d6 acid | the action's `area-damage` (`save: "fortitude"`, basic; the DC and rank set at the grant, `bakeCast` test); `includesOrigin` | ✅ | One pop: **7d6 acid** = 19, rolled once; ZZ Victim saved against **DC 34** (a critical failure, took 38), and so did the four creatures in the cone (two critical successes, a failure for 19, a critical failure) |
| VS-58g | "You choose the direction of the cone, which can't include the target" | The caster aims the cone from the target's edge | `anchor: "caster"` with an origin resolver: the cone starts on the blistered creature's edge, aimed by the caster | ✅ | Aimed south, the cone opened from ZZ Victim's edge and caught the tokens 15 feet south of it; Aries, 35 feet east, was not in it. Aimed north, it caught no one else — ZZ Victim still took its 7d6 |
| VS-58h | "When no blisters are left, the spell ends" | The last pop ends the spell and takes the action away | `spend-charge`: the last charge deletes the effect; the effect's deletion takes the action | ✅ | The second pop of two: "Blisters: the last one — the spell ends." — the effect gone at once, *Pop a Blister* gone from Aries' sheet within 10 seconds (it outlasts the effect so that pop's own damage still resolves) |
| VS-58i | "The damage of a popped blister increases by 1d6" | Rank 6: 8d6 | `perStep: "1d6"`, grown into the granted action at the cast's rank | ✅ | Cast at **rank 6**: the action's damage is **8d6** acid; a pop rolled 8d6 = 30, "3 left" |

## Batch 4 — Saves with lasting consequences

### VS-59 · Spider Sting

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-59a | "You deal 1d4 piercing damage to the touched creature" | 1d4 piercing whatever the save | pf2e's own spell card (its damage, 1d4 piercing) | ✅ | The card's damage button rolled **1d4 piercing** (1) for ZZ Victim, whatever its save — pf2e's own, as for any spell's damage |
| VS-59b | "Critical Success The target is unaffected" | Nothing more | no rider on `criticalSuccess` | ✅ | A critical success (44): no damage roll, no venom, no condition |
| VS-59c | "Success The target takes 1d4[poison] damage" | 1d4 poison, no affliction | `content/vanilla/spider-sting.json`: `success` → `damage` 1d4 poison | ✅ | A success (34): "1d4 poison" = 4, ZZ Victim took 4; no venom |
| VS-59d | "Failure The target is afflicted with spider venom at stage 1" | The affliction at stage 1: 1d4 poison and enfeebled 1 | `failure` → `affliction` at `stage: 1` (`scripts/riders/affliction.mjs`) | ✅ | A failure (20): *Spider Venom (stage 1)* — badge 1 — **enfeebled 1**, and its stage damage rolled and applied at once: 1d4 poison = 3 |
| VS-59e | "Critical Failure The target is afflicted with spider venom at stage 2" | Stage 2: 1d4 poison and enfeebled 2 | `criticalFailure` → `stage: 2` | ✅ | A critical failure (2): *Spider Venom (stage 2)*, **enfeebled 2**, 1d4 poison applied |
| VS-59f | "Stage 1 1d4 poison damage and Enfeebled 1 (1 round)" | At the end of each of its turns a Fortitude save moves the stage, and stage 1 deals its damage and condition | `pf2e.endTurn` → `Affliction.recover`: the save against the venom's DC; `nextStage` test (−2/−1/+1/+2) | ✅ | In an encounter, at the end of ZZ Victim's turn: "Spider Venom DC 34", a failure → stage 2. With +30 Fortitude, a success at stage 2 → **stage 1**: enfeebled 2 became **enfeebled 1**, and 1d4 poison was dealt; a critical success at stage 1: "ZZ Victim recovers from Spider Venom." and the enfeebled went with it |
| VS-59g | "Stage 2 1d4 poison damage and Enfeebled 2 (1 round)" | Stage 2's damage and condition | stage 2's own conditions and damage; the same stage again is its damage again | ✅ | At stage 2: **enfeebled 2** and 1d4 poison; a critical failure there kept it at stage 2 (the last) and dealt its 1d4 again (1) |
| VS-59h | "Maximum Duration 4 rounds" | After four rounds the venom ends | `maxRounds: 4` | ✅ | After the fourth end of turn: "Spider Venom runs its course on ZZ Victim." — the effect and its enfeebled gone |

### VS-60 · Seal Fate

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-60a | "Choose one type of damage from the following list: acid, bludgeoning, cold, electricity, fire, piercing, slashing, sonic, or void" | The cast asks for one of the nine | `castChoice` (`content/vanilla/seal-fate.json`); a cast stage, `a choice made as it is cast` | ✅ | Every cast asked "Which damage will be its end?" with **acid, bludgeoning, cold, electricity, fire, piercing, slashing, sonic, void**; the choice reached pf2e's *Spell Effect: Seal Fate* without its own prompt (`preselect: "$cast"`) — *Seal Fate (Fire)*, *(Cold)*, *(Acid)* |
| VS-60b | "Success The target gains weakness 2 to the chosen damage type until the end of your next turn" | Weakness 2 to that type, ending on the caster's next turn | `success`: the effect for `1 round, turn-end`, timed from the caster's turn | ✅ | A success (34, with +30 Fortitude): *Seal Fate (Acid)*, **weakness acid 2**, lasting 1 round to the end of a turn — the end of Aries' next turn, pf2e's reckoning from the turn it was cast in |
| VS-60c | "Failure As success, but the duration is 1 minute" | One minute | `failure`: 1 minute | ✅ | A failure (20): *Seal Fate (Fire)*, **weakness fire 2**, **1 minute** |
| VS-60d | "If the creature is reduced to 0 Hit Points by the chosen damage and its level is 7 or less, it dies" | 0 HP from that type kills a creature of level 7 or lower outright | `carries`: a `damage-received` `death` (`hpFraction: 0`, `maxLevel: 7`) predicated on the chosen type (`"$cast:damageType"`, `withCast` test) | ✅ | ZZ Victim (level 1) at 10 HP: 15 **cold** took it to 0 and it lived (not the chosen type); 15 **fire** — 17 with the weakness — took it to 0: "ZZ Victim is reduced to 0 Hit Points — it dies.", marked dead. At level 9, cast at rank 4, the same fire left it at 0 and alive |
| VS-60e | "Critical Failure As failure, but the duration is unlimited" | No end | `criticalFailure`: the effect with no duration of its own | ✅ | A critical failure (2): *Seal Fate (Cold)*, weakness cold 2, **unlimited**, carrying the death rider |
| VS-60f | "Critical Success The target is unaffected" | Nothing | no rider on `criticalSuccess` | ✅ | A critical success (44): no effect, no weakness |
| VS-60g | "The weakness increases by 1, and the maximum level of creature that can be automatically killed increases by 4" | Rank 6: weakness 3, level 11 | `atCastRank` (pf2e's floor(level / 2)); `maxLevelPerStep: 4` every 2 ranks | ✅ | Rank 6: **weakness fire 3**, and the death rider's level limit **11** — the level-9 ZZ Victim, burned to 0, died |

### VS-61 · Vision of Death

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-61a | "It takes 8d6 mental damage with a Will save" | A Will save against 8d6 mental | `content/vanilla/vision-of-death.json`: `damage` 8d6 mental by the Will save's result (not a basic save in pf2e, so the shares are riders) | ✅ | pf2e's card's Will save against **DC 34**; a failure (20): **8d6 mental** = 26, ZZ Victim took 26 |
| VS-61b | "If the target is reduced to 0 HP by this spell, its vision becomes reality and kills it instantly" | 0 HP from this spell is death | `death` (`hpFraction: 0`) after the damage, each result | ✅ | ZZ Victim at 5 HP, failing: 26 mental, then "ZZ Victim is reduced to 0 Hit Points — its vision becomes reality, and it dies." — marked dead |
| VS-61c | "Success The target takes half damage and is Frightened 1" | Half, frightened 1 | `success`: `multiplier: 0.5`, frightened 1 | ✅ | A success (34, with +30 Will): **8d6 × 0.5** = 13, and **frightened 1** |
| VS-61d | "Failure The target takes full damage and is Frightened 2" | Full, frightened 2 | `failure`: full, frightened 2 | ✅ | A failure: 26 in full, **frightened 2** |
| VS-61e | "Critical Failure The target takes double damage, is Frightened 4 and is Fleeing for as long as it's frightened" | Double, frightened 4, and fleeing that ends with the frightened | `criticalFailure`: `multiplier: 2`, frightened 4, fleeing with `endsWith: ["frightened"]` (`registerEndsWith`) | ✅ | A critical failure (2): **8d6 × 2** = 74, **frightened 4** and **fleeing**; with the frightened gone, "ZZ Victim is no longer frightened: Fleeing ends." |
| VS-61f | "The damage increases by 2d6" | Rank 5: 10d6 | `perStep: "2d6"` | ✅ | Rank 5: **8d6 + 2d6** mental — 10d6 |

### VS-62 · Wave of Despair

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-62a | "Success For 1 round, the creature can't use reactions and must attempt another save at the start of its turn" | No reactions for a round, and a Will save at the start of its next turn | `content/vanilla/wave-of-despair.json`: `success` → a written-out effect for `1 round, turn-start` with `self:cannot-react` and a carried `turn-start` Will save | ⚠️ | A success (34, +30 Will): *despair: no reactions, a Will save at the start of each turn* for **1 round** to the start of a turn, and the creature carries `self:cannot-react` — every reaction this module offers (`reactions.mjs`) is refused it. **Gap:** pf2e itself has no way to refuse a reaction, so its own reactions (*Reactive Strike*, a Shield Block) are not stopped — as for VS-49g |
| VS-62b | "on a failure, it is Slowed 1 for that turn as it sobs uncontrollably" | A failed turn-start save slows it 1 for that turn only | the carried save's failure → slowed 1 for `0 rounds, turn-end` (a rider's duration may be 0) | ✅ | In an encounter, at the start of ZZ Victim's turn: one Will save against DC 34, a critical failure (2) → **slowed 1** for 0 rounds, gone at the end of that same turn; the next turn's save a success (40) → no slowed |
| VS-62c | "Failure As success, but the duration is 1 minute" | No reactions and a save at each turn start, for a minute | `failure` → the same effect for 1 minute | ✅ | A failure (20): the despair effect for **1 minute**, `self:cannot-react`, and a save at the start of each of its turns (above) |
| VS-62d | "Critical Failure As failure, and the creature is automatically slowed 1 for 1 minute" | Slowed 1 for the minute, whatever the turn-start saves | `criticalFailure` → the effect for 1 minute and slowed 1 for 1 minute | ✅ | A critical failure (2): the despair effect for 1 minute and **slowed 1 for 1 minute**, whatever the turn-start saves |
| VS-62e | "Critical Success The creature is unaffected" | Nothing | no rider on `criticalSuccess` | ✅ | A critical success (44): no effect, reactions untouched |
| VS-62f | "Heightened (7th) The area increases to a 60-foot cone" | A 60-ft cone at rank 7 | pf2e's own heightening of the area | ✅ | pf2e's variant at rank 7 is a **60-foot cone** (30 at ranks 5 and 6), and area targeting aims what the variant says. Found on the way: an added +30 at rank 7 made it 90 — pf2e already carries it, and nothing is added |

### VS-63 · Phantasmal Calamity

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-63a | "The vision deals 11d6 mental damage (basic Will save)" | A basic Will save in the 30-ft burst | pf2e's own card: a basic Will save, 11d6 mental, in the 30-foot burst area targeting placed | ✅ | The burst caught ZZ Victim; the card's save is pf2e's **basic** Will save against DC 34, its damage 11d6 mental (13d6 at rank 7), halved or doubled by the save on pf2e's own damage card |
| VS-63b | "On a critical failure, the creature must also succeed at a reflex save or believe it's trapped" | A critical failure asks a Reflex save next | `content/vanilla/phantasmal-calamity.json`: `criticalFailure` → a `save` rider (`statistic: "reflex"`) | ✅ | A critical failure on the Will save (2): a **Reflex save** rolled at once against DC 34. A success there (40, with +30 Reflex): nothing more |
| VS-63c | "If it fails the second save, it's also Stunned for 1 minute" | A failed Reflex save stuns for a minute | the Reflex save's `failure`/`criticalFailure` → stunned for 1 minute | ✅ | A critical failure on the Reflex save (2): *Phantasmal Calamity: Stunned* for **1 minute**, ZZ Victim **stunned** |
| VS-63d | "It can attempt a new Will save at the end of each of its turns, and on a success, it disbelieves the illusion and recovers from the stunned condition" | A Will save at each turn's end; a success ends the stun | the stun's `carries`: a `turn-end` Will save, a success `shorten: "all"` | ✅ | In an encounter, at the end of ZZ Victim's turn: a Will save against DC 34 — a critical failure (2) kept the stun; next turn's success (40): "Drive: Phantasmal Calamity: Stunned on ZZ Victim ends." and the stunned condition went with it |
| VS-63e | "The damage increases by 2d6" | Rank 7: 13d6 | pf2e's own heightening (+2d6) | ✅ | Rank 7: the card's damage **13d6** mental |

### VS-64 · Massacre

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-64a | "Each living creature of 17th level or lower in the line must attempt a Fortitude save" | The 60-ft line catches living creatures of level 17 or lower; others don't save | `content/vanilla/massacre.json`: every rider predicated on `target:mode:living` and level ≤ 17 (≤ 19 at rank 10); the line aimed from the caster | ✅ | The 60-foot line from Aries caught ZZ Victim (level 1), the Ghoul Soldier (undead) and Capricorn (level 20); only ZZ Victim's save did anything. Made level 19, at rank 9 its save did nothing — not of 17th level or lower |
| VS-64b | "If the damage from massacre reduces a creature to 0 Hit Points, that creature dies instantly" | 0 HP from it is death | `death` (`hpFraction: 0`) after the damage | ✅ | ZZ Victim at 50 HP, failing: 100 void, then "ZZ Victim is reduced to 0 Hit Points — it dies." |
| VS-64c | "Success The creature takes 9d6 void damage" | 9d6 | `success` → 9d6 void (rank < 10) | ✅ | A success (34, with +30 Fortitude): **9d6 void** = 33 |
| VS-64d | "Failure The creature takes" | 100 void damage | `failure` → 100 void (rank < 10) | ✅ | A failure (20) at 400 HP: **100 void**, ZZ Victim at 300 |
| VS-64e | "Critical Failure The creature dies" | Dead | `criticalFailure` → `death` | ✅ | A critical failure (2): "ZZ Victim is reduced to 0 Hit Points — it dies.", marked dead |
| VS-64f | "If massacre doesn't kill even a single creature, the void energy hungrily turns backward toward you" | With nobody dead, the backlash follows | `aftermath` on the cast (`awaits` the answering creatures), `aftermath-mark` last of each one's riders (`scripts/riders/aftermath.mjs`; `tallyState` test) | ✅ | With ZZ Victim surviving its result (a success, 9d6; a failure, 100; at rank 10, 115) — and with nobody able to answer at all (level 19, rank 9) — "Drive: Massacre killed no one: the void energy turns back." When ZZ Victim died (a critical failure, or 100 at 50 HP), no backlash |
| VS-64g | "damage to every living creature in the line (even those above 17th level) and 30 void damage to you" | 30 void to every living creature in the line and 30 to the caster | `none` 30 void on every reached creature `noneTo: ["target:mode:living"]` admits; `noneSelf` 30 void on the caster | ✅ | The backlash: **30 void** to ZZ Victim and to Capricorn (level 20 — above 17th, still taken), none to the undead Ghoul Soldier, and **30 void to Aries** |
| VS-64h | "Heightened (10th) The spell can affect living creatures up to 19th level" | Level 19 at rank 10, with 10d6 and 115 | rank-10 riders (`item:rank` ≥ 10): level 19, 10d6, 115 | ✅ | Rank 10, ZZ Victim at level 19: a failure dealt **115** void, a success **10d6** void — both answering, where at rank 9 the same level was out of reach |

## Batch 5 — Reactions and recovery

### VS-65 · Schadenfreude

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-65a | "Trigger You critically fail a saving throw against a foe's effect" | The caster's critical failure against a foe's effect offers the reaction, aimed at that foe | `save-made` event (`Sources.onSaveMessage`'s mirror; test); `rider:trigger:enemy`; `reaction` → nested `cast` with `trigger: true` | ✅ | ZZ Victim (opposition) cast *Fear* at Aries; Aries critically failed its Will save (23 against DC 60): "Drive: Schadenfreude can be used as a reaction. Spend it?" Using it cast *Schadenfreude* targeted at **ZZ Victim** (one use spent, 30 → 29). Leo (party) casting the same at Aries, critically failed: no offer |
| VS-65b | "Success The creature is distracted by its amusement and takes a -1 status penalty on Perception checks and Will saves for 1 round" | –1 to Perception and Will for a round | `success` → a written-out effect, –1 status to Perception and Will, 1 round | ✅ | ZZ Victim's success (with +30 Will): *amused: –1 to Perception and Will* for 1 round — Will +30 → **+29**, Perception 0 → **–1** |
| VS-65c | "Failure The creature is overcome by its amusement and is Stupefied 1 for 1 round" | Stupefied 1 for a round | `failure` → stupefied 1 for 1 round | ✅ | A failure: **stupefied 1** for 1 round (Will and Perception –1) |
| VS-65d | "Critical Failure The creature is lost in its amusement and is Stupefied 2 for 1 round and Stunned 1" | Stupefied 2 and stunned 1 | `criticalFailure` → stupefied 2 for 1 round, and stunned 1 | ✅ | A critical failure: **stupefied 2** for 1 round and **stunned 1** |
| VS-65e | "Critical Success The creature is unaffected" | Nothing | no rider on `criticalSuccess` | ✅ | A critical success: nothing |

### VS-66 · Blinding Fury

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-66a | "Trigger A creature damages you" | Damage to the caster offers the reaction, aimed at the one who dealt it | `content/vanilla/blinding-fury.json`: a `damage-received` reaction (`rider:damage:dealt`) whose nested `cast` (`trigger: true`) aims at the attacker | ✅ | ZZ Victim's longsword dealt Aries 5: "Drive: Blinding Fury can be used as a reaction." Using it cast *Blinding Fury* at **ZZ Victim**, whose Will save followed |
| VS-66b | "Success The target can't Observe you until the end of its turn, and if you're currently observed by it, you become Hidden to it" | The caster is hidden to it until the end of its turn | `unobserve` (`scripts/riders/unobserved.mjs`): an effect naming the unobserved creature, to the end of the watcher's turn; a check-pipeline gate (DC 11 flat check) and stage (off-guard) | ✅ | Any result but a critical success: "ZZ Victim can't observe Aries" until the end of its turn. ZZ Victim's Strike at Aries: "DC 11 flat check — failed, the attack is lost" (5); with 15 it passed and the attack was rolled. Aries' Strike found ZZ Victim off-guard — AC **8**, not 10 |
| VS-66c | "Failure As success, and for 1 minute, every time the target damages you, it can't observe you until the end of its turn" | For a minute, each time it hurts the caster, the caster is hidden to it again | `failure`: a 1-minute effect carrying a `damage-applied` `unobserve` with `onlyEffectOrigin` | ✅ | For the minute: ZZ Victim damaging Aries again — "ZZ Victim can't observe Aries" anew; damaging Capricorn — nothing |
| VS-66d | "Critical Failure As success, and for an unlimited duration, the first time each round the target damages a creature, it can't observe that creature until the end of its turn" | Forever: the first creature it damages each round is hidden to it | `criticalFailure`: an unlimited effect carrying a `damage-applied` `unobserve` with `oncePerRound` (the round of the creature's own encounter) | ✅ | Unlimited. In one round: damaging Capricorn first — "can't observe Capricorn"; damaging Aries after — nothing. Next round, damaging Aries — "can't observe Aries". Found on the way: the round gate read the *viewed* encounter, not the one the creature fights in, and kept every round closed; it now reads the creature's own |
| VS-66e | "If it damages several creatures at once, the creature it can't perceive is chosen randomly among those creatures" | A random pick among several | `oncePerRound`: the first damage that lands | ⚠️ | With several creatures damaged at once, the one it can't observe is the first whose damage is applied. **Gap:** not chosen at random — pf2e applies an area's damage one creature at a time, in the order the table clicks, so the first applied is the one |
| VS-66f | "Critical Success The target is unaffected" | Nothing | no rider on `criticalSuccess` | ✅ | A critical success (44): nothing |

### VS-67 · Breath of Life

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-67a | "Trigger A living creature within range would die" | When a living creature within 60 ft would die, the caster is offered the reaction before it does | `creature-dying` event (`Sources.onWouldDie`; `wouldDie` test: a character at its dying maximum, anything else brought to 0), `range: 60`, `rider:trigger:mode:living`; a reaction whose nested `cast` (`trigger: true`) aims at the dying creature | ✅ | Capricorn's longsword took ZZ Victim (living, 35 feet from Aries) from 5 to 0: "Drive: Breath of Life can be used as a reaction." offered to Aries, before anything else was decided. The character half — dying at its maximum — is covered by the `wouldDie` test; the one character driven (Leo) holds at 1 HP by his own ability |
| VS-67b | "You prevent the target from dying and restore 5d8 Hit Points to the target" | It lives, at 5d8 HP | the cast's `action-used` `heal` (`formula: "5d8"`) with `revive`: no longer dying, dead or defeated | ✅ | Using it cast *Breath of Life* at ZZ Victim: "ZZ Victim regains 27 Hit Points" (5d8) — up from 0, not dead |
| VS-67c | "You can't use breath of life if the triggering effect was a death effect or an effect that leaves no remains, such as Disintegrate" | No offer for a death effect or *Disintegrate* | `leavesNothing` (a `death` trait, or *Disintegrate*) keeps `creature-dying` from firing; this module's own `death` sets 0 HP without damage, so never fires it; test | ✅ | ZZ Victim taken from 5 to 0 by *Disintegrate*: no reaction offered |
| VS-67d | "The healing increases by 1d8" | Rank 7: 6d8 | `perStep: "1d8"`, `perStepInterval: 2` (pf2e's data heightens it every rank; the text, every 2) | ✅ | Cast at **rank 7**: "ZZ Victim regains 24 Hit Points" — **6d8** |

### VS-68 · Stabilize

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-68a | "The target loses the Dying condition" | Dying gone (and wounded rises, as losing dying always does) | `content/vanilla/stabilize.json`: `condition` `dying` `remove: true` — `loseDying` raises wounded | ✅ | Leo at 0 HP, dying 2: "Leo is no longer dying." — dying gone, **wounded 1**. Found on the way: taking dying off took neither wounded on (the rule: losing dying always raises it) nor left the unconscious pf2e's dying had granted |
| VS-68b | "though it remains Unconscious at 0 Hit Points" | Still unconscious, still at 0 HP | an `unconscious` rider after the removal | ✅ | Leo stayed **unconscious** (blinded and prone with it) at **0 HP** |

### VS-69 · Sound Body

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-69a | "Attempt to counteract an effect of your choice imposing one of these conditions on the target: Blinded, Dazzled, Deafened, Enfeebled, or Sickened" | A card offers the effects imposing those conditions; a counteract check ends the one chosen | `content/vanilla/sound-body.json`: `counteract` with `conditions` — the effects imposing them (`imposesListed`), on the target only | ✅ | Cast at Leo, carrying *Blinding Flash* (blinded), *Deep Blindness* (blinded), *Curse of Night* (dazzled, a curse) and *Weakness* (drained): the card offered **Blinding Flash** and **Deep Blindness**. Counteracting *Deep Blindness* (level 5) with a critical success: "counteracted and gone", its blinded with it. The drive rolled Aries' default counteract statistic; the content now names `spellcasting`, the spell's own |
| VS-69b | "If you didn't counteract the effect, but you would have if its counteract rank were 2 lower, instead suppress the effect until the beginning of your next turn" | A near miss suppresses it until the caster's next turn | `nearMiss: 2` in `resolveCounteract`; `set-aside.mjs` (until the caster's next turn) | ✅ | *Deep Blindness* at level 7, a critical success at counteract rank 2 (reaching 5): "not counteracted, but suppressed until the start of Aries's next turn" — taken off Leo, its blinded with it. As Aries' next turn began: "Drive: Deep Blindness returns to Leo.", blinded again |
| VS-69c | "The effect's duration doesn't elapse while it's suppressed" | The suppressed effect's clock stops | `resumedStart` (test): the start moved on by the time away | ✅ | Set aside at world time 232635 and back 12 seconds later: its start **232647**, its remaining duration the full **600 seconds** it had |
| VS-69d | "This spell can't counteract or suppress curses, diseases, or conditions that are part of the target's normal state" | Curses and diseases are not offered | `imposesListed` leaves out curse and disease effects | ✅ | *Curse of Night* — a curse imposing dazzled, a listed condition — was not offered |
| VS-69e | "Heightened (4th) Add Drained and Slowed to the list of conditions" | Rank 4 offers drained and slowed | `conditionsAtRank: { 4: [drained, slowed] }`; `conditionsAt` test | ✅ | At rank 2, *Weakness* (drained) was not offered; at **rank 4**, the card offered **Blinding Flash / Weakness / Deep Blindness** |
| VS-69f | "Heightened (6th) As 4th rank, plus add Petrified" | Rank 6, petrified | `conditionsAtRank: { 6: [petrified] }`; `conditionsAt` test | ✅ | `conditionsAt` at rank 6: blinded, dazzled, deafened, enfeebled, sickened, drained, slowed, **petrified** — the same list the rank-4 drive read its drained from |
| VS-69g | "Heightened (8th) As 4th rank, plus add petrified and Stunned" | Rank 8, stunned | `conditionsAtRank: { 8: [stunned] }`; `conditionsAt` test | ✅ | `conditionsAt` at rank 8: the rank-6 list plus **stunned** |

### VS-70 · Cleanse Affliction

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-70a | "Choose an affliction on the target, such as a curse, disease, or poison" | A card offers the target's afflictions | `cleanse` apply type (`scripts/riders/cleanse.mjs`): a card of the target's afflictions (`isAffliction` test) | ✅ | Cast at Leo, afflicted with spider venom (stage 2) and carrying *Curse of Night*: "Which affliction?" — **Spider Venom (stage 2)** and **Curse of Night** |
| VS-70b | "If it has advanced past stage one, reduce the stage by one" | Stage 2 → 1; stage 1 stays | `Affliction.ease`: past stage 1, one stage down | ✅ | Spider Venom chosen: "Spider Venom eases to stage 1." — enfeebled 2 became enfeebled 1 |
| VS-70c | "This reduction can be applied only once to a given case of an affliction" | A second casting doesn't lower the same case again | the case keeps a `cleansed` mark; a second easing is refused | ✅ | Exposed again (back to stage 2, the same case) and cleansed again: "Spider Venom has already been eased once; only a counteract can do more." — still stage 2 |
| VS-70d | "Heightened (3rd) Attempt to counteract the affliction if it is a disease or poison" | Rank 3 counteracts a disease or poison | `counteractKinds` (test): rank 3 — disease, poison; the counteract against the affliction's own DC | ✅ | At **rank 3**, the venom (a poison): a counteract against its own **DC 20** — "counteracted and gone", its enfeebled with it. *Curse of Night* at rank 3: "beyond this casting … its kind can't be counteracted at this rank" |
| VS-70e | "Heightened (4th) Attempt to counteract the affliction if it is a curse, disease, or poison" | Rank 4 adds curses | `counteractKinds`: rank 4 adds curse | ✅ | At **rank 4**, *Curse of Night*: "counteracted and gone", the dazzled with it |

## Batch 6 — Bodies and movement

### VS-71 · Enlarge

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-71a | "the target grows to size Large" | The creature and its token are Large | `content/vanilla/enlarge.json`: pf2e's *Spell Effect: Enlarge* (`CreatureSize`, its token linked to the actor's size), `atCastRank` | ✅ | Rank 2 on Leo (Medium): **Large**, his token resized to **2×2** |
| VS-71b | "The creature is Clumsy 1" | Clumsy 1 while it lasts | pf2e's effect: `GrantItem` Clumsy | ✅ | Leo **clumsy 1** while it lasts |
| VS-71c | "Its reach increases by 5 feet (or by 10 feet if it started out Tiny)" | Reach +5 ft | pf2e's effect: reach override 10 (15 at Huge) | ✅ | Leo's reach **10** feet (from 5) |
| VS-71d | "it gains a +2 status bonus to damage rolls on melee Strikes" | +2 to melee damage | pf2e's effect: `FlatModifier` status, `melee-strike-damage` | ✅ | "Enlarge: +2" on Leo's melee Strike damage |
| VS-71e | "This spell has no effect on a Large or larger creature" | A Large creature is unchanged | each rider predicated on `target:size` (below Large; below Huge from 4th rank) | ✅ | ZZ Victim made Large, cast on at rank 2: no effect, still Large, no clumsy, reach unchanged |
| VS-71f | "Heightened (4th) The creature instead grows to size Huge" | Rank 4: Huge, +4, reach +10 ft | pf2e's effect at level 4: Huge, +4, reach 15 | ✅ | Rank 4 on Capricorn: **Huge**, token **3×3**, reach **15**, "Enlarge: +4", clumsy 1 |
| VS-71g | "Heightened (6th) Choose either the 2nd-rank or 4th-rank version of this spell and apply its effects to up to 10 willing creatures" | Rank 6: a choice, and up to ten targets | `castChoice` with `fromRank: 6`, `preselect: "$cast"` (`choiceValue` test); `areaTargeting.maxTargets` 1, 10 from rank 6 | ✅ | Rank 6, three targets: "Which version: Large, or Huge?" — Large — and Leo, Capricorn and ZZ Victim each **Large**, the choice already made on every effect (no prompt per creature). At rank 2, two targeted: "2 targeted, and it reaches 1. Cast anyway?" |
| VS-71h | "Its equipment grows with it but returns to natural size if removed" | — | | — | Nothing to automate: equipment size is description |

### VS-72 · Animal Form

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-72a | "When you Cast this Spell, choose a listed battle form" | The cast asks for one of the forms | `content/vanilla/animal-form.json`: a `choice` of pf2e's 13 *Spell Effect: Animal Form* effects | ✅ | The cast asked "Which battle form?" — Ape, Bear, Bull, Canine, Cat, Crab, Crocodile, Deer, Frog, Orca, Seal, Shark, Snake. Bear chosen: *Spell Effect: Animal Form (Bear)* on Aries, at the cast's rank |
| VS-72b | "You can decide the specific type of animal" | — | | — | Nothing to automate: flavour |
| VS-72c | "While in this form, you gain the animal trait" | The animal trait | pf2e's `BattleForm`: traits | ✅ | Aries has the **animal** trait in Bear form, not before |
| VS-72d | "AC = 16 + your level" | AC 16 + level, unless the caster's own is higher | pf2e's `BattleForm`: AC `16 + @actor.level` | ✅ | AC 34 → **36** (16 + level 20) |
| VS-72e | "5 temporary Hit Points" | 5 temporary HP | pf2e's `BattleForm`: tempHP | ✅ | **5** temporary Hit Points |
| VS-72f | "Low-light vision and imprecise scent 30 feet" | Both senses | pf2e's `BattleForm`: senses | ✅ | **low-light vision** and **scent (imprecise, 30 feet)** added to Aries' own lifesense |
| VS-72g | "which are the only attacks you can Strike with" | The form's attacks replace every other Strike | pf2e's `BattleForm`: strikes replace the rest | ✅ | Aries' Strikes became **Claw** and **Jaws** only — *Ghost Touch Fist* and *Unarmed Attack* gone while in form |
| VS-72h | "Your attack modifier is +9, and your damage bonus is +1" | +9 and +1, unless the caster's unarmed bonus is higher | pf2e's `BattleForm`: +9 / +1, or the creature's own if higher | ✅ | Claw and Jaws at **+29** — Aries' own unarmed modifier, higher than +9 |
| VS-72i | "Athletics modifier of +9, unless your own modifier is higher" | Athletics +9 or the caster's own | pf2e's `BattleForm`: Athletics +9 unless higher | ✅ | Athletics stayed **+25**, Aries' own |
| VS-72j | "You also gain specific abilities based on the type of animal you choose" | The chosen form's Speeds and attacks | pf2e's per-form effects: each form its own Speeds and attacks | ✅ | Bear: Claw (1d8 slashing, agile) and Jaws (2d8 piercing), land Speed 30 |
| VS-72k | "You can Dismiss the spell" | Dismissing it ends the form | `dismissable` on the effect: the caster's *Dismiss* action (`Dismiss.grantForEffect`) | ✅ | With the form came **Dismiss Drive: Animal Form**; using it: "Aries dismisses Spell Effect: Animal Form (Bear)." — the form gone (AC 34, its own Strikes back), the action gone with it |
| VS-72l | "Heightened (3rd) You instead gain 10 temporary HP, AC = 17 + your level, attack modifier +14, damage bonus +5, and Athletics +14" | Rank 3's numbers | pf2e's brackets at level 3; `atCastRank` | ✅ | Rank 3: AC **37**, **10** temporary Hit Points (attack +14 and Athletics +14 below Aries' own) |
| VS-72m | "Heightened (4th) Your battle form is Large and your attacks have 10-foot reach" | Rank 4: Large, reach 10 ft | pf2e's brackets at level 4: Large, reach | ✅ | Rank 4: **Large**, token **2×2**, Claw and Jaws with **reach**; the rank-3 form replaced, not stacked |

### VS-73 · Fly

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-73a | "gaining a fly Speed equal to its Speed or 20 feet, whichever is greater" | A fly Speed of the creature's Speed, at least 20 ft | `content/vanilla/fly.json`: pf2e's *Spell Effect: Fly* (`BaseSpeed` fly = max(20, land)) on the target | ✅ | Leo (land 25): **fly 25**. ZZ Victim slowed to land 15: **fly 20** — the minimum |
| VS-73b | "Heightened (7th) The duration increases to 1 hour" | Rank 7 lasts an hour | a rank-7 rider (`item:rank` ≥ 7) with a 1-hour duration | ✅ | Rank 4: the effect for 5 minutes; **rank 7**: **1 hour** |

### VS-74 · Earthbind

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-74a | "you hamper a target's flight" | Only a flying creature can be targeted | `content/vanilla/earthbind.json`: `requires: "flying-target"` (a cast stage, `what a spell needs`) | ✅ | Cast at ZZ Victim on the ground: refused, nothing posted. At 60 feet up: cast |
| VS-74b | "Success The target falls safely up to 120 feet" | It drops up to 120 ft (elevation) | `fall` (`scripts/riders/fall.mjs`, `fallTo` test): up to 120 feet, never below the ground | ✅ | A success at 60 feet: "ZZ Victim falls 60 feet to the ground, safely." A failure at 200 feet: "falls 120 feet, safely; still 80 feet up." |
| VS-74c | "If the creature reaches the ground safely, it doesn't take falling damage" | No falling damage | `fall` deals no damage | ✅ | Every fall: no damage roll, Hit Points unchanged |
| VS-74d | "it can't Fly, levitate, or otherwise leave the ground for 1 round" | On a failure, grounded for a round | `failure`: `grounded` 1 round, only on landing; a `preUpdateToken` hook refuses a rise | ✅ | A failure at 60 feet: landed, and *Earthbind: can't leave the ground* for **1 round**; lifting the token to 30 feet was **refused**. A failure at 200 feet: still 80 feet up, so not grounded |
| VS-74e | "it can't Fly, levitate, or otherwise leave the ground for 1 minute" | On a critical failure, for a minute | `criticalFailure`: `grounded` 1 minute | ✅ | A critical failure at 60 feet: landed, can't leave the ground for **1 minute** |
| VS-74f | "Critical Success The target is unaffected" | Nothing | no rider on `criticalSuccess` | ✅ | A critical success (44): no fall, no effect |

### VS-75 · Levitate

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-75a | "levitate the target 5 feet off the ground" | Elevation 5 ft | `content/vanilla/levitate.json`: `elevation` `set: 5` (`scripts/riders/fall.mjs`, `elevationAfter` test) | ✅ | Cast at Leo: his token at **5 feet** |
| VS-75b | "You can Sustain the spell to move the target up or down 10 feet" | Each Sustain moves it 10 ft up or down | pf2e's effect with an `originAction` (`spends: false`): the caster's *Sustain Levitate*, a choice of `elevation` ±10 on the effect's holder | ✅ | Aries got **Sustain Levitate**; using it asked "Move it up or down 10 feet?" — Up: "Leo floats 15 feet up." The effect and the action stayed. The once-a-turn limit of Sustaining is the table's |
| VS-75c | "A creature floating in the air from levitate takes a –2 circumstance penalty to attack rolls" | –2 to its attacks | pf2e's *Spell Effect: Levitate*: –2 circumstance to attacks unless `stabilized` | ✅ | Leo's Strike: "Levitate –2" |
| VS-75d | "A floating creature can spend an Interact action to stabilize itself and negate this penalty for the remainder of its turn" | An Interact removes the penalty until its turn ends | pf2e's `stabilized` toggle; a carried `turn-end` `toggle` (`value: false`) | ✅ | Stabilized: the –2 gone. At the end of Leo's turn the toggle went off and the **–2** came back |
| VS-75e | "it can move across the surface by climbing" | — | | — | Nothing to automate: which surfaces hold is the GM's call |

### VS-76 · Vapor Form

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-76a | "It loses any item bonus to AC and all other effects and bonuses from armor, and it uses its proficiency modifier for unarmored defense" | AC from unarmored proficiency, armor ignored | pf2e's *Spell Effect: Vapor Form*: `AdjustModifier` suppresses item bonuses to AC | ⚠️ | The effect suppresses any item bonus to AC (pf2e's rule; Aries, unarmored, stayed at 34). **Gap:** an armored creature keeps its armor's proficiency and other armor effects; swapping them for its unarmored defense is the table's |
| VS-76b | "It gains resistance 8 to physical damage and is immune to precision damage" | Resistance 8 physical, precision immunity | pf2e's effect: `Resistance` physical 8, `Immunity` precision | ✅ | Aries: **resistance physical 8**, **immune precision** |
| VS-76c | "It can't cast spells, activate items, or use actions that have the attack or manipulate trait" | Its casts and attacks are refused | `forbids: [cast, attack, manipulate]` (`scripts/riders/forbids.mjs`): a cast stage, a check gate, the action wrap | ✅ | In vapor form: casting *Fly* — refused, nothing posted; a Strike — refused; an action with the manipulate trait — refused. After the form ended, the same Strike rolled |
| VS-76d | "It gains a fly Speed of 10 feet" | Fly 10 ft | pf2e's effect: `BaseSpeed` fly 10 | ✅ | **fly 10** |
| VS-76e | "The target can Dismiss the spell" | Dismissing it ends the form | `dismissable: "holder"`: the Dismiss given to the target | ✅ | Aries (the target) got **Dismiss Drive: Vapor Form**; using it: "Aries dismisses Spell Effect: Vapor Form." — resistance, immunity and fly gone |

## Batch 7 — Protection

### VS-77 · Resist Energy

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-77a | "Choose acid, cold, electricity, fire, or sonic damage" | The cast asks for one of five | `content/vanilla/resist-energy.json`: `castChoice` of five types, `preselect: "$cast"` on pf2e's effect | ✅ | The cast asked "Resistance to which damage?" — Acid, Cold, Electricity, Fire, Sonic; the choice went onto every target's effect, no prompt per creature |
| VS-77b | "The target and its gear gain resistance 5 against the damage type you chose" | Resistance 5 to that type | pf2e's *Spell Effect: Resist Energy* (`Resistance`, by `@item.level`), `atCastRank` | ✅ | Rank 2, Fire, on Leo: **fire 5** |
| VS-77c | "Heightened (4th) The resistance increases to 10, and you can target up to two creatures" | Rank 4: 10, two targets | `areaTargeting.maxTargets` 1, +1 at rank 4; pf2e's 10 at level 4 | ✅ | Rank 4 with three targeted: "3 targeted, and it reaches 2. Cast anyway?"; with two, Cold: Leo and ZZ Victim **cold 10** |
| VS-77d | "Heightened (7th) The resistance increases to 15, and you can target up to five creatures" | Rank 7: 15, five targets | `maxTargets` +3 at rank 7 (five); pf2e's 15 at level 7 | ✅ | Rank 7, three targeted, Sonic: Leo, ZZ Victim and Capricorn **sonic 15**, no warning |

### VS-78 · Mountain Resilience

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-78a | "It gains resistance 5 to physical damage, except adamantine" | Resistance 5 physical, adamantine excepted | pf2e's *Spell Effect: Mountain Resilience* (`Resistance` physical, `exceptions: [adamantine]`), `atCastRank` | ✅ | Leo: **resistance physical 5, except adamantine**; a 10-slashing hit took 5 |
| VS-78b | "Each time the target is hit by a bludgeoning, piercing, or slashing attack, mountain resilience 's duration decreases by 1 minute" | Every physical hit takes a minute off its 20 | `content/vanilla/mountain-resilience.json`: the effect `carries` a `damage-received` `shorten` (1 of its minutes), predicated on bludgeoning, piercing or slashing from a hit | ✅ | A slashing hit: **20 → 19 minutes**. A fire hit: still 19. Piercing damage that was not an attack: still 19 |
| VS-78c | "Heightened (6th) The resistance increases to 10" | Rank 6: 10 | pf2e's effect at level 6 | ✅ | Rank 6: **resistance physical 10** |

### VS-79 · Protection

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-79a | "The target gains a +1 status bonus to Armor Class and saving throws" | +1 AC and saves | pf2e's *Spell Effect: Protection* (`FlatModifier` status +1 AC and saves) on `action-used` | ✅ | Rank 1 on Leo: no prompt; **AC 34 → 35, Fortitude +24 → +25** |
| VS-79b | "You can choose to have the benefits also affect all your allies in a 10-foot emanation around the target" | From rank 3, a choice: the bonus also reaches the caster's allies within 10 ft of the target, moving with it | `content/vanilla/protection.json`: `castChoice` `extent` from rank 3; on `rider:cast:extent:emanation`, an effect with pf2e's `Aura` (10 ft, allies, `removeOnExit`) granting the same effect | ✅ | Rank 3 asked "Ward only the target, or every ally within 10 feet of it as well?"; *emanation*: Leo got the bonus and the aura; Aries 5 ft away **AC 35**, Capricorn 20 ft away stayed 34; moved 10 ft from Leo, Capricorn gained it; Aries walked 30 ft out — **lost it**, and walking back in got it again |

### VS-80 · Fire Shield

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-80a | "its heat grants you cold resistance 5" | Cold resistance 5 | pf2e's *Spell Effect: Fire Shield* (`Resistance` cold, by `@item.level`), `atCastRank` | ✅ | Rank 4 on Aries: **cold resistance 5** |
| VS-80b | "makes you immune to mild and severe environmental cold" | — | | — | Nothing to automate: environmental cold is the GM's |
| VS-80c | "You can Raise a Shield with the fire shield as a normal shield to gain a +1 circumstance bonus to AC" | Raise a Shield gives +1 AC | `shield.raise` (`scripts/riders/spell-shield.mjs`): the shield lowered until pf2e's *Effect: Raise a Shield* is on; `originAction` *Raise the Fire Shield* puts it there | ✅ | Cast: AC 34, shield **lowered**; a Shield Block then was refused by pf2e (18 of 18 taken). *Raise the Fire Shield* used: **AC 35**, shield raised |
| VS-80d | "You can use the Shield Block reaction with the fire shield , which has Hardness 10, is immune to fire, and has 40 HP (with no Broken Threshold)" | Shield Block with Hardness 10 and 40 HP; fire passes through it untouched | pf2e's effect (Hardness 10, no Broken Threshold); `shield.hp` 40 kept on the effect, `immune: [fire]`; at 0 the effect ends | ✅ | A blocked 18 slashing: Aries took 8, **shield 40 → 32**. A blocked 18 fire: Aries took 8, **shield unchanged**. Down to 3 HP, a blocked 18: "the shield takes 8 damage and is destroyed" — effect, cold resistance and the Raise action gone; the next block took the full 18 |
| VS-80e | "its Hardness is halved against effects that have the water trait" | Hardness 5 against water | `shield.halvedAgainst: [water]`: a damage stage halves the shield's Hardness for a blow with the water trait | ✅ | A blocked 18 slashing with the water trait: **Hardness 5** — Aries took 13, the shield 16 → 3 |
| VS-80f | "If you Shield Block a melee attack that is either an unarmed attack or made by an adjacent attacker, the attacker takes 2d6 fire damage" | Blocking such an attack burns the attacker for 2d6 | `carries` a `damage-received` `damage` 2d6 fire, predicated on `rider:damage:blocked`, `rider:damage:melee` and `unarmed` or `adjacent` (new damage options) | ✅ | Blocked from 95 ft: a sword — **no burn**; a claw (unarmed) — Ghoul 200 → 197. Adjacent, a sword: Ghoul **197 → 190** |
| VS-80g | "The cold resistance increases by 5, the HP increase by 10, and the fire damage increases by 1d6" | Rank 6: 10, 50 HP, 3d6 | `hpPerStep` 10 and `perStep` 1d6 at `perStepInterval` 2; pf2e's resistance formula | ✅ | Rank 6: **cold 10**, shield **50/50**; an adjacent claw blocked: the Ghoul took **3d6** = 16, shield 50 → 42 |

### VS-81 · Share Life

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-81a | "The target takes half damage from all effects that deal Hit Point damage, and you take the remainder of the damage" | The target takes half (rounded down); the caster takes the rest | `shareDamage: { share: 0.5 }` (`scripts/riders/share-damage.mjs`): a damage stage alters the blow with pf2e's `DamageRoll#alter` before it lands; the remainder goes to the caster | ✅ | ZZ Victim linked; 20 slashing: **ZZ −10, Aries −10**; 15 slashing: **ZZ −7, Aries −8** ("Aries takes 8 damage through the link with ZZ Victim") |
| VS-81b | "When you take damage through this link, you don't apply any resistances, weaknesses, or other abilities you have to that damage" | The caster's half ignores the caster's resistances and weaknesses | The caster's remainder is applied `final` — no IWR | ✅ | ZZ resisting slashing 3, Aries slashing 5, 20 slashing: **ZZ −7** (its half, less its resistance), **Aries −10** (none of Aries's resistance) |
| VS-81c | "The spell ends if the target is ever more than 30 feet away from you" | Moving apart beyond 30 ft ends it | `range: 30`: an `updateToken` hook ends the effect when the two are farther apart | ✅ | ZZ moved to 35 ft: "life linked ends: the linked creatures are too far apart" — effect gone |
| VS-81d | "If either you or the target is reduced to 0 Hit Points, any damage from this spell is resolved and then the spell ends" | 0 HP on either side ends it after the blow | After the split, either creature at 0 HP ends the effect | ✅ | ZZ at 6, 20 slashing: ZZ **0**, Aries still took his 10, then "ends: one of the linked creatures is at 0 Hit Points". Caster side (the link pointed at the Ghoul at 5 HP, since Aries's homebrew holds Aries at 1): Ghoul **0**, link ended |

### VS-82 · Protector Tree

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-82a | "A Medium tree suddenly grows in an unoccupied square within range" | A tree is placed in an empty square within 30 ft | `content/vanilla/protector-tree.json`: a 5-ft line, `placeOnly`; `lingering.barrier` of squares in 5-ft sections — one hazard token; an occupied square is refused | ✅ | Placed on Leo's square: "Drive: Protector Tree is lost" — nothing built. Placed in the free square beside Leo, 10 ft from Aries: a **Protector Tree** token there |
| VS-82b | "The tree has AC 10 and 10 Hit Points" | AC 10, 10 HP | `barrier.ac` 10, `hp` 10 | ✅ | The tree: **AC 10, 10/10 HP** |
| VS-82c | "Whenever an ally adjacent to the tree is hit by a Strike, the tree interposes its branches and takes the damage first" | A Strike on an adjacent ally hurts the tree first | `interposes: true` (`scripts/targeting/barrier.mjs`): a damage stage catches a Strike that hit an ally of the caster within 5 ft of the tree; the tree takes it, `final` | ✅ | A sword hit for 7 on Leo beside it: **Leo −0, tree 10 → 3**. Not caught: a miss (Leo −7), damage with no Strike (Leo −7), a hit on the caster Aries beside it (−7) |
| VS-82d | "Any additional damage beyond what it takes to reduce the tree to 0 Hit Points is dealt to the original target" | What the tree can't take goes on to the ally | The blow is altered by what the tree took; the rest lands on the ally; the tree at 0 is removed | ✅ | A hit for 15: "Protector Tree takes the blow for Leo: 3 damage to it, 12 to Leo" — **Leo −12**, tree destroyed; the next hit for 5: Leo −5 |
| VS-82e | "The tree isn't large enough to impede movement through its square" | Its square can be walked through | A section of squares builds no `Wall` and no movement-cost Region | ✅ | The cast left **0 walls** and no Region with a movement behavior — only the token in the square |
| VS-82f | "The tree has an additional 10 Hit Points" | Rank 2: 20 HP | `hpPerStep` 10 | ✅ | Rank 2: the tree **20/20 HP** |

## Batch 8 — One roll, one weapon

### VS-83 · Guidance

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-83a | "granting the target a +1 status bonus to one attack roll, Perception check, saving throw, or skill check the target attempts before the duration ends" | +1 to one such roll before the caster's next turn | pf2e's *Spell Effect: Guidance*: `FlatModifier` status +1 to attack, Perception, saves and skills, predicated on `guidance` | ✅ | Leo, Fortitude with the bonus chosen: **Guidance +1** among the modifiers (+24 → +25) |
| VS-83b | "The target chooses which roll to use the bonus on before rolling" | The bonus is a choice on the roll, not automatic | The modifier is a toggle in pf2e's check dialog (its predicate is the choice) | ✅ | A Fortitude save with it not chosen: +24, and the effect **stayed** |
| VS-83c | "If the target uses the bonus, the spell ends" | Used once, it's gone | pf2e's `removeAfterRoll: "if-enabled"` | ✅ | The save it was chosen for: *Spell Effect: Guidance* **gone** afterwards |
| VS-83d | "Either way, the target is then temporarily immune for 1 hour" | A second *Guidance* within the hour does nothing | `content/vanilla/guidance.json`: pf2e's *Effect: Guidance Immunity* (1 hour) with the spell; every rider predicated on `rider:target:effect:effect-guidance-immunity`, a note when it holds | ✅ | Cast again on Leo within the hour: "The target is temporarily immune to Guidance: the spell does nothing" — no second effect. (The first content read `target:effect:…`, which a cast card's riders don't see; the second cast landed until it read `rider:target:effect:…`.) The immunity is given at the cast, as pf2e's own spell does, so its hour runs from the cast |

### VS-84 · Nudge Fate

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-84a | "a +1 status bonus would turn a critical failure into a failure, or failure into a success" | Only when one more would change the degree | `nudge` (`scripts/riders/nudge.mjs`): a check stage adds a pf2e degree adjustment, +1 step, predicated on `check:total:delta:-1` (not a natural 20) or `-10` (not a natural 1); none when an enabled status bonus is already on the check | ✅ | ZZ Victim (Fortitude +0, DC 15): a 10 — failure, **untouched**, the effect stayed. With a +1 status bonus already on, a 14 total — failure, **untouched** |
| VS-84b | "you grant the target a +1 status bonus to the check retroactively, changing the outcome appropriately" | The roll's outcome is raised after it falls | pf2e's own `DegreeOfSuccess` applies the adjustment, so the card shows the raised outcome | ✅ | A 14: **failure → success**. A 5: **critical failure → failure** |
| VS-84c | "The spell then ends" | Once used, gone | A `createChatMessage` hook ends the effect when the posted check's outcome was raised by it | ✅ | After each raise: "ZZ Victim's roll was nudged, and the spell ends" — effect gone; the untouched failure left it in place |
| VS-84d | "If you cast nudge fate while a previous casting of this hex is still in effect, the previous effect ends" | Casting it again ends the old one | `endsPrevious` with `slug: nudge-fate`: the caster's earlier effect of that slug, on anyone, ends as the new one is made | ✅ | Cast on ZZ, then on Leo: **ZZ 0, Leo 1** |

### VS-85 · Runic Weapon

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-85a | "The target becomes a +1 striking weapon , gaining a +1 item bonus to attack rolls and increasing the number of weapon damage dice to two" | The chosen weapon's Strikes: +1 to hit, two dice | pf2e's *Spell Effect: Runic Weapon* (`ItemAlteration` potency and striking), `atCastRank`; its weapon ChoiceSet answered `preselect: { weapon: "$held" }` — the target's one held weapon; with two, pf2e asks | ✅ | Leo holding a longsword: no prompt; its Strike **+0 → +1**, **1d8 → 2d8** (runes +1/striking). Holding a longsword and a dagger: pf2e's "Select a weapon" with both |
| VS-85b | "Heightened (6th) The weapon is +2 greater striking" | Rank 6: +2, three dice | pf2e's alteration at level 6 | ✅ | Rank 6: **+2**, **3d8** |
| VS-85c | "Heightened (9th) The weapon is +3 major striking" | Rank 9: +3, four dice | pf2e's alteration at level 9 | ✅ | Rank 9: **+3**, **4d8** |

### VS-86 · Infuse Vitality

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-86a | "The number of targets is equal to the number of actions you spent casting this spell" | One, two or three targets by the actions spent | `targetsPerAction` with no `actionVariants` (`actionVariant`, cast stage 8): the targets are the actions spent; more than the spell's most (`mostActions`, "1 to 3" → 3) is refused | ✅ | Two targeted (Leo, Aries): cast, **both** got the effect. Four targeted: refused — **nothing posted** (the cast stage returned false). One: Leo only |
| VS-86b | "Each target's unarmed and weapon Strikes deal an extra 1d4 vitality damage" | +1d4 vitality on their Strikes | pf2e's *Spell Effect: Infuse Vitality* (`DamageDice` on `strike-damage`), `atCastRank` | ✅ | Leo's longsword: **1d8 slashing → 1d8 slashing + 1d4 vitality** |
| VS-86c | "If you have the holy trait, you can add that trait to this spell and to the Strikes affected by the spell" | A holy caster may make the Strikes holy | pf2e's `AdjustStrike` adds holy, predicated on `parent:origin:trait:holy` — read from the caster as the effect carries no stored origin options | ✅ | Aries without holy: Strike traits *attack*; with holy (a roll option): **attack, holy**. The holy caster's Strikes take it whenever cast — pf2e makes the "can" automatic |
| VS-86d | "Heightened (3rd) The damage increases to 2d4 damage" | Rank 3: 2d4 | pf2e's dice by `@item.level` | ✅ | Rank 3: **2d4** vitality; rank 5: **3d4** |

### VS-87 · Moon Frenzy

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-87a | "Targets gain 5 temporary Hit Points, a +10-foot status bonus to their Speeds, and weakness 5 to silver" | All three | pf2e's *Spell Effect: Moon Frenzy* (`TempHP`, land `FlatModifier`, `Weakness` silver), `atCastRank`; `addRules`: a status +10 to `all-speeds` | ✅ | Leo: **temp HP 5**, land 25 → **35**, fly 20 → **30**, **weakness silver 5** |
| VS-87b | "The fangs deal 2d8 piercing damage; the claws deal 2d6 slashing damage and have the agile and finesse traits" | Two new Strikes | pf2e's two `Strike` rules | ✅ | Leo: **Fangs 2d8 piercing**, **Claw 2d6 slashing** with agile, finesse, unarmed |
| VS-87c | "The targets use their highest weapon or unarmed attack proficiency with these attacks" | Their best proficiency | pf2e's `Strike` rules are unarmed, so they use the unarmed proficiency | ⚠️ | Leo's unarmed is his best proficiency (master; weapons untrained), so his Strikes are right. **Gap:** a creature better with weapons than unarmed attacks rolls these at its unarmed proficiency |
| VS-87d | "On a critical hit with one of these unarmed attacks, the creature struck takes 1d4 persistent bleed damage" | Bleed on a critical hit | pf2e's `DamageDice` bleed, `critical: true`, on the two Strikes | ✅ | Fangs critical: **(2 × (2d8 + 2)) piercing + 1d4 bleed** |
| VS-87e | "The targets can't use concentrate actions unless those actions also have the rage trait, with the exception of Seek" | Their concentrate actions are refused, Seek and rage excepted | `forbids: [concentrate]`, `forbidsExcept: { traits: [rage], slugs: [seek] }` (`forbids.mjs`): a cast stage and the action wrap | ✅ | In the frenzy, Aries casting *Guidance* (concentrate): **refused**; an action with concentrate: **refused**; one with concentrate and rage: **posted**; pf2e's *Seek* (concentrate, secret): **posted** |
| VS-87f | "A creature can attempt to end the spell's effect on itself by using a single action, which has the rage trait, to attempt a Will save against your spell DC" | An action to save its way out | `originAction` with `holder: true`, traits `[rage]`, `spends: false`: a Will `save` at the spell's DC (baked); success or better `expire`s the effect | ✅ | Each target got **Shake Off the Moon Frenzy**. Leo used it: Will vs **DC 34**, a critical failure — still frenzied; again, a critical success — **Leo's effect gone**, Aries's untouched |
| VS-87g | "If a target is in the light of a full moon, it also grows by one size if it were Medium or smaller" | — | | — | Nothing to automate: the moon is the GM's |
| VS-87h | "Heightened (6th) The temporary Hit Points increase to 10, the silver weakness to 10, and the damage dealt by the attacks to three dice" | Rank 6's numbers | pf2e's values by `@item.level` | ✅ | Rank 6: **temp HP 10**, **silver 10**, Fangs **3d8**, Claw **3d6** |

### VS-88 · Evil Eye

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-88a | "The target becomes Sickened 1 if it fails a Will save (or sickened 2 on a critical failure)" | Sickened 1 or 2 | `content/vanilla/evil-eye.json`: failure sickened 1, critical failure sickened 2; either, a Sustained effect (1 minute) with `floor: { slug: sickened, value: 1 }` | ✅ | ZZ Victim's Will from the card's row, a natural 20 (a failure vs DC 34): **sickened 1** and the Sustained *evil eye*; a natural 1 on a new cast: **sickened 2** |
| VS-88b | "This condition value can't be reduced below 1 while the spell is active and you can see the target" | Retching or anything else can't take it below 1 while the hex is Sustained | `floor` (`scripts/riders/condition-floor.mjs`): `preUpdateItem` clamps the value, `preDeleteItem` refuses the removal, while the caster can see the holder | ✅ | At 1: pf2e's decrease — **held at 1**; deleting the condition — **held**. Aries blinded: the decrease took it to **0**. From 2: down to 1, then **held at 1**. The effect gone (the spell over): the decrease took it to **0** |

## Batch 9 — Limits and summons

### VS-89 · Unfettered Movement

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-89a | "the target ignores effects that would give them a circumstance penalty to Speed" | Circumstance penalties to its Speed don't apply | pf2e's *Spell Effect: Unfettered Movement* (`AdjustModifier` suppressing circumstance penalties on `land-speed`); `addRules`: the same on `all-speeds` | ✅ | Leo with a −10 circumstance penalty to every Speed: land 15, fly 10. After the spell: **land 25, fly 20** |
| VS-89b | "When they attempt to Escape an effect that has them Immobilized, Grabbed, or Restrained, they automatically succeed unless the effect is magical and of a higher rank than the unfettered movement spell" | Its Escape succeeds without a roll, unless the hold is magic of a higher rank | `unfettered` (`scripts/riders/unfettered.mjs`): a check stage raises a failed `action:escape` check to a success unless it carries `escape:magical-rank:<n>` above the cast's rank; this module's Escape adds `action:escape` and the holding spell's rank (`holdOption`) | ✅ | An Athletics check with `action:escape`, 25 vs DC 45: **critical failure → success**; with a rank-4 magical hold, success; with a rank-9 one, **stays a critical failure**; without `action:escape`, untouched. Tangle Vine (a cantrip, rank 10 from a level-20 caster) on Leo with Unfettered at rank 4: Leo's granted Escape critically failed and **held** (the hold is the higher rank); with Unfettered at rank 10: "Leo breaks free of Drive: Tangle Vine" — **critical failure → success**, the effect gone |

### VS-90 · Planar Tether

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-90a | "the spell attempts to counteract any teleportation effect that would move the target" | A teleport on it rolls a counteract first, and is stopped on a success | `tether` (`scripts/riders/tether.mjs`): before a `teleport` rider moves its holder by a spell with the teleportation trait — and before `moveCaster` moves a caster by one (*Translocate*) — the tether's caster rolls spellcasting against that spell's DC; rank +1/+3/−1 by degree against the spell's rank | ✅ | Aries tethered (rank 4) casting *Translocate* (rank 4, teleportation): counteract a success — "holds Aries in place", **not moved**; a failure — "fails to hold", **moved**. ZZ tethered, a copy of *Hydraulic Push* given the teleportation trait: a critical success — **not moved**; a failure — **moved 10 ft**. The plain *Hydraulic Push*: moved, **no check** |
| VS-90b | "or any effect that would transport it to a different plane" | *Banishment* on it is counteracted the same way | The same check before a `banish` rider | ✅ | A tethered stand-in critically failed against *Banishment* (rank 5): counteract a critical success (46 vs 34) — "holds … in place", the token **stayed**; a critical failure (32) — "fails to hold", **banished**. (Banishment's critical-failure note still posts when the tether holds — that note is its own rider) |
| VS-90c | "Success The effect's duration is 1 minute" | One minute | `content/vanilla/planar-tether.json`: success, a 1-minute tether | ✅ | Leo, Will 37 vs 34: **1 minute** |
| VS-90d | "Failure The effect's duration is 10 minutes" | Ten | failure, 10 minutes | ✅ | ZZ, a natural 20 (20 vs 34, a failure): **10 minutes**; Leo 32 vs 34: **10 minutes** |
| VS-90e | "Critical Failure The effect's duration is 1 hour" | An hour | critical failure, 1 hour | ✅ | ZZ, a natural 1: **1 hour** |
| VS-90f | "Critical Success The target is unaffected" | Nothing | no rider on a critical success | ✅ | Leo, a natural 20 (42): **no tether** |

### VS-91 · Blur

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-91a | "It becomes Concealed" | An attack on it rolls a DC 5 flat check first; a failure misses | `content/vanilla/blur.json`: *concealed* for 1 minute; a check gate (`unobserved.mjs`, "an attack on a concealed creature") rolls the DC 5 flat check before any attack on a concealed target | ✅ | Leo: an effect *Blur: Concealed* (1 minute) with the condition. The Ghoul's Claw at Leo: flat check **3** — "the DC 5 flat check fails, and the attack misses", **no attack rolled**; **12** — "succeeds", the attack rolled. Concealed gone: the Claw rolled with no check |
| VS-91b | "the target can't use this concealment to Hide or Sneak" | — | | — | Nothing to automate: Hide and Sneak are the table's |

### VS-92 · Silence

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-92a | "The target can't use sonic attacks, nor can it use actions with the auditory trait" | Its auditory actions are refused | pf2e's *Spell Effect: Silence* (`emitsSound` false); `forbids: [cast, auditory]` (`forbids.mjs`, any trait now) | ✅ | Aries silenced: `emitsSound` **false**; an action with the auditory trait — **refused**; a plain action — posted |
| VS-92b | "This prevents it from casting spells due to the magical words involved in casting, with the exception of subtle spells" | Its casts are refused unless the spell is subtle | `forbidsExcept: { traits: [subtle] }` on `cast` | ✅ | Silenced, Aries casting *Guidance* — **refused**; casting *Silence* (subtle) — **cast**. The effect gone: *Guidance* cast |
| VS-92c | "The target makes no sound, preventing creatures from noticing it using hearing alone" | — | | — | Nothing to automate: noticing by hearing is the table's |
| VS-92d | "Heightened (4th) The spell creates an aura in a 10-foot emanation around the touched creature" | Rank 4: everyone within 10 ft of it is silenced too, moving with it | pf2e's `Aura` at level 4 copies the effect within 10 ft; `forbidsOf` gives the copy the forbids of the effect radiating it | ✅ | Rank 4 on Aries, Leo in the same square: Leo got *Spell Effect: Silence* from the aura, **silent**, Leo's auditory action **refused**. Leo moved 30 ft away: the copy **gone**, the action posted |

### VS-93 · Summon Animal

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-93a | "You summon a creature that has the animal trait and whose level is –1 to fight for you" | The cast offers animals of level –1 from pf2e's bestiaries and places the chosen one within 30 ft, a minion of the caster | `areaTargeting.summon: { traits: [animal] }` (`scripts/targeting/summon.mjs`): the placement is a 5-ft square within 30 ft (snapped, refused when occupied); after the cast a list of common creatures with the traits from pf2e's Monster Cores; the active GM imports the one chosen into *Summoned*, puts an unlinked token there (minion, summoned, the caster's owners) and gives the caster a Sustained effect for it — gone, the creature goes; the creature gone, the effect ends | ✅ | Rank 1: "Which creature? (level -1 at most)" — 9 animals (Compsognathus, Eagle, … Trilobite); the Guard Dog: **level −1, traits animal, minion, summoned**, owned as Aries, the Sustained 1-minute effect and *Sustain Drive: Summon Animal* on Aries. The effect deleted: "Guard Dog is gone.", the token too |
| VS-93b | "Heightened As listed in the summon trait" | The level allowed grows with the rank (1 at 2nd, 2 at 3rd, 3 at 4th, 5 at 5th…) | `SUMMON_LEVELS`: the summon trait's table (−1, 1, 2, 3, 5, 7, … 15) | ✅ | Rank 2: **35** animals, Camel (1) … Viper (−1); the Wolf (level 1) on the snapped square |

### VS-94 · Final Sacrifice

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-94a | "The target is immediately slain" | Only a minion the caster summoned can be chosen; it dies | `sacrifice` (`scripts/vanilla/sacrifice.mjs`): the cast stage "a minion sacrificed" (6) needs one target the caster summoned; after the cast the minion is slain and its token goes | ✅ | At Leo: **refused**, nothing posted. At Aries' summoned Wolf: cast, "Wolf is slain.", its token and Aries' effect for it **gone** |
| VS-94b | "the explosion deals 6d6 fire damage to creatures within 20 feet of it with a basic Reflex save" | A 20-ft emanation from the minion, basic Reflex against 6d6 fire | `areaTargeting` with an origin resolver: pf2e's 20-ft emanation measured from the minion; pf2e's basic Reflex and 6d6 | ✅ | Targets: every creature within 20 ft of the **Wolf** — one 20 ft from it (30 ft from Aries) caught, one 25 ft from it (15 ft from Aries) not. The card: **6d6 fire**, basic Reflex |
| VS-94c | "If the target has the cold or water trait, the spell deals cold damage and has the cold trait instead of the fire trait" | A cold or water minion makes it cold | `sacrifice.element: { cold: cold, water: cold }`: a variant with the damage and the trait retyped, kept on the card (`casting.embeddedSpell`) so its damage rolls the same | ✅ | A Wolf given the water trait: the card **Cold** in its traits, damage **8d6 cold** (rank 3). (The first try retyped only the cast: pf2e rebuilt the card's spell from Aries' own item and rolled fire — the card now carries the retyped spell) |
| VS-94d | "Attempting to cast this spell targeting a creature that you temporarily seized control of" | — | | — | Nothing to automate: nothing here seizes control of a creature |
| VS-94e | "The damage increases by 2d6" | Rank 3: 8d6 | pf2e's heightening (+2d6 a rank) | ✅ | Rank 3: **8d6**; rank 2: **6d6** |

## Batch 10 — Senses and light

### VS-95 · Darkvision

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-95a | "You gain Darkvision" | The caster has darkvision, and its token sees in darkness | pf2e's *Spell Effect: Darkvision* (`Sense` darkvision) on the caster, below rank 3 | ⚠️ | Rank 2: Aries' effect (1 hour); `hasDarkvision` **false → true**. **Not observed:** the token's vision — pf2e turns senses into token vision only under its rules-based vision setting, which this world has off (the token stayed *basic*) |
| VS-95b | "Heightened (3rd) The spell's range is touch and it targets 1 willing creature" | Rank 3: another creature | `content/vanilla/darkvision.json`: from rank 3 the effect goes on the target, not the caster | ✅ | Rank 3 with Leo targeted: **Leo** got the effect (1 hour), Aries none |
| VS-95c | "The duration is until the next time you make your daily preparations" | Rank 5 lasts until the next preparations | From rank 5, no timer and `untilPreparations` (`scripts/riders/preparations.mjs`): ends when the caster Rests for the Night | ✅ | Rank 5 on Leo: duration **unlimited**, `untilPreparations` = Aries. (The rest itself is pf2e's `pf2e.restForTheNight`; the ending is covered by a test) |

### VS-96 · See the Unseen

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-96a | "You can see invisible creatures as though they weren't invisible, although their features are blurred, making them Concealed" | Invisible creatures show to the caster's token, and count as concealed to it | pf2e's *Spell Effect: See the Unseen* (`Sense` see-invisibility); the concealed gate (`reveal.mjs` `concealment`) counts an invisible target as concealed to an attacker with that sense | ✅ | Aries' senses gained **see-invisibility**. Aries' Strike at invisible ZZ: "concealed: the DC 5 flat check fails, and the attack misses" (a 3), **not rolled**; without the spell, no check. (Showing the token is pf2e's under rules-based vision, off in this world) |
| VS-96b | "Subtler clues also grant you a +2 status bonus to checks you make to disbelieve illusions" | +2 to disbelieve | pf2e's `FlatModifier` +2 status to Perception and Will, predicated on `illusion` | ✅ | Aries' Will: **+22**; against an illusion: **+24** |
| VS-96c | "You can also see incorporeal creatures, like ghosts, phased through an object from within 10 feet" | — | | — | Nothing to automate: a creature inside an object is the GM's |
| VS-96d | "Heightened (5th) This spell has a duration of 8 hours" | Rank 5 lasts 8 hours | A rider with `duration` 8 hours from rank 5 | ✅ | Rank 5: **8 hours** |

### VS-97 · Revealing Light

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-97a | "A creature affected by revealing light is Dazzled" | Dazzled | `content/vanilla/revealing-light.json`: a written-out effect granting pf2e's *Dazzled* (`GrantItem`), `reveals` | ✅ | ZZ, Leo and Libra in the 10-ft burst: each **dazzled**; the effects removed, the dazzled with them |
| VS-97b | "If the creature was Invisible, it becomes Concealed instead" | An invisible creature becomes concealed and can be seen | `reveals` (`scripts/riders/reveal.mjs`): the *revealed* detection mode on every seeing token sees a revealed creature, through hidden/undetected/unnoticed when it is invisible; the concealed gate counts it concealed | ✅ | ZZ invisible and undetected: Aries' basic sight **no**, revealed mode **no**. Revealed: basic sight still no, revealed mode **yes**. Aries' Strike at it: "concealed: the DC 5 flat check fails" — not rolled |
| VS-97c | "If the creature was already concealed for any other reason, it is no longer concealed" | Its concealment (*Blur*, *Mist*) no longer counts | `concealment`: a revealed creature counts as concealed only for its invisibility | ✅ | Leo concealed (Blur) and revealed: Aries' Strike **rolled, no check**. The light gone: the DC 5 check again |
| VS-97d | "Success The light affects the creature for 2 rounds" | Two rounds | success: 2 rounds | ✅ | Leo, 12 — success: **2 rounds** |
| VS-97e | "Failure The light affects the creature for 1 minute" | A minute | failure: 1 minute | ✅ | Libra, 8 — failure: **1 minute** |
| VS-97f | "Critical Failure The light affects the creature for 10 minutes" | Ten minutes | critical failure: 10 minutes | ✅ | ZZ, a natural 1: **10 minutes** |

### VS-98 · Light

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-98a | "You create an orb of light that sheds bright light in a 20-foot radius (and dim light for the next 20 feet)" | A light placed within 120 ft: bright 20 ft, dim 40 ft | `areaTargeting.lightOrb` (`scripts/targeting/light-orb.mjs`): a square within 120 ft; on an empty one, an ambient light bright 20 / dim 40 | ✅ | A level-1 NPC caster (rank 1): an ambient light **bright 20, dim 40** on the square |
| VS-98b | "in a color you choose" | The cast asks for a colour | After the cast, a colour picker | ✅ | Asked each cast; the light took **#ff8800**, #0000ff, #ff00ff … as chosen |
| VS-98c | "If you create the light in the same space as a willing creature, you can attach the light to the creature, causing it to float near that creature as it moves" | Placed on a creature, it follows its token | On a creature's square — the targeted one where several share it — pf2e's `TokenLight` on an effect on it, so it moves with the token | ✅ | Placed on Leo's square (thirteen tokens share it), Leo targeted: "Aries hangs an orb of light on Leo" — Leo's token **bright 60, dim 120, #ff0000**. (A token not yet drawn reported 0, 0 to the occupancy test; it now reads the document's position — Translocate and Summon Animal use the same test) |
| VS-98d | "You can Sustain the spell to move the light up to 60 feet; you can attach or detach it from a creature as part of this movement" | Sustain moves it up to 60 ft, onto or off a creature | *Move the Light* (an action the caster gets, aimed again): within 60 ft of where the light is; onto a creature attaches, onto an empty square sets it down | ✅ | An orb on Aries: aimed 70 ft away — **refused**, still attached; to an empty square — an **ambient light** there, Aries unlit; back onto Aries' square — **attached again** |
| VS-98e | "You can Dismiss the spell" | Dismissing it puts the light out | A *Dismiss* for the caster's effect; its deletion clears the light and the actions | ✅ | Dismissed: the orb's effect, its light, *Move the Light* and *Dismiss* **all gone** |
| VS-98f | "If you Cast the Spell while you already have four light spells active, you must choose one of the existing spells to end" | A fifth asks which of the four to end | `max: 4`: a fifth asks which to end, each named by where it is | ✅ | With four up, the fifth asked "You already have 4 lights: which one ends?" — *The light at (3450, 2750)*, *(3350, 2250)* …; the one chosen **went out**, its actions with it, and the new one was set down |
| VS-98g | "Heightened (4th) The orb sheds light in a 60-foot radius (and dim light for the next 60 feet)" | Rank 4: 60 and 120 ft | `atRank: { 4: { bright: 60, dim: 120 } }` | ✅ | Aries (level 20: the cantrip at rank 10): **bright 60, dim 120**; the rank-1 NPC: 20/40 |

### VS-99 · Detect Magic

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-99a | "You send out a pulse that registers the presence of magic" | The caster is told whether magic is within 30 ft | | ☐ | |
| VS-99b | "You receive no information beyond the presence or absence of magic" | Nothing more at rank 1 | | ☐ | |
| VS-99c | "You can choose to ignore magic you're fully aware of, such as the magic items and ongoing spells of you and your allies" | The caster's and allies' own magic items and effects can be left out | | ☐ | |
| VS-99d | "You detect illusion magic only if that magic's effect has a lower rank than the rank of your detect magic spell" | An illusion of equal or higher rank isn't found | | ☐ | |
| VS-99e | "Heightened (3rd) You learn the rank or level of the most powerful magical effect the spell detects" | Rank 3 names the highest rank or level | | ☐ | |
| VS-99f | "Heightened (4th) As 3rd rank, but you also pinpoint the source of the highest-rank magic" | Rank 4 names where it is | | ☐ | |

### VS-100 · Vital Beacon

| ID | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| VS-100a | "Once per round, either you or an ally can use an Interact action to supplicate and lay hands upon you to regain Hit Points" | The caster or an adjacent ally can take the beacon's healing, once a round | | ☐ | |
| VS-100b | "Each time the beacon heals someone, it decreases in strength" | d10s, then d8s, then d6s, then d4s, one die per rank | | ☐ | |
| VS-100c | "after which the spell ends" | After the fourth healing it's gone | | ☐ | |
| VS-100d | "You can have only one vital beacon active at a time" | A second beacon ends the first | | ☐ | |
| VS-100e | "The beacon restores one additional die of Hit Points each time it heals, using the same die size as the others for that step" | Rank 5: 5d10, 5d8, 5d6, 5d4 | | ☐ | |

## Counts

| Status | Count |
| :-- | --: |
| ☐ not yet driven | 11 |
| ✅ | 303 |
| ⚠️ | 11 |
| ❌ | 0 |
| 🔧 | 0 |
| — | 11 |
| **Total** | **336** |
