# Clauses — vanilla spells, the pilot

*Spell tracker, clausified after the fact. The eleven pf2e spells of the vanilla pilot (1.2.0, #7) were
automated and driven before clause trackers existed; this tracker gives them clause rows, so their clauses
can be tagged and found as precedents. Every spell is broken into **clauses**: independently-failable
statements quoted from pf2e's own text, one row each.*

**Source:** pf2e 8.4.1's own spell text, as the sheet prints it (`npm run index:pf2e` writes it to
`build/data/pf2e-spell-text.json`). **Evidence:** the pilot's live drive is recorded in PR #7; a clause it
did not exercise is ☐, whatever the entry does.

## How a row is marked

| Mark | Meaning |
| :-- | :-- |
| ☐ | Not yet driven |
| ✅ | Driven live; the clause happened by itself |
| ⚠️ | Driven live; partially happens — the gap is named in **Evidence** |
| ❌ | Driven live; does not happen |
| 🔧 | Was ❌ or ⚠️, a fix has landed, awaiting re-drive |
| — | Nothing to automate (pure roleplaying / GM ruling) |

**Clause** is a verbatim fragment of the spell's text; `npm test` asserts it still is one. **Patterns** tags
the clause from the closed list in `Docs/patterns.md`. **Static check** names what guards it offline;
**Evidence** names what proved it in world `pf`. Clause IDs are the spell's ID and a letter.

## The spells

| ID | Spell | Rank | Gist |
| :-- | :-- | :-- | :-- |
| VS-101 | `electric-arc` | 1 | A target limit |
| VS-102 | `fear` | 1 | Riders by degree, more targets from a rank |
| VS-103 | `slow` | 3 | Durations by degree |
| VS-104 | `synesthesia` | 5 | An effect with its choice answered, and a condition |
| VS-105 | `command` | 1 | A GM note |
| VS-106 | `calm` | 2 | pf2e's own area, and a GM note |
| VS-107 | `heal` | 1 | A variant with its own area |
| VS-108 | `ice-storm` | 4 | Lingering terrain and a tick |
| VS-109 | `force-barrage` | 1 | Growth every other rank, a legacy alias |
| VS-110 | `daze` | 1 | A condition on a critical failure |
| VS-111 | `frostbite` | 1 | An effect at the cast rank |

### VS-101 · Electric Arc

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-101a | "An arc of lightning leaps from one target to another" | when:cast · reach:up-to-n | Two creatures at most: a third one targeted is asked about, and can be refused | `content/vanilla/electric-arc.json` (`areaTargeting.maxTargets: 2`) | ✅ | PR #7: with three targeted, the cast asked "3 targeted, and it reaches 2. Cast anyway?" and **No** refused it; with two targeted (the control) it cast |
| VS-101b | "Each target takes 2d4 electricity damage with a basic Reflex save" | check:basic-save · effect:damage | Each target rolls a basic Reflex save against 2d4 electricity | Nothing in the entry: pf2e's own damage and basic save | ☐ | Not driven in the pilot: the two-target cast was posted, but no save or damage was recorded |
| VS-101c | "Heightened (+1) The damage increases by 1d4" | scaling:dice-per-rank · effect:damage | Rank 2 deals 3d4 | Nothing in the entry: pf2e's own heightening | ☐ | Not driven in the pilot |

