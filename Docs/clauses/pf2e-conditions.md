# Clauses — pf2e conditions

*Condition tracker, clausified. pf2e's 43 conditions, each broken into **clauses**: independently-failable statements
quoted from the condition's own text, one row each — so each can be automated where pf2e writes it down and never
enforces it, and driven until it happens by itself.*

**Tracker issue:** #78 · **Source:** pf2e 8.4.1's own condition text, as the sheet prints it (`npm run index:pf2e` writes it
to `build/data/pf2e-condition-text.json`, `@Localize[…]` resolved).

## How a row is marked

| Mark | Meaning |
| :-- | :-- |
| ☐ | Not yet driven |
| ✅ | Driven live; the clause happened by itself |
| ⚠️ | Driven live; partially happens — the gap is named in **Evidence** |
| ❌ | Driven live; does not happen |
| 🔧 | Was ❌ or ⚠️, a fix has landed, awaiting re-drive |
| — | Nothing to automate (pure roleplaying / GM ruling) |

**Clause** is a verbatim fragment of the condition's text; `npm test` asserts it still is one. **Patterns** tags the clause
from `Docs/patterns.md` (`—` when it states a fact and makes no move). **Must happen** is what a drive has to see.
**Static check** says what makes it happen today — pf2e's own rule elements on the condition, this module, or nothing —
and **Evidence** what proved it in world `pf`. Clause IDs are the condition's ID and a letter: `CND-19c` is the third
clause of Frightened.

*How a clause is driven — the rig, the traps and what a ✅ owes — is `Docs/tools/live-verification.md`.*

## The conditions

| ID | Condition | Name |
| :-- | :-- | :-- |
| CND-01 | `blinded` | Blinded |
| CND-02 | `broken` | Broken |
| CND-03 | `clumsy` | Clumsy |
| CND-04 | `concealed` | Concealed |
| CND-05 | `confused` | Confused |
| CND-06 | `controlled` | Controlled |
| CND-07 | `cursebound` | Cursebound |
| CND-08 | `dazzled` | Dazzled |
| CND-09 | `deafened` | Deafened |
| CND-10 | `doomed` | Doomed |
| CND-11 | `drained` | Drained |
| CND-12 | `dying` | Dying |
| CND-13 | `encumbered` | Encumbered |
| CND-14 | `enfeebled` | Enfeebled |
| CND-15 | `fascinated` | Fascinated |
| CND-16 | `fatigued` | Fatigued |
| CND-17 | `fleeing` | Fleeing |
| CND-18 | `friendly` | Friendly |
| CND-19 | `frightened` | Frightened |
| CND-20 | `grabbed` | Grabbed |
| CND-21 | `helpful` | Helpful |
| CND-22 | `hidden` | Hidden |
| CND-23 | `hostile` | Hostile |
| CND-24 | `immobilized` | Immobilized |
| CND-25 | `indifferent` | Indifferent |
| CND-26 | `invisible` | Invisible |
| CND-27 | `observed` | Observed |
| CND-28 | `off-guard` | Off-Guard |
| CND-29 | `paralyzed` | Paralyzed |
| CND-30 | `persistent-damage` | Persistent Damage |
| CND-31 | `petrified` | Petrified |
| CND-32 | `prone` | Prone |
| CND-33 | `quickened` | Quickened |
| CND-34 | `restrained` | Restrained |
| CND-35 | `sickened` | Sickened |
| CND-36 | `slowed` | Slowed |
| CND-37 | `stunned` | Stunned |
| CND-38 | `stupefied` | Stupefied |
| CND-39 | `unconscious` | Unconscious |
| CND-40 | `undetected` | Undetected |
| CND-41 | `unfriendly` | Unfriendly |
| CND-42 | `unnoticed` | Unnoticed |
| CND-43 | `wounded` | Wounded |

## The clauses

**191 clauses:** 45 ✅, 5 ⚠️, 13 ❌, 109 ☐, 19 —. The first drive (world `pf`, pf2e 8.4.1) used a clean, classless
level-1 fixture with 50 HP and a club; each reading is against the same fixture without the condition.

### CND-01 · Blinded

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-01a | "You can't detect anything using vision" | effect:unobserved | A blinded creature's token sees nothing by sight; others are not shown to it by vision | pf2e: `visionLevel` is BLINDED and `canSee` false with the condition (Foundry's blind status); no rule element on the item | ☐ | |
| CND-01b | "All normal terrain is difficult terrain to you" | effect:terrain | Every square costs the blinded creature double movement | pf2e: nothing — the text is all. This module: nothing (`scripts/lib/movement-cost.mjs` prices Regions, not a condition) | ☐ | |
| CND-01c | "You automatically critically fail Perception checks that require you to be able to see" | check:degree-shift | A sight-based Perception check comes out a critical failure whatever the die | pf2e: nothing — no AdjustDegreeOfSuccess on this item | ☐ | |
| CND-01d | "if vision is your only precise sense, you take a –4 status penalty to Perception checks" | effect:penalty | −4 status to Perception, and none for a creature with another precise sense | pf2e: FlatModifier status −4 on `perception`, unconditional — it also applies to a creature with another precise sense | ⚠️ | Live: Fixture (classless, level 1, 50 HP, a club) blinded → Perception 0 → −4. Gap: with a precise tremorsense added it is still −4 — the penalty ignores the condition's "only precise sense" |
| CND-01e | "You are immune to visual effects" | effect:resistance | A visual effect does not affect the blinded creature | pf2e: Immunity `visual` | ✅ | Live: blinded put `visual` among the fixture's immunities; without it, none |
| CND-01f | "Blinded overrides Dazzled" | effect:suppress | A dazzled creature that is blinded loses dazzled's effects while blinded lasts, and gets them back after | pf2e: `overrides: ["dazzled"]` — `ConditionPF2e#prepareSiblingData` deactivates dazzled | ✅ | Live: dazzled, then blinded → only blinded active (dazzled kept, inactive); dazzled alone is active (control) |

### CND-02 · Broken

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-02a | "Broken is a condition that affects only objects" | reach:object | Broken is never put on a creature by these rules | pf2e: nothing on the item; a physical item's `isBroken` is derived from its Hit Points | ☐ | |
| CND-02b | "An object is broken when damage has reduced its Hit Points to equal or less than its Broken Threshold" | reach:object · effect:condition | An item damaged to its Broken Threshold reads broken | pf2e: `PhysicalItemPF2e#isBroken` (HP against BT); the condition item carries no rules | ☐ | |
| CND-02c | "A broken object can't be used for its normal function, nor does it grant bonuses—with the exception of armor" | reach:object · effect:forbid | A broken shield grants no AC and cannot Shield Block; a broken item is refused its use | pf2e: a broken shield's `acBonus` is 0 and it is left out of Shield Block; other items: nothing | ☐ | |
| CND-02d | "Broken armor still grants its item bonus to AC, but it also imparts a status penalty to AC depending on its category: –1 for broken light armor, –2 for broken medium armor, or –3 for broken heavy armor" | effect:penalty | Broken light, medium or heavy armor gives −1, −2 or −3 status to AC, item bonus kept | pf2e: nothing found for armor in 8.4.1 | ☐ | |
| CND-02e | "A broken item still imposes penalties and limitations normally incurred by carrying, holding, or wearing it" | effect:penalty | Broken armor keeps its Dex cap, check penalty and Speed penalty | pf2e: nothing removes them, so they stay | ☐ | |
| CND-02f | "If an effect makes an item broken automatically and the item has more HP than its Broken Threshold, that effect also reduces the item's current HP to the Broken Threshold" | reach:object · effect:damage | An item broken outright drops to its Broken Threshold in Hit Points | pf2e: nothing — the text is all | ☐ | |

