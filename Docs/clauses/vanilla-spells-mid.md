# Clauses — vanilla spells, the mid-match test

*Spell tracker, clausified. Ten pf2e spells the precedent lookup matched partly — the best precedent for each
shared two patterns (`npm run precedent`) — taken as the second half of the test of how long a spell takes to
automate. The low-match test is `vanilla-spells-low.md`.*

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
| VS-122 | `noxious-vapors` | 1 | Toxic smoke around the caster: damage, sickened, concealed |
| VS-123 | `mind-games` | 2 | A Will save at each Sustain; stunned either way round |
| VS-124 | `endure` | 1 | Temporary Hit Points, more by rank |
| VS-125 | `phase-bolt` | 1 | A spell attack that shrinks circumstance bonuses to AC |
| VS-126 | `chilling-spray` | 1 | A cone of cold; a Speed penalty on a failure |
| VS-127 | `false-vitality` | 2 | Temporary Hit Points for the caster |
| VS-128 | `timber` | 1 | A line from the caster; dazzled on a critical failure |
| VS-129 | `nettleskin` | 1 | Thorns that hurt adjacent attackers and wear down |
| VS-130 | `puff-of-poison` | 1 | Poison damage and persistent poison by degree |
| VS-131 | `holy-light` | 3 | A fire ray, extra spirit against the unholy |

**Where it stands:** 39 clauses — 37 ✅, 2 ⚠️. The ⚠️ are table notes: concealment from inside the smoke out, and Holy Light's counteract.

### VS-122 · Noxious Vapors

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-122a | "Each creature except you in the area when you Cast the Spell takes 1d6 poison damage (basic Fortitude save)" | when:cast · reach:area/emanation · check:basic-save · effect:damage | A 10-ft emanation catches everyone but the caster; basic Fortitude against 1d6 poison | `noxious-vapors.json` | ✅ | The emanation caught the patient and the Target; the caster's own token was left out. A second token of the caster's actor on the same square was caught — a fixture quirk. The card rolled `1d6 poison`, basic Fortitude |
| VS-122b | "A creature that critically fails the saving throw also becomes Sickened 1" | check:save · effect:condition | Sickened 1 on a critical failure | `noxious-vapors.json` | ✅ | Critical failure: sickened 1. Control: a failure left none |
| VS-122c | "All creatures in the area become Concealed" | reach:area/emanation · effect:concealment · ending:duration | Everyone in the smoke, the caster too, concealed for the round | `noxious-vapors.json` | ✅ | The patient and the caster both concealed, 1 round. Control: neither before the cast |
| VS-122d | "all creatures outside the smoke become concealed to creatures within it" | effect:concealment · effect:gm-note | A note: concealment from inside out is the table's | `noxious-vapors.json` | ⚠️ | A note on the card, "Left to the table": concealment from inside out is not applied |
| VS-122e | "Heightened (+1) The damage increases by 1d6" | scaling:dice-per-rank · effect:damage | Rank 2 deals 2d6 | `noxious-vapors.json` | ✅ | Rank 2 rolled `2d6 poison`. Control: rank 1, `1d6` |

### VS-123 · Mind Games

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-123a | "The target must attempt a Will save" | when:cast · reach:single · check:save | The target saves from the card | `mind-games.json` · `sustained.repeat` | ✅ | Rolled from the card's target row; a failure gave stunned 1 and the caster `Sustain Mind Games` |
| VS-123b | "Each time you Sustain this Spell, the target attempts another Will save" | when:sustain · check:save | Sustaining asks for the save again | `mind-games.json` · `sustained.repeat` | ✅ | Sustaining posted the card again and its new save critically failed: stunned 2, one marker. Control: no second save until the Sustain |
| VS-123c | "Critical Success You are Stunned 1 and the spell ends" | check:attacker-saves · effect:condition · ending:save-ends | The caster stunned 1, the spell over | `mind-games.json` · `sustained.repeat` | ✅ | Critical success: the caster stunned 1, the patient's marker gone. Sustaining after it said the spell had ended and removed itself. Control: on a failure Sustain posts the card again |
| VS-123d | "Success The target is unaffected" | check:save | Nothing | `mind-games.json` · `sustained.repeat` | ✅ | Success: nothing on the patient but the spell's marker; a Sustain's failed re-save then gave stunned 1 |
| VS-123e | "Failure The target is stunned 1" | check:save · effect:condition | Stunned 1 | `mind-games.json` · `sustained.repeat` | ✅ | Stunned 1 |
| VS-123f | "Critical Failure The target is Stunned 2" | check:save · effect:condition | Stunned 2 | `mind-games.json` · `sustained.repeat` | ✅ | Stunned 2 |