### VS-102 · Fear

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-102a | "You plant fear in the target; it must attempt a Will save" | when:cast · reach:single · check:save | One target, which rolls a Will save from the card | `content/vanilla/fear.json` (`areaTargeting.maxTargets: 1`); the save is pf2e's own | ✅ | PR #7: the Ghoul Soldier rolled its Will save from the card's own button. The one-target limit itself was not tested |
| VS-102b | "Critical Success The target is unaffected" | check:save | Nothing | No rider on `criticalSuccess` | ☐ | Not driven in the pilot |
| VS-102c | "Success The target is Frightened 1" | check:save · effect:condition | Frightened 1 | `riders`: `success` → condition `frightened` 1 | ☐ | Not driven in the pilot: PR #7 lists a Fear success as not driven |
| VS-102d | "Failure The target is Frightened 2" | check:save · effect:condition | Frightened 2 | `riders`: `failure` → condition `frightened` 2 | ☐ | Not driven in the pilot |
| VS-102e | "Critical Failure The target is Frightened 3 and Fleeing for 1 round" | check:save · effect:condition · ending:duration | Frightened 3, and fleeing that ends after one round | `riders`: `criticalFailure` → `frightened` 3; `criticalFailure` → `fleeing` with `duration` 1 round, `expiry: turn-start` | ✅ | PR #7: the Ghoul Soldier critically failed → **frightened 3**, plus a 1-round fleeing effect |
| VS-102f | "Heightened (3rd) You can target up to five creatures" | reach:up-to-n · scaling:targets-per-rank · scaling:from-rank | From rank 3 the cast takes up to five targets | `areaTargeting.heightening.atRank.3.maxTargets: 4` (one, plus four) | ☐ | Not driven in the pilot: Fear's target count was not read |

### VS-103 · Slow

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-103a | "You dilate the flow of time around the target, slowing its actions" | when:cast · reach:single | One target, which saves from the card | `content/vanilla/slow.json` (`areaTargeting.maxTargets: 1`) | ✅ | PR #7: cast on the Ghoul Soldier and on Leo, each saving from the card's own button. The one-target limit itself was not tested |
| VS-103b | "Critical Success The target is unaffected" | check:save | Nothing | No rider on `criticalSuccess` | ☐ | Not driven in the pilot |
| VS-103c | "Success The target is Slowed 1 for 1 round" | check:save · effect:condition · ending:duration | Slowed 1, ending after one round | `riders`: `success` → `slowed` 1, `duration` 1 round, `expiry: turn-start` | ☐ | Not driven in the pilot: PR #7 lists a Slow success as not driven |
| VS-103d | "Failure The target is Slowed 1 for 1 minute" | check:save · effect:condition · ending:duration | Slowed 1 for a minute | `riders`: `failure` → `slowed` 1, `duration` 1 minute | ✅ | PR #7: Leo failed → **slowed 1 for 1 minute** |
| VS-103e | "Critical Failure The target is Slowed 2 for 1 minute" | check:save · effect:condition · ending:duration | Slowed 2 for a minute | `riders`: `criticalFailure` → `slowed` 2, `duration` 1 minute | ✅ | PR #7: the Ghoul Soldier critically failed → **slowed 2 for 1 minute** |
| VS-103f | "Heightened (6th) You can target up to 10 creatures" | reach:up-to-n · scaling:targets-per-rank · scaling:from-rank | From rank 6 the cast takes up to ten targets | `areaTargeting.heightening.atRank.6.maxTargets: 9` (one, plus nine) | ☐ | Not driven in the pilot |

