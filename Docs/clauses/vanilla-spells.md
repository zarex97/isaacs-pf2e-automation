# Clauses — vanilla spells, the second batch

*Spell tracker. Forty pf2e spells, each chosen for a **shape** the pilot (`Docs/vanilla.md`, 1.2.0) did not
exercise — one row per spell, each naming what has to happen at the table for that shape to work.*

**Tracker issue:** #12 · **Source:** pf2e 8.4.1's own spell text
(`npm run index:pf2e` indexes the slugs; the text is the spell's description in the system compendium).

## How a row is marked

| Mark | Meaning |
| :-- | :-- |
| ☐ | Not yet driven |
| ✅ | Driven live; it happened by itself |
| ⚠️ | Driven live; partially happens — the gap is named in **Evidence** |
| ❌ | Driven live; does not happen |
| 🔧 | Was ❌ or ⚠️, a fix has landed, awaiting re-drive |
| — | Nothing to automate (pure roleplaying / GM ruling) |

**Clause** is a short fragment of the spell's own text — the sentence that makes the row's shape.
**Must happen** is what the drive has to see. **Static check** names what guards it offline (an entry in
`content/vanilla/`, a test); **Evidence** names what proved it in world `pf`.

`build/test-automation.mjs` holds this file to pf2e and to the table: every slug is a real pf2e spell,
every mark is one of the six above, and a ✅ row has an entry in `content/vanilla/` (or says in **Static
check** why it needs none). Drives run with this module alone — PF2e Automations and PF2e Assistant off.

*How a clause is driven — the rig, the traps and what a ✅ owes — is `Docs/tools/live-verification.md`.*

## Areas and placement

| ID | Spell | Rank | Shape | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-01 | `lightning-bolt` | 3 | A line, aimed | "A bolt of lightning strikes outward from your hand" | A 120-ft line is aimed from the caster's edge and targets everything it crosses | `content/vanilla/lightning-bolt.json` (`anchor: "caster"`); `fromCaster` / `pinnedToCaster` geometry tests | ✅ | Aries cast it from an innate entry: the line started on Aries' west edge (3800, 2850; centre 3850) and turned with the pointer, snapped to 5°, never moving its start. Aimed due west, it targeted all 10 creatures in that row within 120 ft; *ZZ Zan L2*, dead at the same 90 ft as an included *ZZ Ryu L2*, was left out. **Control:** with no entry, `configFor` gave nothing under the default scope. Two engine gaps found and fixed on the way: a line placed where the pointer was and travelled with it; and pf2e's `placeRegion` replaces any `onMove` it is given. |
| VS-02 | `fireball` | 3 | No entry: pf2e's own area | "detonates at a spot you designate" | No table entry; aims under **every spell with an area**, not under the default scope | | ☐ | |
| VS-03 | `grease` | 1 | Area *or* a target | "choosing an area or target" | The caster chooses: four 5-ft squares (prone on a failed save) or one object (no area, no aiming) | | ☐ | |
| VS-04 | `chain-lightning` | 6 | A chain of targets | "arcs to another creature within 30 feet of the first target" | Each target after the first is within 30 ft of the one before; no creature twice; line of effect to all | | ☐ | |
| VS-05 | `translocate` | 4 | The caster moves | "transport yourself … to an unoccupied space within range you can see" | The caster's token moves to a chosen unoccupied point within 120 ft; anyone carried makes it fail | | ☐ | |

## Lingering ground

| ID | Spell | Rank | Shape | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-06 | `wall-of-fire` | 4 | A wall, line or ring | "a straight line up to 60 feet long … or a … 10-foot-radius ring" | The caster chooses line or ring; crossing it or starting a turn in it deals the fire damage | | ☐ | |
| VS-07 | `mist` | 2 | Concealment both ways | "All creatures within the mist become Concealed" | Creatures inside are concealed, and those outside are concealed to them, while the cloud stands | | ☐ | |
| VS-08 | `darkness` | 2 | Light suppressed | "Light does not enter the area" | A burst of darkness that non-magical light does not enter or leave | | ☐ | |
| VS-09 | `web` | 2 | Terrain, save on moving, Escape | "begins to use a move action or enters the web" | Difficult terrain; moving in it asks Athletics or Reflex, failure immobilized with an Escape against the spell DC | | ☐ | |
| VS-10 | `entangling-flora` | 2 | A save at turn start | "Each round that a creature starts its turn in the area" | Difficult terrain; a Reflex save at each turn start in it; −10 ft, immobilized on a critical failure; Escape removes them | | ☐ | |
| VS-11 | `scatter-scree` | 1 | One at a time | "any previous scatter scree you've cast ends" | A line of difficult terrain; casting it again removes the previous one | | ☐ | |
| VS-12 | `gust-of-wind` | 1 | A save on entering | "creatures that later move into the gust must attempt the save on entering" | A 60-ft line; a Fortitude save on entering it, with the push and prone of its outcomes | | ☐ | |

## Emanations that follow and grow

| ID | Spell | Rank | Shape | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-13 | `bless` | 1 | An aura for allies, grows on Sustain | "Sustain the spell to increase the emanation's radius by 10 feet" | Allies within it have +1 status to attack; each Sustain widens it 10 ft | | ☐ | |
| VS-14 | `malediction` | 1 | An aura with a save, grows on Sustain | "force enemies in the area that weren't yet affected to attempt a saving throw" | Enemies save once; −1 AC while inside; a Sustain widens it and asks only the newly caught | | ☐ | |

## Saves with something new in their outcomes

| ID | Spell | Rank | Shape | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-15 | `dizzying-colors` | 1 | Several conditions, several durations | "Stunned 1, Blinded for 1 round, and dazzled for 1 minute" | In a 15-ft cone, each outcome's set of conditions with its own duration | | ☐ | |
| VS-16 | `sleep` | 1 | Incapacitation, an exception | "doesn't fall Prone or release what it's holding" | A failure is unconscious *without* prone; it wakes after 1 minute | | ☐ | |
| VS-17 | `blindness` | 3 | Permanent, then immune | "Blinded permanently" … "temporarily immune for 1 minute" | A critical failure blinds with no expiry; any outcome makes the target immune for 1 minute | | ☐ | |
| VS-18 | `paralyze` | 3 | A save each turn shortens it | "a new Will save to reduce the remaining duration by 1 round" | Paralyzed 4 rounds; at the end of each of its turns a Will save takes a round off, or ends it on a critical success | | ☐ | |
| VS-19 | `enfeeble` | 1 | Ends on the caster's turn | "Enfeebled 1 until the start of your next turn" | A success's enfeebled ends at the start of the *caster's* next turn, not the target's | | ☐ | |
| VS-20 | `petrify` | 6 | A condition that climbs | "the slowed condition increases by 1 (or 2 on a critical failure)" | A failure slows 1, then a Fortitude save each turn end raises it, ending petrified | | ☐ | |
| VS-21 | `laughing-fit` | 2 | One round, then another outcome | "can't use actions or reactions for 1 round. It then takes the effects of a failure" | A critical failure is prone and helpless for a round, then slowed 1 with no reactions | | ☐ | |
| VS-22 | `phantom-pain` | 1 | Ends with its condition | "If the target recovers from being Sickened, the persistent damage ends" | Persistent mental and sickened 1; when sickened goes, the persistent damage goes too | | ☐ | |
| VS-23 | `acid-grip` | 2 | Persistent damage that carries a penalty | "takes a –10-foot status penalty to its Speeds" | Persistent acid scaling with rank; −10 ft while it lasts; a success moves the target 5 ft | | ☐ | |
| VS-24 | `ill-omen` | 1 | Misfortune, once or always | "roll twice and use the worse result" | A failure makes the next attack or skill check roll twice keep worse; a critical failure, every one | | ☐ | |
| VS-25 | `banishment` | 5 | The caster is hurt by a success | "The target resists being banished and you are Stunned 1" | A failure banishes the target; a critical success stuns the *caster* 1 | | ☐ | |

## Spell attack rolls

| ID | Spell | Rank | Shape | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-26 | `hydraulic-push` | 1 | Forced movement on a hit | "knocked back 5 feet" | A hit pushes the target 5 ft away from the caster, 10 ft on a critical hit | | ☐ | |
| VS-27 | `ignition` | 1 | Persistent damage on a critical hit | "double damage and 1d4 persistent fire damage" | A critical hit adds persistent fire scaling with rank; the melee choice uses d6s | | ☐ | |
| VS-28 | `tangle-vine` | 1 | An attack that grants an Escape | "It can attempt to Escape against your spell DC" | A critical hit immobilizes with −10 ft; the target gets an Escape against the spell DC | | ☐ | |

## Buffs and effects on others or oneself

| ID | Spell | Rank | Shape | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-29 | `sure-strike` | 1 | An effect on the caster, then immunity | "You are then temporarily immune to sure strike for 10 minutes" | Casting it puts its effect on the caster, then refuses a second cast for 10 minutes | | ☐ | |
| VS-30 | `heroism` | 3 | An ally's effect that grows by rank | "Heightened (6th) The status bonus increases to +2" | The effect lands on the chosen ally; +2 from rank 6, +3 from rank 9 | | ☐ | |
| VS-31 | `haste` | 3 | Allies, more from a rank | "Heightened (7th) You can target up to 6 creatures" | Quickened on one ally, up to six from rank 7 | | ☐ | |
| VS-32 | `soothe` | 1 | Healing plus an effect | "regains 1d10+4 Hit Points … and gains a +2 status bonus" | The ally regains the healing and gains the effect | | ☐ | |
| VS-33 | `invisibility` | 2 | Ends on a hostile action | "If the target uses a hostile action, the spell ends" | Invisible until the target acts with hostility; from rank 4, for a minute regardless | | ☐ | |
| VS-34 | `mirror-image` | 2 | Images that are spent | "Once an image is hit, it is destroyed" | Three images; an attack that would hit may hit one instead, and that image is gone | | ☐ | |
| VS-35 | `shield` | 1 | A reaction with Hardness | "you can use the Shield Block reaction with your magic shield" | +1 AC until the caster's next turn, and a Shield Block offer with Hardness 5 | | ☐ | |

## Over time, and across creatures

| ID | Spell | Rank | Shape | Clause | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-36 | `regenerate` | 7 | Healing at each turn start | "restores 15 Hit Points to it at the start of each of its turns" | 15 HP at the start of each of the target's turns while it lasts | | ☐ | |
| VS-37 | `spirit-link` | 1 | Hit Points moved between two | "You lose as many Hit Points as the target regained" | At cast and each turn start of the caster, the ally gains up to 2 HP and the caster loses the same | | ☐ | |
| VS-38 | `vampiric-feast` | 3 | The caster gains from the damage | "temporary Hit Points equal to half the void damage the target takes" | After the damage lands, the caster gains half of what was actually taken as temporary HP | | ☐ | |
| VS-39 | `sanctuary` | 1 | The attacker saves | "Creatures attempting to attack the target must attempt a Will save" | An attack on the warded creature first asks the attacker's Will save; a failure wastes it; a hostile action ends the spell | | ☐ | |
| VS-40 | `dispel-magic` | 2 | A counteract | "Attempt a counteract check against the target" | A counteract check against a chosen spell effect, ending it on a success | | ☐ | |

## Counts

| Status | Count |
| :-- | --: |
| ☐ not yet driven | 39 |
| ✅ | 1 |
| ⚠️ | 0 |
| ❌ | 0 |
| 🔧 | 0 |
| — | 0 |
| **Total** | **40** |
