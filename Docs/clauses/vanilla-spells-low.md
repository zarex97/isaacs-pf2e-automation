# Clauses — vanilla spells, the low-match test

*Spell tracker, clausified. Ten pf2e spells the precedent lookup matched poorly — the best precedent for each
shared one pattern or none (`npm run precedent`) — taken as a test of how long a spell takes to automate when
little has been done like it. The mid-match test is `vanilla-spells-mid.md`.*

**Source:** pf2e 8.4.1's own spell text, as the sheet prints it (`npm run index:pf2e` writes it to
`build/data/pf2e-spell-text.json`).

## How a row is marked

| Mark | Meaning |
| :-- | :-- |
| ☐ | Not yet driven |
| ✅ | Driven live; the clause happened by itself |
| ⚠️ | Driven live; partially happens — the gap is named in **Evidence** |
| ❌ | Driven live; does not happen |
| 🔧 | Was ❌ or ⚠️, a fix has landed, awaiting re-drive |
| — | Nothing to automate (pure roleplaying / GM ruling) |

**Clause** is a verbatim fragment of the spell's text; `npm test` asserts it still is one. **Patterns** tags the
clause from `Docs/patterns.md`. **Must happen** is what the drive has to see. **Static check** names what guards
it offline; **Evidence** names what proved it in world `pf`. Clause IDs are the spell's ID and a letter.

## The spells

| ID | Spell | Rank | Gist |
| :-- | :-- | :-- | :-- |
| VS-112 | `cone-of-cold` | 5 | A cone from the caster, a basic save |
| VS-113 | `shattering-gem` | 1 | A gem that takes a Strike first, then bursts on its breaker |
| VS-114 | `gecko-grip` | 2 | A climb Speed, longer from a rank |
| VS-115 | `ghoulish-cravings` | 2 | Sickened held at a floor until something is eaten |
| VS-116 | `coral-scourge` | 3 | Clumsy that climbs each turn to paralysis, scraped off by an action |
| VS-117 | `wilding-word` | 1 | A penalty to harm the caster, sickened for each hurt |
| VS-118 | `take-root` | 1 | DCs raised against Shove, Disarm and Trip |
| VS-119 | `ant-haul` | 1 | More Bulk before encumbered |
| VS-120 | `magnetize` | 4 | Metal attacks drawn to a creature |
| VS-121 | `song-of-strength` | 1 | Allies around the caster, better at Athletics |

**Where it stands:** 35 clauses — 32 ✅, 3 ⚠️. The ⚠️ are table notes: Take Root's saves for a held item, and whether a weapon Magnetize draws is metal. The card marks each attack it could touch.

### VS-112 · Cone of Cold

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-112a | "Icy cold rushes forth from your hands" | when:cast · reach:area/cone | A 60-ft cone aimed from the caster's edge | `cone-of-cold.json` | ✅ | Aimed live from the caster's south edge: the patient 5 ft south was caught. Control: the Target 5 ft east, outside the cone's facing, was not |
| VS-112b | "You deal 12d6 cold damage to creatures in the area" | check:basic-save · effect:damage | Each creature caught rolls a basic Reflex save against 12d6 cold | `cone-of-cold.json` | ✅ | Failed basic Reflex (die 10 vs DC 13): 12d6 cold rolled 33, the patient 50 → 17. pf2e's own basic save; the module only aims |
| VS-112c | "Heightened (+1) The damage increases by 2d6" | scaling:dice-per-rank · effect:damage | Rank 6 deals 14d6 | `cone-of-cold.json` | ✅ | Rank 6 card rolled `14d6 cold`. Control: rank 5 rolled `12d6 cold` |