### VS-104 · Synesthesia

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-104a | "This has three effects, and the target must attempt a Will save" | when:cast · reach:single · check:save | One target, which rolls a Will save from the card | `content/vanilla/synesthesia.json` (`areaTargeting.maxTargets: 1`); the save is pf2e's own | ✅ | PR #7: the Ghoul Soldier rolled its Will save from the card's own button |
| VS-104b | "the target must succeed at a flat each time it uses a concentrate action, or the action fails and is wasted" | check:flat-check | Each concentrate action the target uses asks for a flat check, and a failure wastes the action | No `flat-check` rider in the entry; only pf2e's own *Synesthesia* effects | ☐ | Not driven in the pilot; whatever pf2e's effect carries for it was not read |
| VS-104c | "The target's difficulty processing visual input makes all creatures and objects Concealed from it" | effect:concealment | Every creature and object is concealed from the target | Nothing in the entry beyond pf2e's own *Synesthesia* effects | ☐ | Not driven in the pilot |
| VS-104d | "making it Clumsy 3 and giving it a –10-foot status penalty to its Speeds" | effect:condition · effect:speed | Clumsy 3, and −10 ft to every Speed | Nothing in the entry beyond pf2e's own *Synesthesia* effects | ☐ | Not driven in the pilot: the critical failure's effect landed, but its clumsy and Speed penalty were not recorded |
| VS-104e | "Critical Success The target is unaffected" | check:save | Nothing | No rider on `criticalSuccess` | ☐ | Not driven in the pilot |
| VS-104f | "Success The target is affected for 1 round" | check:save · ending:duration | The three effects, for one round | `riders`: `success` → pf2e's *Spell Effect: Synesthesia (Success)* | ☐ | Not driven in the pilot |
| VS-104g | "Failure The target is affected for 1 minute" | check:save · ending:duration | The three effects, for one minute, with no prompt for the effect's choice | `riders`: `failure` → pf2e's *Spell Effect: Synesthesia (Failure)*, `substitutions` setting `system.rules.0.selection` to `failure` | ☐ | Not driven in the pilot: only a critical failure was rolled |
| VS-104h | "Critical Failure As failure, and the target is Stunned 2 as it attempts to process the sensory shifts" | check:save · effect:condition | The failure effect with its choice answered, and stunned 2 | `riders`: `criticalFailure` → the failure effect with `system.rules.0.selection` set to `critical-failure`; `criticalFailure` → `stunned` 2 | ✅ | PR #7: the Ghoul Soldier critically failed → the failure effect set to "critical-failure" with **no ChoiceSet prompt**, plus **stunned 2** |
| VS-104i | "Heightened (9th) You can target up to five creatures" | reach:up-to-n · scaling:targets-per-rank · scaling:from-rank | From rank 9 the cast takes up to five targets | `areaTargeting.heightening.atRank.9.maxTargets: 4` (one, plus four) | ☐ | Not driven in the pilot |

### VS-105 · Command

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-105a | "The effects depend on the target's Will save" | when:cast · reach:single · check:save | One target, which rolls a Will save from the card | `content/vanilla/command.json` (`areaTargeting.maxTargets: 1`); the save is pf2e's own | ✅ | PR #7: the Ghoul Soldier rolled its Will save from the card's own button |
| VS-105b | "You can command the target to approach you, run away (as if it had the Fleeing condition), release what it's holding, drop Prone, or stand in place" |  | Nothing to automate: the caster says the command at the table | The GM notes (VS-105e, VS-105f) list the five commands | — | The command is the caster's, said at the table |
| VS-105c | "It can't Delay or take any reactions until it has obeyed your command" | effect:forbid | Until it obeys, the target can neither Delay nor react | Nothing in the entry: no `forbids` rider, and neither GM note mentions it | ☐ | Not implemented: the entry forbids nothing |
| VS-105d | "Success The creature is unaffected" | check:save | Nothing | No rider on `success` | ☐ | Not driven in the pilot |
| VS-105e | "Failure For the first action on its next turn, the creature must use a single action to do as you command" | check:save · effect:gm-note | A GM note: the target's first action next turn obeys the command | `riders`: `failure` → `prompt` (`ISAACS_AUTOMATION.Vanilla.command.Failure`) | ☐ | Not driven in the pilot: only a critical failure was rolled |
| VS-105f | "Critical Failure The target must use all its actions on its next turn to obey your command" | check:save · effect:gm-note | A GM note: all its actions next turn obey the command | `riders`: `criticalFailure` → `prompt` (`ISAACS_AUTOMATION.Vanilla.command.CriticalFailure`) | ✅ | PR #7: the Ghoul Soldier critically failed → the GM note, translated |
| VS-105g | "Heightened (5th) You can target up to 10 creatures" | reach:up-to-n · scaling:targets-per-rank · scaling:from-rank | From rank 5 the cast takes up to ten targets | `areaTargeting.heightening.atRank.5.maxTargets: 9` (one, plus nine) | ☐ | Not driven in the pilot |