### CND-03 · Clumsy

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-03a | "Clumsy always includes a value" | — | The condition carries a value | pf2e: `value.isValued: true` | ✅ | Live: applied at 2, it reads clumsy 2 |
| CND-03b | "You take a status penalty equal to the condition value to Dexterity-based rolls and DCs, including AC, Reflex saves, ranged attack rolls, and skill checks using Acrobatics, Stealth, and Thievery" | effect:penalty | Status −value on AC, Reflex, ranged attacks, Acrobatics, Stealth and Thievery | pf2e: FlatModifier status `-@item.badge.value` on `dex-based` | ✅ | Live: Fixture (classless, level 1, 50 HP, a club) clumsy 2 → AC 10→8, Reflex, Acrobatics and Stealth −2; Athletics and the club Strike (Strength) unchanged — the control |

### CND-04 · Concealed

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-04a | "You can be concealed to some creatures but not others" | effect:concealment | One creature attacks the concealed one with a flat check, another without | pf2e: the condition is on the actor, for everyone. This module: `concealmentOf` in `scripts/riders/reveal.mjs` lets *Revealing Light* and *See the Unseen* change who counts | ☐ | |
| CND-04b | "While concealed, you can still be Observed, but you're tougher to target" | — | The concealed creature stays visible on the board | pf2e: the condition hides nothing | ☐ | |
| CND-04c | "A creature that you're concealed from must succeed at a flat when targeting you with an attack, spell, or other effect" | check:flat-check · effect:concealment | A DC 5 flat check before an attack, a targeted spell or another targeted effect | this module: `scripts/riders/unobserved.mjs` check gate "an attack on a concealed creature" (DC 5) — attack rolls only; a targeted spell with a save is not gated | ☐ | |
| CND-04d | "If the check fails, you aren't affected" | check:flat-check | A failed flat check stops the attack or effect | this module: the same gate refuses the attack roll on a failure; nothing for other effects | ☐ | |
| CND-04e | "Area effects aren't subject to this flat check" | check:flat-check | An area catching the concealed creature rolls no flat check | this module: the gate reads attack rolls only, so an area's save goes through | ☐ | |

### CND-05 · Confused

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-05a | "You are Off-Guard" | effect:condition | The confused creature is off-guard (−2 circumstance AC) | pf2e: GrantItem off-guard (in memory) | ✅ | Live: confused brought off-guard, AC 10→8 |
| CND-05b | "you don't treat anyone as your ally (though they might still treat you as theirs)" | reach:allies | Its abilities that help allies find none; it cannot flank for an ally | pf2e: RollOption `target:ally` and `origin:ally` false; ActiveEffectLike `canFlank` false | ☐ | |
| CND-05c | "you can't Delay, Ready, or use reactions" | effect:forbid | No reaction is offered to it; Delay and Ready are refused | pf2e: nothing. This module: `looksAbleToReact` in `scripts/riders/reactions.mjs` does not list confused, so its reaction cards are still offered | ☐ | |
| CND-05d | "You use all your actions to Strike or cast offensive cantrips" | effect:gm-note | The table is told the creature only Strikes or casts offensive cantrips | pf2e: nothing — the text is all | ☐ | |
| CND-05e | "Your targets are determined randomly by the GM" | effect:gm-note | Each of its attacks picks a random creature | pf2e: nothing — the text is all | ☐ | |
| CND-05f | "If you have no other viable targets, you target yourself, automatically hitting but not scoring a critical hit" | reach:self · check:degree-shift | With nobody else in reach, it hits itself, never critically | pf2e: nothing — the text is all | ☐ | |
| CND-05g | "If it's impossible for you to attack or cast spells, you babble incoherently, wasting your actions" | effect:forbid | A confused creature that cannot attack spends its actions on nothing | pf2e: nothing — the text is all | ☐ | |
| CND-05h | "Each time you take damage from an attack or spell, you can attempt a flat to recover from your confusion and end the condition" | when:damage-taken · check:flat-check · effect:condition-removed | Damage from an attack or spell offers a DC 11 flat check; success removes confused | pf2e: Note on `damage-received` for a spell or an attack, carrying a DC 11 flat-check link; rolling it and removing the condition is by hand | ☐ | |

### CND-06 · Controlled

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-06a | "The controller dictates how you act and can make you use any of your actions, including attacks, reactions, or even Delay" | effect:gm-note | The controller's player directs the controlled creature's actions | pf2e: nothing — the condition has no rules | ☐ | |
| CND-06b | "The controller usually doesn't have to spend their own actions when controlling you" | — | — | pf2e: nothing | — | The controller's action cost is set by the effect that controls, and ruled at the table |

### CND-07 · Cursebound

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-07a | "Cursebound is a condition that affects only creatures with an oracular curse" | — | Only an oracle with a curse carries it | pf2e: nothing on the item | ☐ | |
| CND-07b | "cursebound always includes a value" | — | The condition carries a value | pf2e: `value.isValued: true` | ✅ | Live: applied at 1, it reads cursebound 1 |
| CND-07c | "Your specific oracular curse imposes unique negative effects depending on your cursebound value" | — | The curse's own drawbacks follow the value | pf2e: nothing on this item — the curse's class feature carries them | ☐ | |
| CND-07d | "You can remove the cursebound condition only by Refocusing" | effect:condition-removed | Refocusing removes cursebound; nothing else does | pf2e: nothing — the condition is `perpetual`, and pf2e's Refocus is text | ☐ | |

### CND-08 · Dazzled

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-08a | "If vision is your only precise sense, all creatures and objects are Concealed from you" | effect:concealment · check:flat-check | A dazzled attacker rolls a DC 5 flat check against every target | pf2e: nothing — the condition has no rules. This module: the concealed gate in `scripts/riders/unobserved.mjs` reads the target's concealed, not the attacker's dazzled | ☐ | |