### VS-124 · Endure

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-124a | "You grant the touched creature 5 temporary Hit Points that last for 1 minute" | when:cast · reach:single · effect:temp-hp · ending:duration | 5 temporary Hit Points for a minute | `endure.json` | ✅ | 5 temporary Hit Points, 1 minute. Control: 0 before |
| VS-124b | "Heightened (+1) The temporary Hit Points increase by 5" | scaling:from-rank · effect:temp-hp | Rank 2: 10 | `endure.json` | ✅ | Rank 2: 10. Control: rank 1, 5 |

### VS-125 · Phase Bolt

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-125a | "Make a ranged spell attack roll against your target's AC" | when:cast · reach:single · check:attack | A spell attack against AC | `phase-bolt.json` · `vanilla/phase.mjs` | ✅ | The card's spell attack, against the patient's AC |
| VS-125b | "if the target has any circumstance bonuses to AC (such as from a shield or cover), reduce that bonus by 2 for this attack" | effect:cover-reduced · check:attack | A circumstance bonus to AC counts 2 less, for this attack only | `phase-bolt.json` · `vanilla/phase.mjs` | ✅ | A +2 circumstance bonus to AC: the attack's DC 10, not 12. A +1: 10. Control: a +2 status bonus stayed 12, and Holy Light against the +2 circumstance read 12 |
| VS-125c | "On a success, you deal 3d4 piercing damage" | check:attack · effect:damage | 3d4 piercing on a hit, doubled on a critical | `phase-bolt.json` · `vanilla/phase.mjs` | ✅ | A hit rolled `3d4 piercing`. A critical's double is the card's ×2, as for every pf2e spell attack |
| VS-125d | "Heightened (+1) The bolt's damage increases by 1d4" | scaling:dice-per-rank · effect:damage | Rank 2: 4d4 | `phase-bolt.json` · `vanilla/phase.mjs` | ✅ | Rank 2 rolled `4d4 piercing`. Control: rank 1, `3d4` |

### VS-126 · Chilling Spray

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-126a | "You deal 2d4 cold damage to creatures in the area; they must each attempt a Reflex save" | when:cast · reach:area/cone · check:save · effect:damage | A 15-ft cone from the caster; each creature saves against 2d4 cold | `chilling-spray.json` | ✅ | Aimed live from the caster: the patient was caught. Control: the Target 5 ft east, outside the facing, was not. The card rolled `2d4 cold` |
| VS-126b | "Failure The creature takes full damage and takes a –5-foot status penalty to its Speeds for 2 rounds" | check:save · effect:speed · effect:penalty · ending:duration | −5 ft status to Speeds for 2 rounds | `chilling-spray.json` | ✅ | Failure: Speed 25 → 20, for 2 rounds. Control: a success left 25 |
| VS-126c | "Critical Failure The creature takes double damage and takes a –10-foot status penalty to its Speeds for 2 rounds" | check:save · effect:speed · effect:penalty · ending:duration | −10 ft for 2 rounds | `chilling-spray.json` | ✅ | Critical failure: Speed 25 → 15 |
| VS-126d | "Heightened (+1) The damage increases by 2d4" | scaling:dice-per-rank · effect:damage | Rank 2: 4d4 | `chilling-spray.json` | ✅ | Rank 2 rolled `4d4 cold`. Control: rank 1, `2d4` |

### VS-127 · False Vitality

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-127a | "You gain 10 temporary Hit Points" | when:cast · reach:self · effect:temp-hp · ending:duration | 10 temporary Hit Points for 8 hours | `false-vitality.json` | ✅ | The caster: 10 temporary Hit Points, 8 hours. Control: the patient beside it got none |
| VS-127b | "Heightened (+1) The temporary Hit Points increase by 3" | scaling:from-rank · effect:temp-hp | Rank 3: 13 | `false-vitality.json` | ✅ | Rank 3: 13 |