### VS-113 · Shattering Gem

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-113a | "A large gem floats around the target in an erratic pattern" | when:cast · reach:single | The target carries the gem for 1 minute | `shattering-gem.json` · `riders/guardian.mjs` | ✅ | The patient carries `Shattering Gem: shattering gem`, 1 minute. Control: nothing before the cast |
| VS-113b | "The gem has 5 Hit Points" | effect:barrier | The gem's Hit Points are kept and shown | `shattering-gem.json` · `riders/guardian.mjs` | ✅ | The effect holds `guardian.hp` 5; a block posts "5 Hit Points left" |
| VS-113c | "Each time a creature Strikes the target, the target attempts a flat" | when:strike-received · check:flat-check | Each Strike at the target rolls the flat check first | `shattering-gem.json` · `riders/guardian.mjs` | ✅ | Each Strike that damaged the patient posted a DC 11 flat check. Control: the same Strike with no gem posted none |
| VS-113d | "On a success, the gem blocks the attack, so the attack first damages the gem and then applies any remaining damage to the target" | effect:intercept · effect:damage-reduced | On a success the gem's Hit Points take the damage first; the rest reaches the target | `shattering-gem.json` · `riders/guardian.mjs` | ✅ | Club for 5, flat 15: the gem took 5, the patient stayed at 50 (rank 2: gem 10 → 5). Flat 8: the patient 50 → 47, gem untouched. Control: no gem, 50 → 45 |
| VS-113e | "If the gem is reduced to 0 Hit Points, it shatters, immediately dealing 1d8 slashing damage (basic Reflex save) to the creature that destroyed it, as long as that creature is within 10 feet of the target" | reach:attacker · check:basic-save · effect:damage · ending:zero-hp | At 0 the gem ends, and its breaker within 10 ft rolls a basic Reflex save against 1d8 slashing | `shattering-gem.json` · `riders/guardian.mjs` | ✅ | At 0 the gem ended; the adjacent breaker saved Reflex DC 13, succeeded, took 3 of a 1d8 (half). Control: Capricorn breaking it from 20 ft took nothing |
| VS-113f | "Heightened (+1) The gem has 5 additional Hit Points, and the damage dealt by its detonation increases by 1d8" | scaling:dice-per-rank · effect:barrier · effect:damage | Rank 2: 10 Hit Points and 2d8 | `shattering-gem.json` · `riders/guardian.mjs` | ✅ | Rank 2: `hp` 10, burst `2d8`. Control: rank 1, 5 and `1d8` |

### VS-114 · Gecko Grip

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-114a | "The target gains a climb Speed equal to its Speed" | when:cast · reach:single · effect:speed | The target has a climb Speed equal to its land Speed | `gecko-grip.json` | ✅ | Climb Speed 25 = land 25. Control: none before, none after the effect went |
| VS-114b | "Heightened (5th) The duration increases to 1 hour" | scaling:from-rank · ending:duration | From rank 5 the effect lasts an hour | `gecko-grip.json` | ✅ | Rank 5: 1 hour. Control: rank 2, 10 minutes |

### VS-115 · Ghoulish Cravings

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-115a | "The target must attempt a Will save" | when:cast · reach:single · check:save | The target saves from the card | `ghoulish-cravings.json` · `floor.sight: false` | ✅ | Rolled from the card's target row, forced to each degree |
| VS-115b | "Critical Success The target is unaffected" | check:save | Nothing | `ghoulish-cravings.json` · `floor.sight: false` | ✅ | Critical success: nothing. Control: success left sickened 1 |
| VS-115c | "Success The target is Sickened 1 by its unbidden hunger" | check:save · effect:condition | Sickened 1 | `ghoulish-cravings.json` · `floor.sight: false` | ✅ | Sickened 1, and lowering it reached 0 — no floor on a success |
| VS-115d | "Failure The target is Sickened 2 and can't reduce this condition below sickened 1 until it first consumes some raw meat" | check:save · effect:condition · effect:condition-floor | Sickened 2, held at 1 or more until the meat | `ghoulish-cravings.json` · `floor.sight: false` | ✅ | Sickened 2; lowered twice it held at 1. Control: the success's sickened 1 lowered to 0 |
| VS-115e | "if the creature doesn't have access to raw meat, it can take a bite out of a corpse within reach as an Interact action" | economy:granted-action | An action that eats, ending the floor | `ghoulish-cravings.json` · `floor.sight: false` | ✅ | `Eat raw meat` (1 action, manipulate) on the patient; after it, sickened 2 → 1 → 0 and the action left 10 s later. Control: without eating it held at 1 |
| VS-115f | "Critical Failure As failure, but the target can't reduce the condition below sickened 2 until it consumes raw meat" | check:save · effect:condition · effect:condition-floor | Sickened 2, held at 2 | `ghoulish-cravings.json` · `floor.sight: false` | ✅ | Sickened 2; lowered twice it held at 2 |