### CND-09 · Deafened

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-09a | "You can't hear" | effect:unobserved | A deafened creature detects nobody by hearing | pf2e: the hearing detection mode refuses a deafened listener (with rules-based vision on) | ☐ | |
| CND-09b | "You automatically critically fail Perception checks that require you to be able to hear" | check:degree-shift | A hearing-based Perception check comes out a critical failure | pf2e: AdjustDegreeOfSuccess to critical failure on `perception`, predicated on `item:trait:auditory` | ☐ | |
| CND-09c | "You take a –2 status penalty to Perception checks for initiative and checks that involve sound but also rely on other senses" | effect:penalty | −2 status on initiative and on sound-involving checks | pf2e: FlatModifier status −2 on `perception`/`skill-check`, predicated on initiative or an auditory skill check | ✅ | Live: initiative rolled deafened carried `deafened −2`; the same roll without it carried none, and a plain Perception check deafened left the −2 disabled |
| CND-09d | "If you perform an action that has the auditory trait, you must succeed at a flat or the action is lost" | check:flat-check | An auditory action rolls a DC 5 flat check and is lost on a failure | pf2e: ItemAlteration adds a note with a DC 5 flat-check link to auditory actions and feats and to every non-subtle spell; nothing rolls it or refuses the action | ☐ | |
| CND-09e | "attempt the check after spending the action but before any effects are applied" | check:flat-check | The action is spent even when the check fails | pf2e: nothing — the text is all | ☐ | |
| CND-09f | "You are immune to auditory effects while deafened" | effect:resistance | An auditory effect does not affect the deafened creature | pf2e: Immunity `auditory` | ✅ | Live: deafened put `auditory` among the immunities; without it, none |

### CND-10 · Doomed

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-10a | "Doomed always includes a value" | — | The condition carries a value | pf2e: `value.isValued: true` | ✅ | Live: applied at 2, it reads doomed 2 |
| CND-10b | "The Dying value at which you die is reduced by your doomed value" | effect:death | Doomed 1 makes dying 3 fatal | pf2e: `CreaturePF2e#prepareDerivedData` lowers `attributes.dying.max` by the doomed value | ✅ | Live: doomed 2 → dying maximum 4→2 |
| CND-10c | "If your maximum dying value is reduced to 0, you instantly die" | effect:death | Doomed 4 kills outright | pf2e: nothing — dying max reads 0 and nobody is killed | ❌ | Live: doomed 4 → dying maximum 0, and the fixture is not dead (`isDead` false); doomed 3 with dying 1 sat at its maximum, still alive |
| CND-10d | "When you die, you're no longer doomed" | effect:condition-removed | Death removes doomed | pf2e: nothing — the text is all | ☐ | |
| CND-10e | "Your doomed value decreases by 1 each time you get a full night's rest" | when:preparations · effect:condition-removed | Rest for the Night lowers doomed by 1 | pf2e: `restForTheNight` decreases doomed | ✅ | Live: Rest for the Night with doomed 2 → doomed 1 |

### CND-11 · Drained

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-11a | "Drained always includes a value" | — | The condition carries a value | pf2e: `value.isValued: true` | ✅ | Live: applied at 2, it reads drained 2 |
| CND-11b | "You take a status penalty equal to your drained value on Constitution-based rolls and DCs, such as Fortitude saves" | effect:penalty | Status −value on Fortitude and other Con-based rolls | pf2e: FlatModifier status `-1 * @item.badge.value` on `con-based` | ✅ | Live: drained 2 → Fortitude −2; Reflex and Will unchanged — the control |
| CND-11c | "You also lose a number of Hit Points equal to your level (minimum 1) times the drained value" | scaling:from-level | Gaining drained 2 at 3rd level takes 6 Hit Points | pf2e: LoseHitPoints `max(1,@actor.level) * @item.badge.value`, re-evaluated on update | ✅ | Live: drained 2 at level 1 → HP 50→48 |
| CND-11d | "your maximum Hit Points are reduced by the same amount" | effect:penalty · scaling:from-level | Maximum HP drops by level × value | pf2e: FlatModifier on `hp`, `min(-1 * @actor.level,-1) * @item.badge.value` | ✅ | Live: drained 2 → maximum HP 50→48 |
| CND-11e | "Losing these Hit Points doesn't count as taking damage" | — | The loss triggers nothing that answers damage | pf2e: LoseHitPoints writes HP without a damage roll | ✅ | Live: drained 1 took HP 50→49 and posted no damage card; 3 damage applied the ordinary way (control) took 3 |
| CND-11f | "Each time you get a full night's rest, your drained value decreases by 1" | when:preparations · effect:condition-removed | Rest for the Night lowers drained by 1 | pf2e: `restForTheNight` decreases drained | ✅ | Live: Rest for the Night with drained 2 → drained 1, maximum HP back to 49 |
| CND-11g | "This increases your maximum Hit Points, but you don't immediately recover the lost Hit Points" | — | Maximum HP rises on the decrease; current HP does not | pf2e: the `hp` modifier shrinks; LoseHitPoints only takes HP when the value rises | ☐ | |

### CND-12 · Dying

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-12a | "While you have this condition, you are Unconscious" | effect:condition | A dying creature is unconscious, and the unconscious cannot be removed while dying lasts | pf2e: GrantItem unconscious, `onDeleteActions.grantee: restrict` | ✅ | Live: dying 1 brought unconscious (and with it blinded, off-guard, prone) |
| CND-12b | "Dying always includes a value, and if it ever reaches dying 4, you die" | effect:condition-climbs · effect:death | Dying 4 (less doomed) kills | pf2e: `attributes.dying.max` is 4 less doomed and caps the value; nothing marks the creature dead | ⚠️ | Live: dying is valued and stops at its maximum of 4. Gap: at dying 4 the fixture is not dead (`isDead` false) — nothing kills |
| CND-12c | "When you're dying, you must attempt a recovery check at the start of your turn each round to determine whether you get better or worse" | when:turn-start · check:flat-check · effect:condition-climbs | At its turn start a recovery check (DC 10 + dying) is rolled and the value moves with it | pf2e: `ActorPF2e#rollRecovery` from the sheet's button — not at turn start, and the result is a note; the value is moved by hand | ❌ | Live, in combat: dying 1, the fixture's turn started (pf2e.startTurn fired) → no recovery check rolled, dying still 1 |
| CND-12d | "Your dying condition increases by 1 if you take damage while dying, or by 2 if you take damage from an enemy's critical hit or a critical failure on your save" | when:damage-taken · effect:condition-climbs | Damage while dying adds 1, or 2 on a critical hit or a critically failed save | pf2e: nothing — the text is all | ❌ | Live: dying 1 at 0 HP, 3 damage applied → still dying 1; the same damage at 50 HP (control) took 3 HP |
| CND-12e | "If you lose the dying condition by succeeding at a recovery check and are still at 0 Hit Points, you remain unconscious" | effect:condition | Stabilised at 0 HP, it stays unconscious | pf2e: nothing — the unconscious goes with the dying that granted it | ☐ | |
| CND-12f | "You lose the dying condition automatically and wake up if you ever have 1 Hit Point or more" | effect:stabilize · effect:condition-removed | Healing to 1 HP or more removes dying and unconscious | pf2e: nothing. This module: `revive` in `scripts/riders/apply.mjs`, for its own stabilising riders only | ❌ | Live: dying 1 at 0 HP, healed 5 → HP 5 and still dying 1 and unconscious |
| CND-12g | "Any time you lose the dying condition, you gain the Wounded 1 condition, or increase your wounded condition value by 1 if you already have that condition" | effect:condition-climbs | Losing dying adds wounded 1, or raises wounded by 1 | pf2e: nothing. This module: `loseDying` in `scripts/riders/apply.mjs`, when one of its riders removes dying | ❌ | Live: dying 1 removed → no wounded |