### VS-106 · Calm

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-106a | "You forcibly calm creatures in the area" | when:cast · reach:area/burst | pf2e's 10-ft burst catches every creature in it, ally or enemy | `content/vanilla/calm.json` (`areaTargeting.affects: all`, on pf2e's own burst) | ☐ | Not driven in the pilot: Leo saved from the card, but what the burst caught was not recorded |
| VS-106b | "each creature must attempt a Will save" | check:save | Each creature caught rolls a Will save from the card | pf2e's own save | ✅ | PR #7: Leo rolled the Will save from the card's own button, three times |
| VS-106c | "Critical Success The creature is unaffected" | check:save | Nothing | No rider on `criticalSuccess` | ✅ | PR #7: Leo critically succeeded twice → nothing applied |
| VS-106d | "Success Calming urges impose a -1 status penalty to the creature's attack rolls" | check:save · effect:penalty | −1 status to attack rolls | `riders`: `success` → pf2e's *Spell Effect: Calm* | ☐ | Not driven in the pilot: PR #7 lists Calm's success effect as not driven |
| VS-106e | "Failure Any emotion effects that would affect the creature are suppressed and the creature can't use hostile actions" | check:save · effect:gm-note | A GM note: no hostile actions, emotion effects suppressed | `riders`: `failure` → `prompt` (`ISAACS_AUTOMATION.Vanilla.calm.Failure`); nothing refuses a hostile action or suppresses an effect | ✅ | PR #7: Leo failed → the GM note, translated |
| VS-106f | "If the target is subject to hostility from any other creature, it ceases to be affected by calm" | effect:gm-note | The failure's GM note says hostility from another creature ends it | The failure `prompt`'s text ("until another creature is hostile to it") | ✅ | PR #7: Leo's failure note, as posted, carried the hostility clause |
| VS-106g | "Critical Failure As failure, but hostility doesn't end the effect" | check:save · effect:gm-note | A GM note: as failure, and hostility does not end it | `riders`: `criticalFailure` → `prompt` (`ISAACS_AUTOMATION.Vanilla.calm.CriticalFailure`) | ☐ | Not driven in the pilot |