### VS-128 · Timber

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-128a | "Any creature in the area takes 2d4 bludgeoning damage, with a basic Reflex saving throw" | when:cast · reach:area/line · check:basic-save · effect:damage | A 15-ft line from the caster; basic Reflex against 2d4 bludgeoning | `timber.json` | ✅ | Aimed live from the caster: the patient was caught. The card rolled `2d4 bludgeoning`, basic Reflex |
| VS-128b | "A creature that critically fails its save is knocked for a loop, making it Dazzled until the end of its next turn" | check:save · effect:condition · ending:next-turn | Dazzled until the end of its next turn | `timber.json` | ✅ | Critical failure: dazzled, timed to end at the end of its own turn. Control: a failure left none |
| VS-128c | "Heightened (+1) The initial damage increases by 1d4" | scaling:dice-per-rank · effect:damage | Rank 2: 3d4 | `timber.json` | ✅ | Rank 2 rolled `3d4 bludgeoning`. Control: rank 1, `2d4` |

### VS-129 · Nettleskin

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-129a | "Thorns sprout from your body" | when:cast · reach:self · ending:duration | The caster carries the thorns for a minute | `nettleskin.json` · `carries` | ✅ | The caster carries `Nettleskin: nettleskin`, 10 rounds |
| VS-129b | "Adjacent creatures that hit you with a melee or unarmed attack take 1d4 piercing damage as the nettles jab them and break off" | when:strike-received · reach:attacker · effect:damage | An adjacent melee hit costs the attacker 1d4 piercing | `nettleskin.json` · `carries` | ✅ | The adjacent patient's Club hit: the patient took `1d4 piercing`. Control: Capricorn's hit from 15 ft drew nothing |
| VS-129c | "Each time a creature takes damage in this way, nettleskin 's duration decreases by 1 round" | ending:worn-down | Each jab takes a round off the thorns | `nettleskin.json` · `carries` | ✅ | Each jab took a round off: 10 → 9 → 8 → 7. Control: Capricorn's hit from 15 ft left 10 |
| VS-129d | "Heightened (+1) The damage increases by 1d4" | scaling:dice-per-rank · effect:damage | Rank 2: 2d4 | `nettleskin.json` · `carries` | ✅ | Rank 2: the jab rolled `2d4 piercing`, 7. Was `1d4` until the carried formula was grown at grant time |

### VS-130 · Puff Of Poison

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-130a | "The target takes 1d4 poison damage" | when:cast · reach:single · check:save · effect:damage | 1d4 poison by its Fortitude save | `puff-of-poison.json` | ✅ | The card rolled `1d4 poison` with its Fortitude save |
| VS-130b | "Success The target takes half initial damage and no persistent damage" | check:save · effect:damage | Half, no persistent | `puff-of-poison.json` | ✅ | Success: no persistent damage. Half the initial is the card's Half, as for every pf2e save |
| VS-130c | "Failure The target takes full initial and persistent damage" | check:save · effect:damage · effect:persistent | Full and 1d4 persistent poison | `puff-of-poison.json` | ✅ | Failure: persistent `1d4` poison |
| VS-130d | "Critical Failure The target takes double initial and persistent damage" | check:save · effect:damage · effect:persistent | Double, and the persistent doubled | `puff-of-poison.json` | ✅ | Critical failure: persistent `2d4` poison. Double the initial is the card's ×2 |
| VS-130e | "Heightened (+2) The initial poison damage increases by 1d4, and the persistent poison damage increases by 1d4" | scaling:dice-per-rank · effect:damage · effect:persistent | Rank 3: 2d4 and 2d4 persistent | `puff-of-poison.json` | ✅ | Rank 3: initial `2d4`, persistent `2d4`, and `4d4` on a critical failure. Control: rank 1, `1d4` |

### VS-131 · Holy Light

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-131a | "Make a ranged spell attack. The ray deals 5d6 fire damage" | when:cast · reach:single · check:attack · effect:damage | 5d6 fire on a hit | `holy-light.json` | ✅ | A hit rolled `5d6 fire` |
| VS-131b | "If the target has the unholy trait, you deal an extra 5d6 spirit damage" | reach:filtered · effect:damage | An unholy target takes 5d6 spirit too | `holy-light.json` | ✅ | An unholy patient: 25 spirit on a hit, 60 on a critical. Control: the same hit on a patient not unholy, none |
| VS-131c | "holy light attempts to counteract the darkness" | check:counteract · effect:gm-note | A note: the counteract is the table's | `holy-light.json` | ⚠️ | A note on the card, "Left to the table": the counteract is not attempted |
| VS-131d | "Heightened (+1) The fire damage increases by 2d6, and the spirit damage against unholy creatures increases by 2d6" | scaling:dice-per-rank · effect:damage | Rank 4: 7d6 and 7d6 | `holy-light.json` | ✅ | Rank 4: `7d6 fire`, and the spirit `5d6 + 2d6`. Control: rank 3, `5d6` |