### CND-13 · Encumbered

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-13a | "You are carrying more weight than you can manage" | effect:condition | Carrying past the encumbered Bulk gives the condition | pf2e: `imposeEncumberedCondition` when the setting `automation.encumbrance` is on | ☐ | |
| CND-13b | "While you're encumbered, you're Clumsy 1" | effect:condition | Encumbered brings clumsy 1 | pf2e: GrantItem clumsy (in memory) | ✅ | Live: encumbered brought clumsy 1 (AC, Reflex, Acrobatics, Stealth −1) |
| CND-13c | "take a 10-foot penalty to all your Speeds" | effect:speed · effect:penalty | Every Speed is 10 feet lower | pf2e: FlatModifier −10 on `all-speeds` | ✅ | Live: encumbered → land Speed 25→15 |
| CND-13d | "As with all penalties to your Speed, this can't reduce your Speed below 5 feet" | effect:speed | A 10-foot Speed becomes 5, not 0 | pf2e: nothing — `SpeedStatistic#value` floors at 0, not 5 | ❌ | Live: land Speed lowered to 10, then encumbered → 0, not 5 |

### CND-14 · Enfeebled

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-14a | "Enfeebled always includes a value" | — | The condition carries a value | pf2e: `value.isValued: true` | ✅ | Live: applied at 2, it reads enfeebled 2 |
| CND-14b | "you take a status penalty equal to the condition value to Strength-based rolls and DCs, including Strength-based melee attack rolls, Strength-based damage rolls, and Athletics checks" | effect:penalty | Status −value on Strength-based attacks, damage and Athletics | pf2e: FlatModifier status `-@item.badge.value` on `str-based` and `str-damage` | ✅ | Live: enfeebled 2 → Athletics and the club Strike −2; Acrobatics unchanged — the control |

### CND-15 · Fascinated

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-15a | "You take a –2 status penalty to Perception and skill checks" | effect:penalty | −2 status on Perception and skill checks | pf2e: FlatModifier status −2 on `perception` and `skill-check` | ✅ | Live: fascinated → Perception and every skill −2; AC and saves unchanged — the control |
| CND-15b | "you can't use concentrate actions unless they (or their intended consequences) are related to the subject of your fascination, as determined by the GM" | effect:forbid · effect:gm-note | A concentrate action not about the subject is refused or put to the GM | pf2e: nothing — the text is all | ☐ | |
| CND-15c | "This condition ends if a creature uses hostile actions against you or any of your allies" | effect:condition-removed | A hostile action against the fascinated creature or an ally removes fascinated | pf2e: nothing — the text is all | ☐ | |

### CND-16 · Fatigued

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-16a | "You take a –1 status penalty to AC and saving throws" | effect:penalty | −1 status on AC and every save | pf2e: FlatModifier status −1 on `ac` and `saving-throw` | ✅ | Live: fatigued → AC and all three saves −1; skills unchanged — the control |
| CND-16b | "You can't use exploration activities performed while traveling" | effect:forbid | Exploration activities are refused while fatigued | pf2e: nothing — the text is all | ☐ | |
| CND-16c | "You recover from fatigue after a full night's rest" | when:preparations · effect:condition-removed | Rest for the Night removes fatigued | pf2e: `restForTheNight` removes fatigued | ✅ | Live: Rest for the Night removed fatigued |

### CND-17 · Fleeing

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-17a | "On your turn, you must spend each of your actions trying to escape the source of the fleeing condition as expediently as possible" | effect:gm-note | The table is told the creature spends its turn fleeing the source | pf2e: nothing — the condition has no rules | ☐ | |
| CND-17b | "The source is usually the effect or creature that gave you the condition, though some effects might define something else as the source" | — | The source is known: the condition's origin | pf2e: the condition's origin, when the effect that applied it sets one | ☐ | |
| CND-17c | "You can't Delay or Ready while fleeing" | effect:forbid | Delay and Ready are refused | pf2e: nothing — the text is all | ☐ | |

### CND-18 · Friendly

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-18a | "only supernatural effects (like a spell) can impose this condition on a PC" | — | — | pf2e: nothing | — | Who may be given an attitude is the GM's call |
| CND-18b | "It is likely to agree to Requests from that character as long as they are simple, safe, and don't cost too much to fulfill" | — | — | pf2e: nothing | — | Roleplaying |
| CND-18c | "If the character (or one of their allies) uses hostile actions against the creature, the creature gains a worse attitude condition depending on the severity of the hostile action, as determined by the GM" | — | — | pf2e: nothing; its `overrides` keep one attitude at a time | — | The new attitude is a GM ruling |

### CND-19 · Frightened

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-19a | "The frightened condition always includes a value" | — | The condition carries a value | pf2e: `value.isValued: true` | ✅ | Live: applied at 2, it reads frightened 2 |
| CND-19b | "You take a status penalty equal to this value to all your checks and DCs" | effect:penalty | Status −value on every check and DC | pf2e: FlatModifier status `-@item.badge.value` on `all` | ✅ | Live: frightened 2 → every check, the Strike and AC (a DC) −2 |
| CND-19c | "Unless specified otherwise, at the end of each of your turns, the value of your frightened condition decreases by 1" | when:turn-end · effect:condition-removed | At its turn end frightened 2 becomes 1, and frightened 1 ends | pf2e: nothing — `CombatantPF2e#onEndTurn` rolls only persistent damage | ❌ | Live, in combat: frightened 2, the fixture's turn ended (pf2e.endTurn fired, and a 0-round turn-end effect beside it expired — the control) → still frightened 2 |

### CND-20 · Grabbed

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-20a | "giving you the Off-Guard and Immobilized conditions" | effect:condition | A grabbed creature is off-guard and immobilized | pf2e: GrantItem off-guard and immobilized (in memory) | ✅ | Live: grabbed brought off-guard and immobilized, AC 10→8 |
| CND-20b | "If you attempt a manipulate action while grabbed, you must succeed at a flat or it is lost" | check:flat-check | A manipulate action rolls a DC 5 flat check and is lost on a failure | pf2e: ItemAlteration adds a note with a DC 5 flat-check link to manipulate actions, feats and spells; nothing rolls it or refuses the action | ☐ | |
| CND-20c | "roll the check after spending the action, but before any effects are applied" | check:flat-check | The action is spent even when the check fails | pf2e: nothing — the text is all | ☐ | |