### VS-116 · Coral Scourge

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-116a | "Critical Success The target is unaffected" | check:save | Nothing | `coral-scourge.json` · `expire.granting` | ✅ | Critical success: nothing, no Scrape |
| VS-116b | "Success The target is Clumsy 1" | check:save · effect:condition | Clumsy 1 | `coral-scourge.json` · `expire.granting` | ✅ | Clumsy 1 for 1 minute; the next turn start left it at 1. Control: a failure climbed |
| VS-116c | "The target can Interact to scrape the coral growths from its body, decreasing the clumsy condition to 0 and ending the spell" | economy:granted-action · effect:condition-removed | An Interact action that clears the clumsy and ends the spell | `coral-scourge.json` · `expire.granting` | ✅ | `Scrape off the coral` cleared clumsy and the spell's effect |
| VS-116d | "Failure The target is Clumsy 2" | check:save · effect:condition | Clumsy 2 | `coral-scourge.json` · `expire.granting` | ✅ | Clumsy 2 |
| VS-116e | "Each round at the beginning of its turn, the target becomes clumsy 1 or increases its clumsy condition by 1, to a maximum of 4" | when:turn-start · effect:condition-climbs | Clumsy rises by 1 at each of its turn starts, to 4 | `coral-scourge.json` · `expire.granting` | ✅ | Clumsy 2 → 3 → 4 at the patient's turn starts. Control: the success did not climb |
| VS-116f | "If the target's clumsy condition caused by coral scourge reaches 4, the growths spread to cover the target's entire body, and the target becomes Paralyzed" | effect:condition-climbs · effect:condition | At clumsy 4, paralyzed | `coral-scourge.json` · `expire.granting` | ✅ | At 4: paralyzed (and off-guard); a further turn stayed at 4. Scrape was then refused — paralyzed, which is the rule |
| VS-116g | "Critical Failure As failure, but when the target Interacts to scrape the coral growths from its body, it reduces its clumsy condition by 1, instead of decreasing it to 0, and decreasing the clumsy condition to 0 doesn't end the spell" | check:save · economy:granted-action · effect:condition-climbs | Scraping lowers clumsy by 1 and never ends the spell | `coral-scourge.json` · `expire.granting` | ✅ | Scrape lowered 2 → 1 → 0, the spell's effect stayed, the next turn start gave clumsy 1. Control: on a success Scrape ended the spell |