### VS-107 · Heal

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-107a | "If the target is a willing living creature, you restore 1d8 Hit Points" | when:cast · reach:single · effect:heal | A living target regains 1d8 Hit Points | `content/vanilla/heal.json` has nothing for it: pf2e's own healing | ☐ | Not driven in the pilot |
| VS-107b | "If the target is undead, you deal that amount of vitality damage to it, and it gets a basic Fortitude save" | reach:filtered · check:basic-save · effect:damage | An undead target takes the same amount as vitality damage, with a basic Fortitude save | Nothing in the entry: pf2e's own damage and basic save | ☐ | Not driven in the pilot |
| VS-107c | "The number of actions you spend when Casting this Spell determines its targets, range, area, and other parameters" | scaling:per-action | The actions spent pick the version: touch, 30 feet, or the emanation | `variants`: only the 3-action variant (`7vbvdrv2cl87sqta`) carries an area | ✅ | PR #7: `configFor` at 1 and 2 actions gave no area (the controls); at 3 actions, the emanation (VS-107g) |
| VS-107d | "1 The spell has a range of touch" | reach:single | At one action, a target within reach | Nothing in the entry: no area at 1 action, and the range is pf2e's | ☐ | Not driven in the pilot: the 1-action read only showed no area |
| VS-107e | "2 (concentrate) The spell has a range of 30 feet" | reach:single | At two actions, a target within 30 ft | Nothing in the entry: no area at 2 actions, and the range is pf2e's | ☐ | Not driven in the pilot: the 2-action read only showed no area |
| VS-107f | "If you're healing a living creature, increase the Hit Points restored by 8" | scaling:per-action · effect:heal | The 2-action version heals 1d8+8 | Nothing in the entry: pf2e's own 2-action variant | ☐ | Not driven in the pilot |
| VS-107g | "3 (concentrate) You disperse vital energy in a 30-foot emanation" | reach:area/emanation · scaling:per-action | At three actions, a 30-ft emanation centred on the caster, with no aiming | `variants.7vbvdrv2cl87sqta.areaTargeting` (pf2e's own emanation) | ✅ | PR #7: `configFor` at 3 actions gave a 30-ft emanation centred on Aries; read live, not cast |
| VS-107h | "This targets all living and undead creatures in the burst" | reach:area/emanation · reach:filtered | Every living or undead creature in the emanation is caught, the caster included; a construct is not | `affects: all`, `includesSelf: true`; no predicate keeps out a creature neither living nor undead | ☐ | Not driven in the pilot: the config read `affects: all` with Aries included, but no 3-action cast caught anyone. The entry has no living-or-undead filter |
| VS-107i | "Heightened (+1) The amount of healing or damage increases by 1d8, and the extra healing for the 2-action version increases by 8" | scaling:dice-per-rank · effect:heal · effect:damage | Rank 2: 2d8, and 2d8+16 for two actions | Nothing in the entry: pf2e's own heightening | ☐ | Not driven in the pilot |

### VS-108 · Ice Storm

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-108a | "When you Cast the Spell, a burst of magical hail deals 2d8 bludgeoning damage and 2d8 cold damage to each creature in the area below the cloud (basic Reflex save)" | when:cast · reach:area/burst · check:basic-save · effect:damage | The placed burst catches everyone in it; each rolls a basic Reflex save against 2d8 bludgeoning and 2d8 cold | `content/vanilla/ice-storm.json` (`areaTargeting.affects: all`; pf2e's own burst and damage) | ☐ | Not driven in the pilot: aiming the placement needed a real pointer |
| VS-108b | "Snow and sleet continue to rain down in the area for the remainder of the spell's duration, making the area difficult terrain" | area:lingering · effect:terrain · ending:duration | The area stays on the board as difficult terrain for the spell's minute | `lingering` (`difficultTerrain: 2`, `duration` 1 minute) | ✅ | PR #7: a Region made through the library's own lingering code got difficult terrain, the lingering behavior and a 1-minute expiry. It was made directly, not by an aimed cast |
| VS-108c | "Any creature that ends its turn in the storm takes (floor(@item.level/2))[cold] damage" | when:turn-end · area:lingering · effect:damage | A creature that ends its turn inside takes 2 cold damage at rank 4 | `lingering.events: ["tokenTurnEnd"]`, `lingering.damage` (`formula: "2"`, `type: cold`, `persistent: false`) | ☐ | Not driven in the pilot: the tick's amount was read, but no creature ended a turn in the storm |
| VS-108d | "If you Cast this Spell outdoors, you can create two nonoverlapping clouds instead of one" | area:several · area:apart | Outdoors, the cast can place two clouds that don't overlap | Nothing in the entry: one cloud, no `areaTargetingShapes[].areas` and no `apart` | ☐ | Not implemented: the entry places one cloud |
| VS-108e | "As normal, if a Large or larger creature is in both clouds, it still only takes the initial damage once and the continuing damage once per turn" | area:several · economy:once-per-round | A creature in both clouds is damaged once at the cast and once a turn | Nothing in the entry: there is no second cloud | ☐ | Not implemented: the entry places one cloud |
| VS-108f | "The initial bludgeoning damage and cold damage increase by 1d8 each" | scaling:dice-per-rank · effect:damage | Rank 6: 3d8 bludgeoning and 3d8 cold | Nothing in the entry: pf2e's own heightening | ☐ | Not driven in the pilot |
| VS-108g | "the cold damage creatures take at the end of their turns increases by 1" | scaling:dice-per-rank · effect:damage | The tick is 2 at rank 4 and 3 at rank 6 | `areaTargeting.heightening.interval: 2`; `lingering.damage.perStep: "1"` | ✅ | PR #7: the tick first read 2 at rank 6, a lost regex escape in the flat growth; after the fix and a unit test it read **2 at rank 4, 3 at rank 6** |

### VS-109 · Force Barrage

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-109a | "You fire a shard of solidified magic toward a creature that you can see" | when:cast · reach:single | One shard at a creature the caster can see | `content/vanilla/force-barrage.json` has nothing for sight; pf2e's own target | ☐ | Not driven in the pilot |
| VS-109b | "It automatically hits and deals 1d4+1 force damage" | effect:damage | 1d4+1 force, with no attack roll and no save | Nothing in the entry: pf2e's own damage | ☐ | Not driven in the pilot |
| VS-109c | "For each additional action you use when Casting the Spell, increase the number of shards you shoot by one" | reach:up-to-n · scaling:per-action | One action, one shard; two, two; three, three | `areaTargeting.maxTargets: 3` at any action count; no `targetsPerAction` | ☐ | Not implemented: the cap is three whatever the actions spent |
| VS-109d | "to a maximum of three shards for 3 actions" | reach:up-to-n | Never more than three targets | `areaTargeting.maxTargets: 3` | ✅ | PR #7: `configFor` read **3** for *Force Barrage*, and 3 for the legacy *Magic Missile* (`content/vanilla/_aliases.json`) |
| VS-109e | "You choose the target for each shard individually" | reach:up-to-n | Each shard's target is the caster's choice | pf2e's own targets, one per creature | ☐ | Not driven in the pilot |
| VS-109f | "If you shoot more than one shard at the same target, combine the damage before applying bonuses or penalties to damage, resistances, weaknesses, and so forth" | effect:damage | Two shards at one creature land as one total, resisted once | Nothing in the entry: a creature can only be targeted once, so two shards at it cannot be expressed | ☐ | Not implemented |
| VS-109g | "Heightened (+2) You fire one additional shard with each action you spend" | reach:up-to-n · scaling:targets-per-rank · scaling:per-action | Rank 3: up to two, four or six by actions; rank 5: three, six or nine | `areaTargeting.heightening` (`interval: 2`, `maxTargets: 3` a step) | ⚠️ | PR #7: *Magic Missile* (the legacy alias) read **9** at rank 5. **Gap:** the growth is three a step whatever the actions, so a 1-action cast at rank 5 is not held to three shards |

### VS-110 · Daze

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-110a | "The jolt deals 1d6 mental damage, with a basic Will save" | when:cast · reach:single · check:basic-save · effect:damage | The target rolls a basic Will save against 1d6 mental | `content/vanilla/daze.json` has nothing for it: pf2e's own damage and basic save | ☐ | Not driven in the pilot: the Ghoul Soldier's critical failure was recorded for its stunned, not its damage |
| VS-110b | "If the target critically fails the save, it is also Stunned 1" | check:basic-save · effect:condition | A critical failure adds stunned 1 | `riders`: `criticalFailure` → `stunned` 1 | ✅ | PR #7: the Ghoul Soldier critically failed → **stunned 1** |
| VS-110c | "Heightened (+2) The damage increases by 1d6" | scaling:dice-per-rank · effect:damage | Rank 3 deals 2d6 | Nothing in the entry: pf2e's own heightening | ☐ | Not driven in the pilot |

### VS-111 · Frostbite

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-111a | "The target takes 2d4 cold damage with a basic Fortitude save" | when:cast · reach:single · check:basic-save · effect:damage | The target rolls a basic Fortitude save against 2d4 cold | `content/vanilla/frostbite.json` has nothing for it: pf2e's own damage and basic save | ☐ | Not driven in the pilot |
| VS-111b | "On a critical failure, the target also gains weakness 1 to bludgeoning" | check:basic-save · effect:weakness | A critical failure gives weakness to bludgeoning | `riders`: `criticalFailure` → pf2e's *Spell Effect: Frostbite* | ✅ | PR #7: Frostbite's rider, carried on a test entry on *Fear* cast at rank 3: the Ghoul Soldier critically failed → the effect, **weakness 3**. Rank 1 (weakness 1) was not cast |
| VS-111c | "until the start of your next turn" | ending:next-turn | The weakness ends at the start of the caster's next turn | Nothing in the entry: pf2e's effect's own duration | ☐ | Not driven in the pilot |
| VS-111d | "The damage increases by 1d4" | scaling:dice-per-rank · effect:damage | Rank 2 deals 3d4 | Nothing in the entry: pf2e's own heightening | ☐ | Not driven in the pilot |
| VS-111e | "the weakness on a critical failure increases by 1" | scaling:dice-per-rank · effect:weakness | The weakness equals the cast rank | `substitutions`: `system.level.value` ← `origin.item.rank` | ✅ | PR #7: cast at rank 3, the effect came at level 3 → **weakness 3** |