### CND-21 · Helpful

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-21a | "only supernatural effects (like a spell) can impose this condition on a PC" | — | — | pf2e: nothing | — | Who may be given an attitude is the GM's call |
| CND-21b | "It will accept reasonable Requests from that character, as long as such requests aren't at the expense of the helpful creature's goals or quality of life" | — | — | pf2e: nothing | — | Roleplaying |
| CND-21c | "If the character (or one of their allies) uses a hostile action against the creature, the creature gains a worse attitude condition depending on the severity of the hostile action, as determined by the GM" | — | — | pf2e: nothing; its `overrides` keep one attitude at a time | — | The new attitude is a GM ruling |

### CND-22 · Hidden

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-22a | "that creature knows the space you're in but can't tell precisely where you are" | effect:unobserved | The hidden creature is not seen, but its space is known | pf2e: sight detection refuses a hidden creature; hearing still finds it (rules-based vision) | ☐ | |
| CND-22b | "When Seeking a creature using only imprecise senses, it remains hidden, rather than Observed" | effect:unobserved | A Seek by an imprecise sense leaves it hidden | pf2e: nothing — the text is all | ☐ | |
| CND-22c | "A creature you're hidden from is Off-Guard to you" | effect:condition | The hidden creature's attacks find their target off-guard | pf2e: nothing. This module: `scripts/riders/unobserved.mjs` does it only for its own Unobserved effect, not this condition | ☐ | |
| CND-22d | "it must succeed at a flat when targeting you with an attack, spell, or other effect or it fails to affect you" | check:flat-check | A DC 11 flat check before targeting the hidden creature; a failure affects nothing | pf2e: nothing. This module: the DC 11 gate in `scripts/riders/unobserved.mjs` reads its Unobserved effect, not the hidden condition | ☐ | |
| CND-22e | "Area effects aren't subject to this flat check" | check:flat-check | An area catches the hidden creature with no flat check | this module: `scripts/targeting/catch.mjs` catches it (it refuses only a GM-hidden token) | ☐ | |
| CND-22f | "A creature might be able to use the seek action to try to observe you" | — | Seek can end it | pf2e: its Seek action | ☐ | |

### CND-23 · Hostile

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-23a | "only supernatural effects (like a spell) can impose on a PC" | — | — | pf2e: nothing | — | Who may be given an attitude is the GM's call |
| CND-23b | "A creature hostile to a character actively seeks to harm that character" | — | — | pf2e: nothing; its `overrides` keep one attitude at a time | — | Roleplaying |
| CND-23c | "It doesn't necessarily attack, but it won't accept Requests from the character" | — | — | pf2e: nothing | — | Roleplaying |

### CND-24 · Immobilized

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-24a | "You can't use any actions that have the move trait" | effect:forbid | Stride, Step and other move actions are refused, and the token does not move | pf2e: nothing — the condition has no rules | ☐ | |
| CND-24b | "If you're immobilized by something holding you in place and an external force would move you out of your space, the force must succeed at a check against either the DC of the effect holding you in place or the relevant defense (usually Fortitude DC) of the monster holding you in place" | check:maneuver | A push or pull on a held creature first beats the hold's DC | pf2e: nothing. This module: its push and pull riders do not test for a hold | ☐ | |

### CND-25 · Indifferent

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-25a | "only supernatural effects (like a spell) can impose this condition on a PC" | — | — | pf2e: nothing | — | Who may be given an attitude is the GM's call |
| CND-25b | "A creature that is indifferent to a character doesn't really care one way or the other about that character" | — | — | pf2e: nothing | — | Roleplaying |
| CND-25c | "Assume a creature's attitude to a given character is indifferent unless specified otherwise" | — | — | pf2e: nothing; its `overrides` keep one attitude at a time | — | The default attitude is a GM assumption |

### CND-26 · Invisible

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-26a | "You can't be seen" | effect:unobserved | Sight finds no invisible creature, unless it sees invisibility | Foundry: the `invisible` status hides a token from sight without see-invisibility; no rule element on the item | ☐ | |
| CND-26b | "You're Undetected to everyone" | effect:condition | An invisible creature is undetected | pf2e: nothing grants undetected | ☐ | |
| CND-26c | "Creatures can Seek to detect you; if a creature succeeds at its Perception check against your Stealth DC, you become Hidden to that creature until you Sneak to become undetected again" | effect:condition | A successful Seek makes it hidden to the seeker | pf2e: nothing — the text is all | ☐ | |
| CND-26d | "If you become invisible while someone can already see you, you start out hidden to them (instead of undetected) until you successfully Sneak" | effect:condition | Turning invisible in plain view gives hidden, not undetected | pf2e: nothing — the text is all | ☐ | |
| CND-26e | "You can't become Observed while invisible except via special abilities or magic" | effect:unobserved · effect:reveal | Only a revealing effect makes it observed | this module: `scripts/riders/reveal.mjs` (*Revealing Light*, *See the Unseen*) — the special magic; nothing else needed | ☐ | |

### CND-27 · Observed

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-27a | "Anything in plain view is observed by you" | — | A visible creature is observed by default | Foundry: sight detection | ☐ | |
| CND-27b | "If a creature takes measures to avoid detection, such as by using Stealth to Hide, it can become Hidden or Undetected instead of observed" | effect:condition | Hide makes the creature hidden | pf2e: nothing on this item | ☐ | |
| CND-27c | "If you have another precise sense besides sight, you might be able to observe a creature or object using that sense instead" | effect:sense | A precise non-visual sense observes what sight cannot | pf2e: its senses and detection modes | ☐ | |
| CND-27d | "You can observe a creature with only your precise senses" | effect:sense | An imprecise sense alone never observes | pf2e: hearing detects but does not observe | ☐ | |
| CND-27e | "When Seeking a creature using only imprecise senses, it remains hidden, rather than observed" | effect:unobserved | A Seek by an imprecise sense leaves it hidden | pf2e: nothing — the text is all | ☐ | |

### CND-28 · Off-Guard

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-28a | "You take a –2 circumstance penalty to AC" | effect:penalty | −2 circumstance to AC | pf2e: FlatModifier circumstance −2 on `ac` | ✅ | Live: off-guard → AC 10→8, nothing else |
| CND-28b | "Some effects give you the off-guard condition only to certain creatures or against certain attacks" | effect:condition | Off-guard to one attacker leaves the AC against others untouched | pf2e: the condition is on the actor, for everyone; flanking gives a per-attacker off-guard | ☐ | |
| CND-28c | "If a rule doesn't specify that the condition applies only to certain circumstances, it applies to all of them" | — | Plain off-guard counts against every attack | pf2e: the condition's modifier applies everywhere | ☐ | |