### VS-117 · Wilding Word

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-117a | "The target must attempt a Will save; if the creature is an animal, fungus, or plant, it takes a –1 circumstance penalty to its save" | when:cast · reach:single · reach:filtered · check:save · effect:penalty | The save; −1 for an animal, fungus or plant | `wilding-word.json` | ✅ | An animal Target's Will save: die 10, `Wilding Word −1`, 9 against DC 13. A fungus: the same −1. Control: with neither trait, 10 and no modifier |
| VS-117b | "Critical Success The target is unaffected" | check:save | Nothing | `wilding-word.json` | ✅ | Critical success: no effect on either side. Control: success gave both |
| VS-117c | "Success When the target attempts an attack roll or skill check that would harm you, it takes a -2 status penalty to its roll" | check:save · effect:penalty · ending:duration | −2 status to its attacks on the caster for the minute | `wilding-word.json` | ✅ | The target's Club at the caster carried `wilding word -2`. Control: the same Club at the Target carried none |
| VS-117d | "Failure As success, but the target also becomes Sickened 1 each time it damages you" | when:damage-dealt · effect:condition | Each time it damages the caster, sickened 1 | `wilding-word.json` | ✅ | Damaging the caster gave sickened 1. Control: damaging the Target first left 0; on a success damaging the caster left 0 |
| VS-117e | "Critical Failure As failure, but the sickened value is 2" | check:save · effect:condition | As failure, sickened 2 | `wilding-word.json` | ✅ | Damaging the caster gave sickened 2 |

### VS-118 · Take Root

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-118a | "The targeted creature gains a +1 circumstance bonus to their Fortitude DC against attempts to Shove them and a +1 circumstance bonus to their Reflex DC against attempts to Disarm or Trip them" | when:cast · reach:single · effect:bonus | Fortitude DC +1 against Shove, Reflex DC +1 against Disarm and Trip | `take-root.json` | ✅ | Shove, Trip and Disarm DCs against the patient 10 → 11. Control: its plain Fortitude and Reflex DCs stayed 10 |
| VS-118b | "This bonus also applies to saving throws against spells or effects that would attempt to remove a held item from their grasp" | effect:bonus · effect:gm-note | A note: the bonus on such saves is the table's | `take-root.json` | ⚠️ | A note on the card, "Left to the table". No save says it would take a held item, so nothing can apply the +1 by itself |

### VS-119 · Ant Haul

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-119a | "The target can carry 3 more Bulk than normal before becoming Encumbered and up to a maximum of 6 more Bulk" | when:cast · reach:single · effect:resource-max | Encumbered 3 Bulk later; maximum 6 Bulk higher | `ant-haul.json` | ✅ | Encumbered after 5 → 8 Bulk, maximum 10 → 16. Control: 5 and 10 once the effect went |

### VS-120 · Magnetize

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-120a | "Whenever a creature makes a ranged attack with a metal weapon or projectile against a creature within 15 feet of the magnetized target, the magnetized target becomes the target of the attack instead" | when:strike-made · reach:filtered · effect:gm-note | A ranged attack near the magnetized creature is marked on its card | `magnetize.json` | ⚠️ | A javelin thrown at the patient, 5 ft from the magnetized Target, carried "If this weapon or projectile is metal, the attack goes to ZZ Conditions Target instead". Control: at D2, 135 ft away, and at the Target itself, no note. Whether it is metal is the table's: pf2e records a material on 43 of its 1,013 weapons |
| VS-120b | "Whenever a creature within 15 feet Strikes a creature other than the magnetized target with a metal melee weapon, the attacker takes a –2 circumstance penalty to the attack roll" | when:strike-made · reach:filtered · effect:penalty · effect:gm-note | A melee Strike from near it, at anyone else, is marked on its card | `magnetize.json` | ⚠️ | The patient's Club at the caster, from 5 ft of the Target, carried the −2 note. Control: the same Club at the Target, D2's fist from 135 ft, and the Club after the effect ended, none. The table applies the −2, knowing the weapon |

### VS-121 · Song of Strength

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-121a | "You and your allies gain a +1 status bonus to Athletics checks and to their DCs against Athletics skill actions such as Disarm, Reposition, Shove, and Trip" | when:cast · reach:area/emanation · reach:allies · effect:bonus | Everyone allied in the 60-ft emanation, the caster too, gets the effect | `song-of-strength.json` | ✅ | Aimed live: the caster, the patient and Capricorn (party) went Athletics +1, and Shove/Trip/Disarm DCs 10 → 11. Control: the opposition Target stayed at 0 |