### CND-29 · Paralyzed

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-29a | "You have the Off-Guard condition" | effect:condition | A paralyzed creature is off-guard | pf2e: GrantItem off-guard (in memory) | ✅ | Live: paralyzed brought off-guard, AC 10→8 |
| CND-29b | "can't act except to Recall Knowledge and use actions that require only your mind (as determined by the GM)" | effect:forbid | Every action but Recall Knowledge and purely mental ones is refused | pf2e: `canAct` false and `canFlank` false; nothing refuses an action. This module: no reaction card for it (`looksAbleToReact`, `scripts/riders/reactions.mjs`) | ☐ | |
| CND-29c | "Your senses still function, but only in the areas you can perceive without moving, so you can't Seek" | effect:forbid | Seek is refused | pf2e: nothing — the text is all | ☐ | |

### CND-30 · Persistent Damage

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-30a | "Like normal damage, it can be doubled or halved based on the results of an attack roll or saving throw" | effect:persistent | A critical hit's persistent damage is doubled; a save's degree halves or doubles it | pf2e: the condition records `criticalHit` from the damage roll and doubles on it | ☐ | |
| CND-30b | "Instead of taking persistent damage immediately, you take it at the end of each of your turns as long as you have the condition, rolling any damage dice anew each time" | when:turn-end · effect:persistent | At each of its turn ends the damage is rolled anew and taken | pf2e: `ConditionPF2e#onEndTurn` posts a fresh roll at the turn end; applying it is a click on the card | ⚠️ | Live, in combat: persistent 2 fire, the turn ended → pf2e posted the damage roll, but HP stayed 50. Gap: the damage waits for a button |
| CND-30c | "After you take persistent damage, roll a flat to see if you recover from the persistent damage" | check:flat-check · effect:persistent | A DC 15 flat check follows each tick | pf2e: the card's recovery button (`rollRecovery`, DC from the condition, 15 by default); not rolled by itself | ⚠️ | Live: no recovery check rolled at the turn end; `rollRecovery` (the card's button) rolls the DC 15 flat. Gap: a button, not by itself |
| CND-30d | "If you succeed, the condition ends" | effect:condition-removed | Success removes that persistent damage | pf2e: `rollRecovery` removes the condition on a success | ✅ | Live: recovery with the die forced high → the condition ended; forced low (control) → it stayed |

### CND-31 · Petrified

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-31a | "You can't act, nor can you sense anything" | effect:forbid · effect:unobserved | Every action is refused and the creature perceives nothing | pf2e: nothing — the condition has no rules. This module: no reaction card for it (`looksAbleToReact`, `scripts/riders/reactions.mjs`) | ☐ | |
| CND-31b | "You become an object with a Bulk double your normal Bulk (typically 12 for a petrified Medium creature or 6 for a petrified Small creature), AC 9, Hardness 8, and the same current Hit Points you had when alive" | effect:form · effect:hardness | It reads AC 9 and Hardness 8, keeps its HP, and weighs double | pf2e: nothing — the text is all | ☐ | |
| CND-31c | "You don't have a Broken Threshold" | — | The statue never becomes broken | pf2e: nothing | ☐ | |
| CND-31d | "When the petrified condition ends, you have the same number of Hit Points you had as a statue" | — | Damage to the statue is still there afterwards | pf2e: nothing — HP are the actor's own throughout | ☐ | |
| CND-31e | "If the statue is destroyed, you immediately die" | effect:death | Reducing the statue to 0 HP kills the creature | pf2e: nothing — the text is all | ☐ | |
| CND-31f | "While petrified, your mind and body are in stasis, so you don't age or notice the passing of time" | — | — | pf2e: nothing | — | Roleplaying |

### CND-32 · Prone

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-32a | "You are Off-Guard" | effect:condition | A prone creature is off-guard | pf2e: GrantItem off-guard (in memory) | ✅ | Live: prone brought off-guard, AC 10→8 |
| CND-32b | "take a –2 circumstance penalty to attack rolls" | effect:penalty | −2 circumstance on every attack roll | pf2e: FlatModifier circumstance −2 on `attack-roll` | ✅ | Live: prone → club Strike −2; skills unchanged — the control |
| CND-32c | "The only move actions you can use while you're prone are Crawl and Stand" | effect:forbid | Stride, Step and Leap are refused; Crawl and Stand are not | pf2e: the token's movement actions offer Crawl, not Walk or Jump (canvas only); the actions themselves are not refused | ☐ | |
| CND-32d | "Standing up ends the prone condition" | effect:condition-removed | Stand removes prone | pf2e: its Stand action removes prone | ☐ | |
| CND-32e | "You can Take Cover while prone to hunker down and gain greater cover against ranged attacks, even if you don't have an object to get behind, which grants you a +4 circumstance bonus to AC against ranged attacks (but you remain off-guard)" | effect:cover · effect:bonus | Taking Cover while prone gives +4 AC against ranged attacks only, and off-guard stays | pf2e: its Take Cover action posts `Effect: Cover` with a grade to choose; nothing here limits it to ranged attacks | ☐ | |
| CND-32f | "If you would be knocked prone while you're Climbing or Flying, you fall" | effect:elevation/fall | A climbing or flying creature knocked prone falls | pf2e: nothing — the text is all | ☐ | |
| CND-32g | "You can't be knocked prone when Swimming" | effect:resistance | A swimming creature refuses prone | pf2e: nothing — the text is all | ☐ | |

### CND-33 · Quickened

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-33a | "You gain 1 additional action at the start of your turn each round" | when:turn-start · economy:extra-action | Four actions at the start of each turn | pf2e: nothing — the condition has no rules and pf2e counts no actions | ☐ | |
| CND-33b | "Many effects that make you quickened require you use this extra action only in certain ways" | economy:extra-action | The extra action is usable only for what its source names | pf2e: nothing — the text is all | ☐ | |
| CND-33c | "If you become quickened from multiple sources, you can use the extra action you've been granted for any single action allowed by any of the effects that made you quickened" | economy:extra-action | Two sources still give one extra action, usable for either's list | pf2e: nothing — the text is all | ☐ | |
| CND-33d | "Because quickened has its effect at the start of your turn, you don't immediately gain actions if you become quickened during your turn" | when:turn-start | Quickened mid-turn adds nothing until the next turn | pf2e: nothing — the text is all | ☐ | |

### CND-34 · Restrained

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-34a | "You have the Off-Guard and Immobilized conditions" | effect:condition | A restrained creature is off-guard and immobilized | pf2e: GrantItem off-guard and immobilized (in memory); ActiveEffectLike `canFlank` false | ✅ | Live: restrained brought off-guard and immobilized, AC 10→8 |
| CND-34b | "you can't use any attack or manipulate actions except to attempt to Escape or Force Open your bonds" | effect:forbid | Attacks and manipulate actions other than Escape and Force Open are refused | pf2e: a Note on attacks and skill checks other than Escape and Force Open, and a description note on manipulate items; nothing is refused. This module: `scripts/riders/forbids.mjs` refuses these only for an effect carrying `forbids` | ☐ | |
| CND-34c | "Restrained overrides Grabbed" | effect:suppress | A grabbed creature that is restrained loses grabbed's effects while restrained lasts | pf2e: `overrides: ["grabbed"]` — `ConditionPF2e#prepareSiblingData` deactivates grabbed | ✅ | Live: grabbed, then restrained → grabbed kept but inactive; grabbed alone is active (control) |

### CND-35 · Sickened

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-35a | "Sickened always includes a value" | — | The condition carries a value | pf2e: `value.isValued: true` | ✅ | Live: applied at 2, it reads sickened 2 |
| CND-35b | "You take a status penalty equal to this value on all your checks and DCs" | effect:penalty | A status penalty of the value on every check and DC | pf2e: FlatModifier status `-@item.badge.value` on `all` | ✅ | Live: sickened 2 → every check, the Strike and AC −2 |
| CND-35c | "You can't willingly ingest anything-including elixirs and potions-while sickened" | effect:forbid | Drinking an elixir or potion is refused while sickened | pf2e: an ItemAlteration notes it on ingested consumables; nothing refuses the use | ☐ | |
| CND-35d | "You can spend a single action retching in an attempt to recover, which lets you immediately attempt a Fortitude save against the DC of the effect that made you sickened" | economy:granted-action · check:save | A one-action retch, rolled as a Fortitude save at the DC of what sickened the creature | pf2e: nothing — no action on the item, and the source's DC is not kept | ☐ | |
| CND-35e | "On a success, you reduce your sickened value by 1 (or by 2 on a critical success)" | check:save · effect:condition-climbs | The value drops by 1, or by 2 on a critical success | pf2e: nothing | ☐ | |

### CND-36 · Slowed

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-36a | "Slowed always includes a value" | — | The condition carries a value | pf2e: `value.isValued: true` | ✅ | Live: applied at 1, it reads slowed 1 |
| CND-36b | "When you regain your actions, reduce the number of actions regained by your slowed value" | when:turn-start | Slowed 1 leaves two actions at the start of the turn | pf2e: nothing — the condition has no rules and pf2e counts no actions | ☐ | |
| CND-36c | "Because you regain actions at the start of your turn, you don't immediately lose actions if you become slowed during your turn" | when:turn-start | Slowed mid-turn takes nothing until the next turn | pf2e: nothing — the text is all | ☐ | |

### CND-37 · Stunned

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-37a | "You can't act" | effect:forbid | Every action is refused while stunned | pf2e: `canAct` false (it stops flanking); nothing refuses an action. This module: no reaction card for it (`looksAbleToReact`, `scripts/riders/reactions.mjs`) | ☐ | |
| CND-37b | "Stunned usually includes a value, which indicates how many total actions you lose, possibly over multiple turns, from being stunned" | — | The value counts actions lost in all | pf2e: `value.isValued: true` | ✅ | Live: applied at 1, it reads stunned 1 |
| CND-37c | "Each time you regain actions, reduce the number you regain by your stunned value, then reduce your stunned value by the number of actions you lost" | when:turn-start · effect:condition-removed | Stunned 4 takes all three actions and leaves stunned 1; next turn one more, and it ends | pf2e: nothing — pf2e counts no actions and never lowers stunned | ❌ | Live, in combat: stunned 1, the fixture's turn started (pf2e.startTurn fired) → still stunned 1 |
| CND-37d | "Stunned might also have a duration instead, such as "stunned for 1 minute," causing you to lose all your actions for the duration" | ending:duration | A duration stun takes every action until it ends | pf2e: nothing on the item; an effect granting it carries the duration | ☐ | |
| CND-37e | "Stunned overrides Slowed" | effect:suppress | A slowed creature that is stunned loses slowed's effects while stunned lasts | pf2e: `overrides: ["slowed"]` — `ConditionPF2e#prepareSiblingData` deactivates slowed | ✅ | Live: slowed 1, then stunned 1 → slowed kept but inactive; slowed alone is active (control) |
| CND-37f | "If the duration of your stunned condition ends while you are slowed, you count the actions lost to the stunned condition toward those lost to being slowed" | when:turn-start | Stunned 1 and slowed 2 leave one action, not zero | pf2e: nothing — the text is all | ☐ | |

### CND-38 · Stupefied

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-38a | "Stupefied always includes a value" | — | The condition carries a value | pf2e: `value.isValued: true` | ✅ | Live: applied at 2, it reads stupefied 2 |
| CND-38b | "You take a status penalty equal to this value on Intelligence-, Wisdom-, and Charisma-based rolls and DCs, including Will saving throws, spell attack modifiers, spell DCs, and skill checks that use these attribute modifiers" | effect:penalty | Status −value on Will, spell attacks, spell DCs and Int-, Wis- and Cha-based skills | pf2e: FlatModifier status `-@item.badge.value` on `int-based`, `wis-based` and `cha-based` | ✅ | Live: stupefied 2 → Will, Perception, Arcana, Diplomacy and Religion −2; Fortitude and Athletics unchanged — the control |
| CND-38c | "Any time you attempt to Cast a Spell while stupefied, the spell is disrupted unless you succeed at a flat with a DC equal to 5 + your stupefied value" | when:cast · check:flat-check | Each cast rolls a flat check against 5 + value, and a failure loses the spell | pf2e: ItemAlteration adds a note with the flat-check link to every spell; nothing rolls it. This module: nothing in `scripts/cast-pipeline.mjs` | ☐ | |

### CND-39 · Unconscious

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-39a | "You can't act" | effect:forbid | Every action is refused while unconscious | pf2e: `canAct` false; nothing refuses an action. This module: no reaction card for it (`looksAbleToReact`, `scripts/riders/reactions.mjs`) | ☐ | |
| CND-39b | "You take a –4 status penalty to AC, Perception, and Reflex saves" | effect:penalty | −4 status on AC, Perception and Reflex | pf2e: FlatModifier status −4 on `ac`, `perception` and `reflex` | ✅ | Live: unconscious → AC 10→4 (−4 with off-guard's −2), Reflex and Perception −4; Fortitude unchanged — the control |
| CND-39c | "you have the Blinded and Off-Guard conditions" | effect:condition | An unconscious creature is blinded and off-guard | pf2e: GrantItem blinded (deletion restricted) and off-guard (in memory) | ✅ | Live: unconscious brought blinded and off-guard |
| CND-39d | "When you gain this condition, you fall Prone" | effect:condition | Falling unconscious adds prone, which stays after waking | pf2e: GrantItem prone, detached when unconscious ends | ✅ | Live: unconscious brought prone, which stayed after unconscious went |
| CND-39e | "drop items you're holding unless the effect states otherwise or the GM determines you're positioned so you wouldn't" | effect:disarm | Held items are dropped | pf2e: nothing — the text is all | ☐ | |
| CND-39f | "If you're unconscious because you're Dying, you can't wake up while you have 0 Hit Points" | effect:condition-floor | Unconscious cannot be removed while dying at 0 HP | pf2e: dying's GrantItem restricts deleting the unconscious it grants | ☐ | |
| CND-39g | "If you are restored to 1 Hit Point or more, you lose the dying and unconscious conditions and can act normally on your next turn" | effect:stabilize · effect:condition-removed | Healing to 1 HP removes dying and unconscious | pf2e: nothing. This module: `revive` in `scripts/riders/apply.mjs`, for its own stabilising riders only | ❌ | Live: dying 1 at 0 HP, healed 5 → still dying 1 and unconscious |
| CND-39h | "If you are unconscious and at 0 Hit Points, but not dying, you return to 1 Hit Point and awaken after sufficient time passes" | effect:heal · effect:condition-removed | After the time passes it is at 1 HP and awake | pf2e: nothing — the text is all | ☐ | |
| CND-39i | "The GM determines how long you remain unconscious, from a minimum of 10 minutes to several hours" | — | — | pf2e: nothing | — | The time is a GM ruling |
| CND-39j | "If you are healed, you lose the unconscious condition and can act normally on your next turn" | effect:condition-removed | Any healing at 0 HP removes unconscious | pf2e: nothing — the text is all | ❌ | Live: unconscious (not dying) at 5 HP, healed 3 → HP 8, still unconscious |
| CND-39k | "You take damage, though if the damage reduces you to 0 Hit Points, you remain unconscious and gain the dying condition as normal" | when:damage-taken · effect:condition-removed | A sleeper above 1 HP wakes on damage, or turns dying at 0 HP | pf2e: nothing — the text is all | ☐ | |
| CND-39l | "You receive healing, other than the natural healing you get from resting" | effect:condition-removed | Healing other than rest wakes it | pf2e: nothing — the text is all | ☐ | |
| CND-39m | "Someone shakes you awake with an Interact action" | effect:condition-removed | An Interact by an adjacent creature wakes it | pf2e: nothing — the text is all | ☐ | |
| CND-39n | "At the start of your turn, you automatically attempt a Perception check against the noise's DC (or the lowest DC if there is more than one noise), waking up if you succeed" | when:turn-start · effect:condition-removed | At its turn start a Perception check against the noise's DC; success wakes it | pf2e: nothing — the text is all | ☐ | |
| CND-39o | "If creatures are attempting to stay quiet around you, this Perception check uses their Stealth DCs" | — | The check's DC is the quiet creatures' Stealth DC | pf2e: nothing — the text is all | ☐ | |
| CND-39p | "Some effects make you sleep so deeply that they don't allow you this Perception check" | — | Such an effect suppresses the turn-start check | pf2e: nothing — the text is all | ☐ | |
| CND-39q | "If you are simply asleep, the GM decides you wake up either because you have had a restful night's sleep or something disrupted that rest" | — | — | pf2e: nothing | — | Waking from sleep is a GM ruling |

### CND-40 · Undetected

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-40a | "When you are undetected by a creature, that creature can't see you at all, has no idea what space you occupy, and can't target you" | effect:unobserved | The undetected creature does not show for the other and cannot be targeted by it | pf2e: sight and hearing detection both refuse an undetected creature (rules-based vision); targeting is not refused | ☐ | |
| CND-40b | "you still can be affected by abilities that target an area" | — | An area still catches it | this module: `scripts/targeting/catch.mjs` catches it (it refuses only a GM-hidden token) | ☐ | |
| CND-40c | "When you're undetected by a creature, that creature is Off-Guard to you" | effect:condition | Its attacks find their target off-guard | pf2e: nothing. This module: `scripts/riders/unobserved.mjs` does it only for its own Unobserved effect | ☐ | |
| CND-40d | "A creature you're undetected by can guess which square you're in to try targeting you" | effect:gm-note | An attack may be aimed at a guessed square | pf2e: nothing — the text is all | ☐ | |
| CND-40e | "This works like targeting a Hidden creature (requiring a flat), but the flat check and attack roll are rolled in secret by the GM, who doesn't reveal whether the attack missed due to failing the flat check, failing the attack roll, or choosing the wrong square" | check:flat-check · check:secret | A secret DC 11 flat check and a secret attack roll, with one undistinguished miss | pf2e: nothing — the text is all | ☐ | |
| CND-40f | "They can Seek to try to find you" | — | Seek can end it | pf2e: its Seek action | ☐ | |

### CND-41 · Unfriendly

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-41a | "only supernatural effects (like a spell) can impose this condition on a PC" | — | — | pf2e: nothing | — | Who may be given an attitude is the GM's call |
| CND-41b | "A creature that is unfriendly to a character dislikes and distrusts that character" | — | — | pf2e: nothing; its `overrides` keep one attitude at a time | — | Roleplaying |
| CND-41c | "The unfriendly creature won't accept Requests from the character" | — | — | pf2e: nothing | — | Roleplaying |

### CND-42 · Unnoticed

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-42a | "If you're unnoticed by a creature, that creature has no idea you're present" | effect:unobserved | The unnoticed creature does not show for the other | pf2e: sight and hearing detection both refuse an unnoticed creature (rules-based vision) | ☐ | |
| CND-42b | "When you're unnoticed, you're also Undetected" | effect:condition | An unnoticed creature is undetected too | pf2e: nothing grants undetected | ☐ | |
| CND-42c | "This matters for abilities that can be used only against targets totally unaware of your presence" | economy:requires | An ability that needs an unaware target is allowed against it, and refused otherwise | pf2e: nothing on the item; such abilities predicate on the target's condition | ☐ | |

### CND-43 · Wounded

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-43a | "If you lose the Dying condition and do not already have the wounded condition, you become wounded 1" | effect:condition | Losing dying gives wounded 1 | pf2e: nothing. This module: `loseDying` in `scripts/riders/apply.mjs`, when one of its riders removes dying | ❌ | Live: dying 1 removed → no wounded |
| CND-43b | "If you already have the wounded condition when you lose the dying condition, your wounded condition value increases by 1" | effect:condition-climbs | Losing dying while wounded 1 gives wounded 2 | pf2e: nothing. This module: `loseDying` (riders only) | ❌ | Live: wounded 1, then dying 1 removed → still wounded 1 |
| CND-43c | "If you gain the dying condition while wounded, increase your dying condition value by your wounded value" | effect:condition-climbs | Wounded 2 at 0 HP gives dying 3 | pf2e: nothing — the text is all | ❌ | Live: wounded 1, then dying 1 → dying 1, not 2 |
| CND-43d | "The wounded condition ends if someone successfully restores Hit Points to you using Treat Wounds" | effect:condition-removed | A Treat Wounds that heals removes wounded | pf2e: nothing — the text is all | ☐ | |
| CND-43e | "or if you are restored to full Hit Points by any means and rest for 10 minutes" | effect:condition-removed | Full HP and 10 minutes' rest remove wounded | pf2e: only `restForTheNight` removes wounded, and only at full HP; a 10-minute rest does not | ⚠️ | Live: Rest for the Night at full HP removed wounded 1. Gap: the text's 10 minutes' rest at full HP removes nothing — only a night's rest does |
