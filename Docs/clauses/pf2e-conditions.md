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

**191 clauses:** 111 ✅, 22 ⚠️, 7 ❌, 1 🔧, 9 ☐, 41 —. Driven live in world `pf` (pf2e 8.4.1) on a clean, classless
level-1 fixture with 50 HP and a club, beside an NPC target; each reading against the same fixture without the condition, or with
the **Automate conditions** setting off. What pf2e leaves undone, `scripts/conditions/` does, behind that setting.

### CND-01 · Blinded

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-01a | "You can't detect anything using vision" | effect:unobserved | A blinded creature's token sees nothing by sight; others are not shown to it by vision | pf2e: `visionLevel` is BLINDED and `canSee` false with the condition (Foundry's blind status); no rule element on the item | ✅ | Live, with pf2e's rules-based vision on (off in world `pf`, switched on for the drive and back): blinded, the fixture perceives the target only by hearing (filtered), and pf2e reads `canSee` false; unblinded (control) it sees it plainly |
| CND-01b | "All normal terrain is difficult terrain to you" | effect:terrain | Every square costs the blinded creature double movement | this module: `scripts/conditions/index.mjs` (a movement cost stage) | ✅ | Live: a blinded token's 5-foot step costs 10; unblinded (control) 5 |
| CND-01c | "You automatically critically fail Perception checks that require you to be able to see" | check:degree-shift | A sight-based Perception check comes out a critical failure whatever the die | pf2e: nothing — no AdjustDegreeOfSuccess on this item | ❌ | Live: a Perception check rolled blinded with a natural 20 → critical success. Nothing marks a check as needing sight; that is a ruling |
| CND-01d | "if vision is your only precise sense, you take a –4 status penalty to Perception checks" | effect:penalty | −4 status to Perception, and none for a creature with another precise sense | pf2e: FlatModifier status −4 on `perception`, unconditional — it also applies to a creature with another precise sense | ⚠️ | Live: Fixture (classless, level 1, 50 HP, a club) blinded → Perception 0 → −4. Gap: with a precise tremorsense added it is still −4 — the penalty ignores the condition's "only precise sense" |
| CND-01e | "You are immune to visual effects" | effect:resistance | A visual effect does not affect the blinded creature | pf2e: Immunity `visual` | ✅ | Live: blinded put `visual` among the fixture's immunities; without it, none |
| CND-01f | "Blinded overrides Dazzled" | effect:suppress | A dazzled creature that is blinded loses dazzled's effects while blinded lasts, and gets them back after | pf2e: `overrides: ["dazzled"]` — `ConditionPF2e#prepareSiblingData` deactivates dazzled | ✅ | Live: dazzled, then blinded → only blinded active (dazzled kept, inactive); dazzled alone is active (control) |

### CND-02 · Broken

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-02a | "Broken is a condition that affects only objects" | reach:object | Broken is never put on a creature by these rules | pf2e: nothing on the item; a physical item's `isBroken` is derived from its Hit Points | — | A definition: what the condition is for |
| CND-02b | "An object is broken when damage has reduced its Hit Points to equal or less than its Broken Threshold" | reach:object · effect:condition | An item damaged to its Broken Threshold reads broken | pf2e: `PhysicalItemPF2e#isBroken` (HP against BT); the condition item carries no rules | ✅ | Live: a wooden shield at HP 12 (BT 6), reduced to 6 → broken |
| CND-02c | "A broken object can't be used for its normal function, nor does it grant bonuses—with the exception of armor" | reach:object · effect:forbid | A broken shield grants no AC and cannot Shield Block; a broken item is refused its use | pf2e: a broken shield's `acBonus` is 0 and it is left out of Shield Block; other items: nothing | ✅ | Live: the same shield's AC bonus 2 → 0 once broken |
| CND-02d | "Broken armor still grants its item bonus to AC, but it also imparts a status penalty to AC depending on its category: –1 for broken light armor, –2 for broken medium armor, or –3 for broken heavy armor" | effect:penalty | Broken light, medium or heavy armor gives −1, −2 or −3 status to AC, item bonus kept | pf2e: nothing found for armor in 8.4.1 | ❌ | Live: leather armor has no Hit Points in pf2e (0/0), so it never breaks, and no broken-armor penalty exists |
| CND-02e | "A broken item still imposes penalties and limitations normally incurred by carrying, holding, or wearing it" | effect:penalty | Broken armor keeps its Dex cap, check penalty and Speed penalty | pf2e: nothing removes them, so they stay | ❌ | Live: as CND-02d — armor cannot break in pf2e, so this never arises |
| CND-02f | "If an effect makes an item broken automatically and the item has more HP than its Broken Threshold, that effect also reduces the item's current HP to the Broken Threshold" | reach:object · effect:damage | An item broken outright drops to its Broken Threshold in Hit Points | pf2e: nothing — the text is all | — | An instruction to effects that break items; none to automate generically |

### CND-03 · Clumsy

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-03a | "Clumsy always includes a value" | — | The condition carries a value | pf2e: `value.isValued: true` | ✅ | Live: applied at 2, it reads clumsy 2 |
| CND-03b | "You take a status penalty equal to the condition value to Dexterity-based rolls and DCs, including AC, Reflex saves, ranged attack rolls, and skill checks using Acrobatics, Stealth, and Thievery" | effect:penalty | Status −value on AC, Reflex, ranged attacks, Acrobatics, Stealth and Thievery | pf2e: FlatModifier status `-@item.badge.value` on `dex-based` | ✅ | Live: Fixture (classless, level 1, 50 HP, a club) clumsy 2 → AC 10→8, Reflex, Acrobatics and Stealth −2; Athletics and the club Strike (Strength) unchanged — the control |

### CND-04 · Concealed

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-04a | "You can be concealed to some creatures but not others" | effect:concealment | One creature attacks the concealed one with a flat check, another without | pf2e: the condition is on the actor, for everyone. This module: `concealmentOf` in `scripts/riders/reveal.mjs` lets *Revealing Light* and *See the Unseen* change who counts | ⚠️ | Live: the concealment gate made the fixture's attack on a concealed target roll its flat check. Gap: pf2e's condition is on the creature, for every observer; only this module's per-pair *unobserve* effect is one creature's |
| CND-04b | "While concealed, you can still be Observed, but you're tougher to target" | — | The concealed creature stays visible on the board | pf2e: the condition hides nothing | ✅ | Live, with pf2e's rules-based vision on (off in world `pf`, switched on for the drive and back): a concealed target stays plainly observed; an attack on it needed the DC 5 flat check (concealment gate) |
| CND-04c | "A creature that you're concealed from must succeed at a flat when targeting you with an attack, spell, or other effect" | check:flat-check · effect:concealment | A DC 5 flat check before an attack, a targeted spell or another targeted effect | this module: `scripts/riders/unobserved.mjs` (attacks only) | ⚠️ | Live: an attack on a concealed target → DC 5 flat check, forced to fail → the attack lost. Gap: *Daze* cast at it asked no flat check — spells and other effects aren't gated |
| CND-04d | "If the check fails, you aren't affected" | check:flat-check | A failed flat check stops the attack or effect | this module: the same gate refuses the attack roll on a failure; nothing for other effects | ⚠️ | Live: the failed flat check lost the attack. Gap: as CND-04c, spells aren't gated |
| CND-04e | "Area effects aren't subject to this flat check" | check:flat-check | An area catching the concealed creature rolls no flat check | this module: the gate reads attack rolls only, so an area's save goes through | ✅ | Live: a spell cast at a concealed target asked no flat check — no area does (nor, see CND-04c, any non-attack spell) |

### CND-05 · Confused

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-05a | "You are Off-Guard" | effect:condition | The confused creature is off-guard (−2 circumstance AC) | pf2e: GrantItem off-guard (in memory) | ✅ | Live: confused brought off-guard, AC 10→8 |
| CND-05b | "you don't treat anyone as your ally (though they might still treat you as theirs)" | reach:allies | Its abilities that help allies find none; it cannot flank for an ally | pf2e: RollOption `target:ally` and `origin:ally` false; ActiveEffectLike `canFlank` false | ⚠️ | Live: confused left the fixture's alliance at `party`; pf2e only clears ally roll options. Gap: allies still count as allies elsewhere |
| CND-05c | "you can't Delay, Ready, or use reactions" | effect:forbid | No reaction is offered to it; Delay and Ready are refused | this module: `scripts/riders/reactions.mjs` | 🔧 | A fix has landed: reaction cards are no longer offered to a confused creature (`looksAbleToReact`); not yet driven |
| CND-05d | "You use all your actions to Strike or cast offensive cantrips" | effect:gm-note | The table is told the creature only Strikes or casts offensive cantrips | pf2e: nothing — the text is all | — | How the GM runs a confused creature |
| CND-05e | "Your targets are determined randomly by the GM" | effect:gm-note | Each of its attacks picks a random creature | pf2e: nothing — the text is all | — | The GM's random choice |
| CND-05f | "If you have no other viable targets, you target yourself, automatically hitting but not scoring a critical hit" | reach:self · check:degree-shift | With nobody else in reach, it hits itself, never critically | pf2e: nothing — the text is all | — | The GM's resolution when no target is left |
| CND-05g | "If it's impossible for you to attack or cast spells, you babble incoherently, wasting your actions" | effect:forbid | A confused creature that cannot attack spends its actions on nothing | pf2e: nothing — the text is all | — | The GM's resolution |
| CND-05h | "Each time you take damage from an attack or spell, you can attempt a flat to recover from your confusion and end the condition" | when:damage-taken · check:flat-check · effect:condition-removed | Damage from an attack or spell offers a DC 11 flat check; success removes confused | this module: `scripts/conditions/index.mjs` (a damage stage) | ✅ | Live: confused, hurt by a weapon → DC 11 flat check rolled by itself; forced to pass → confused gone; forced to fail (control) → still confused |

### CND-06 · Controlled

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-06a | "The controller dictates how you act and can make you use any of your actions, including attacks, reactions, or even Delay" | effect:gm-note | The controller's player directs the controlled creature's actions | pf2e: nothing — the condition has no rules | — | The controller plays the creature |
| CND-06b | "The controller usually doesn't have to spend their own actions when controlling you" | — | — | pf2e: nothing | — | The controller's action cost is set by the effect that controls, and ruled at the table |

### CND-07 · Cursebound

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-07a | "Cursebound is a condition that affects only creatures with an oracular curse" | — | Only an oracle with a curse carries it | pf2e: nothing on the item | — | A definition |
| CND-07b | "cursebound always includes a value" | — | The condition carries a value | pf2e: `value.isValued: true` | ✅ | Live: applied at 1, it reads cursebound 1 |
| CND-07c | "Your specific oracular curse imposes unique negative effects depending on your cursebound value" | — | The curse's own drawbacks follow the value | pf2e: nothing on this item — the curse's class feature carries them | — | The curse's own feature carries it |
| CND-07d | "You can remove the cursebound condition only by Refocusing" | effect:condition-removed | Refocusing removes cursebound; nothing else does | this module: `scripts/conditions/index.mjs` (`onTreatmentOrRefocus`) | ⚠️ | Live: cursebound 1, the *Refocus* card posted → cursebound gone. Gap: nothing stops it being removed another way |

### CND-08 · Dazzled

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-08a | "If vision is your only precise sense, all creatures and objects are Concealed from you" | effect:concealment · check:flat-check | A dazzled attacker rolls a DC 5 flat check against every target | this module: `scripts/conditions/index.mjs` (an attack gate) | ⚠️ | Live: a dazzled fixture's attack → DC 5 flat check, forced to fail → lost. Gap: it does not ask whether vision is the attacker's only precise sense |

### CND-09 · Deafened

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-09a | "You can't hear" | effect:unobserved | A deafened creature detects nobody by hearing | pf2e: the hearing detection mode refuses a deafened listener (with rules-based vision on) | ✅ | Live, with pf2e's rules-based vision on (off in world `pf`, switched on for the drive and back): an invisible target was heard (filtered) by the fixture; deafened, the fixture did not detect it at all |
| CND-09b | "You automatically critically fail Perception checks that require you to be able to hear" | check:degree-shift | A hearing-based Perception check comes out a critical failure | pf2e: AdjustDegreeOfSuccess to critical failure on `perception`, predicated on `item:trait:auditory` | ⚠️ | Live: a plain Perception check rolled deafened kept its degree. Gap: pf2e critically fails only checks with the auditory trait, a stand-in for "requires hearing" |
| CND-09c | "You take a –2 status penalty to Perception checks for initiative and checks that involve sound but also rely on other senses" | effect:penalty | −2 status on initiative and on sound-involving checks | pf2e: FlatModifier status −2 on `perception`/`skill-check`, predicated on initiative or an auditory skill check | ✅ | Live: initiative rolled deafened carried `deafened −2`; the same roll without it carried none, and a plain Perception check deafened left the −2 disabled |
| CND-09d | "If you perform an action that has the auditory trait, you must succeed at a flat or the action is lost" | check:flat-check | An auditory action rolls a DC 5 flat check and is lost on a failure | this module: `scripts/conditions/index.mjs` (the action wrap) | ✅ | Live: deafened, *Demoralize* (auditory) → DC 5 flat check; forced to fail → lost, no card; forced to pass → the card. *Interact* deafened (control) → no check |
| CND-09e | "attempt the check after spending the action but before any effects are applied" | check:flat-check | The action is spent even when the check fails | pf2e: nothing — the text is all | ✅ | Live: the flat check came before the action's card, so on a failure none of its effects reached the table |
| CND-09f | "You are immune to auditory effects while deafened" | effect:resistance | An auditory effect does not affect the deafened creature | pf2e: Immunity `auditory` | ✅ | Live: deafened put `auditory` among the immunities; without it, none |

### CND-10 · Doomed

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-10a | "Doomed always includes a value" | — | The condition carries a value | pf2e: `value.isValued: true` | ✅ | Live: applied at 2, it reads doomed 2 |
| CND-10b | "The Dying value at which you die is reduced by your doomed value" | effect:death | Doomed 1 makes dying 3 fatal | pf2e: `CreaturePF2e#prepareDerivedData` lowers `attributes.dying.max` by the doomed value | ✅ | Live: doomed 2 → dying maximum 4→2 |
| CND-10c | "If your maximum dying value is reduced to 0, you instantly die" | effect:death | Doomed 4 kills outright | this module: `scripts/conditions/index.mjs` (death at the dying maximum) | ✅ | Live: doomed 4 (dying maximum 0), no dying → the fixture dead (dead overlay), doomed gone; dying 3 alone (control) left it alive |
| CND-10d | "When you die, you're no longer doomed" | effect:condition-removed | Death removes doomed | this module: `scripts/conditions/index.mjs` | ✅ | Live: dying 3 with doomed 1 → dead, and doomed removed; doomed 4 → dead, no conditions left |
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
| CND-11g | "This increases your maximum Hit Points, but you don't immediately recover the lost Hit Points" | — | Maximum HP rises on the decrease; current HP does not | pf2e: the `hp` modifier shrinks; LoseHitPoints only takes HP when the value rises | ✅ | Live: Rest for the Night with drained 2 at full HP 48 → maximum 49, HP still 48 |

### CND-12 · Dying

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-12a | "While you have this condition, you are Unconscious" | effect:condition | A dying creature is unconscious, and the unconscious cannot be removed while dying lasts | pf2e: GrantItem unconscious, `onDeleteActions.grantee: restrict` | ✅ | Live: dying 1 brought unconscious (and with it blinded, off-guard, prone) |
| CND-12b | "Dying always includes a value, and if it ever reaches dying 4, you die" | effect:condition-climbs · effect:death | Dying 4 (less doomed) kills | this module: `scripts/conditions/index.mjs` | ✅ | Live: dying 3 with doomed 1 (maximum 3) → dead; dying 3 with no doomed → alive (control). Who may be killed is the **Automate death effects** setting |
| CND-12c | "When you're dying, you must attempt a recovery check at the start of your turn each round to determine whether you get better or worse" | when:turn-start · check:flat-check · effect:condition-climbs | At its turn start a recovery check (DC 10 + dying) is rolled and the value moves with it | this module: `scripts/conditions/index.mjs` (`onStartTurn`, and `onRecoveryCheck` applies every recovery check's result) | ✅ | Live, in combat: dying 1 at turn start → the recovery check rolled by itself; forced to a success → dying gone, wounded 1; forced to a critical failure → dying 3. With the setting off (control) no check was rolled |
| CND-12d | "Your dying condition increases by 1 if you take damage while dying, or by 2 if you take damage from an enemy's critical hit or a critical failure on your save" | when:damage-taken · effect:condition-climbs | Damage while dying adds 1, or 2 on a critical hit or a critically failed save | this module: `scripts/conditions/index.mjs` (`afterDamage`) | ✅ | Live: dying 1 at 0 HP, 3 damage → dying 2 (pf2e alone left it at 1 — the first drive) |
| CND-12e | "If you lose the dying condition by succeeding at a recovery check and are still at 0 Hit Points, you remain unconscious" | effect:condition | Stabilised at 0 HP, it stays unconscious | this module: `scripts/conditions/index.mjs` | ✅ | Live: dying removed at 0 HP, or by a successful recovery check → unconscious kept, wounded 1 |
| CND-12f | "You lose the dying condition automatically and wake up if you ever have 1 Hit Point or more" | effect:stabilize · effect:condition-removed | Healing to 1 HP or more removes dying and unconscious | this module: `scripts/conditions/index.mjs` (`afterDamage`) | ✅ | Live: dying 1 at 0 HP, healed 5 → no longer dying or unconscious |
| CND-12g | "Any time you lose the dying condition, you gain the Wounded 1 condition, or increase your wounded condition value by 1 if you already have that condition" | effect:condition-climbs | Losing dying adds wounded 1, or raises wounded by 1 | this module: `scripts/conditions/index.mjs` (`onDyingDeleted`) | ✅ | Live: losing dying by healing, by a recovery check or by hand → wounded 1 |

### CND-13 · Encumbered

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-13a | "You are carrying more weight than you can manage" | effect:condition | Carrying past the encumbered Bulk gives the condition | pf2e: `imposeEncumberedCondition` when the setting `automation.encumbrance` is on | ✅ | Live, with pf2e's own encumbrance automation on (off in world `pf`, switched on and back): 11 Bulk against a limit of 5 → encumbered and clumsy; dropped → gone |
| CND-13b | "While you're encumbered, you're Clumsy 1" | effect:condition | Encumbered brings clumsy 1 | pf2e: GrantItem clumsy (in memory) | ✅ | Live: encumbered brought clumsy 1 (AC, Reflex, Acrobatics, Stealth −1) |
| CND-13c | "take a 10-foot penalty to all your Speeds" | effect:speed · effect:penalty | Every Speed is 10 feet lower | pf2e: FlatModifier −10 on `all-speeds` | ✅ | Live: encumbered → land Speed 25→15 |
| CND-13d | "As with all penalties to your Speed, this can't reduce your Speed below 5 feet" | effect:speed | A 10-foot Speed becomes 5, not 0 | this module: `scripts/conditions/index.mjs` (a character preparation stage) | ✅ | Live: land Speed lowered to 10, then encumbered → 5; pf2e alone gave 0 (the first drive) |

### CND-14 · Enfeebled

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-14a | "Enfeebled always includes a value" | — | The condition carries a value | pf2e: `value.isValued: true` | ✅ | Live: applied at 2, it reads enfeebled 2 |
| CND-14b | "you take a status penalty equal to the condition value to Strength-based rolls and DCs, including Strength-based melee attack rolls, Strength-based damage rolls, and Athletics checks" | effect:penalty | Status −value on Strength-based attacks, damage and Athletics | pf2e: FlatModifier status `-@item.badge.value` on `str-based` and `str-damage` | ✅ | Live: enfeebled 2 → Athletics and the club Strike −2; Acrobatics unchanged — the control |

### CND-15 · Fascinated

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-15a | "You take a –2 status penalty to Perception and skill checks" | effect:penalty | −2 status on Perception and skill checks | pf2e: FlatModifier status −2 on `perception` and `skill-check` | ✅ | Live: fascinated → Perception and every skill −2; AC and saves unchanged — the control |
| CND-15b | "you can't use concentrate actions unless they (or their intended consequences) are related to the subject of your fascination, as determined by the GM" | effect:forbid · effect:gm-note | A concentrate action not about the subject is refused or put to the GM | pf2e: nothing — the text is all | ❌ | Live: fascinated, *Seek* (concentrate) posted as normal. Whether it relates to the fascination is a ruling |
| CND-15c | "This condition ends if a creature uses hostile actions against you or any of your allies" | effect:condition-removed | A hostile action against the fascinated creature or an ally removes fascinated | this module: `scripts/conditions/index.mjs` (`onHostileAction`) | ✅ | Live: the target fascinated, the fixture's Strike at it → fascination broken; the fixture fascinated and attacking (control) → kept |

### CND-16 · Fatigued

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-16a | "You take a –1 status penalty to AC and saving throws" | effect:penalty | −1 status on AC and every save | pf2e: FlatModifier status −1 on `ac` and `saving-throw` | ✅ | Live: fatigued → AC and all three saves −1; skills unchanged — the control |
| CND-16b | "You can't use exploration activities performed while traveling" | effect:forbid | Exploration activities are refused while fatigued | pf2e: nothing — the text is all | — | Exploration travel is the GM's |
| CND-16c | "You recover from fatigue after a full night's rest" | when:preparations · effect:condition-removed | Rest for the Night removes fatigued | pf2e: `restForTheNight` removes fatigued | ✅ | Live: Rest for the Night removed fatigued |

### CND-17 · Fleeing

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-17a | "On your turn, you must spend each of your actions trying to escape the source of the fleeing condition as expediently as possible" | effect:gm-note | The table is told the creature spends its turn fleeing the source | pf2e: nothing — the condition has no rules | — | How the GM runs a fleeing creature |
| CND-17b | "The source is usually the effect or creature that gave you the condition, though some effects might define something else as the source" | — | The source is known: the condition's origin | pf2e: the condition's origin, when the effect that applied it sets one | — | A definition |
| CND-17c | "You can't Delay or Ready while fleeing" | effect:forbid | Delay and Ready are refused | this module: `scripts/conditions/index.mjs` (refusals) | ⚠️ | Live: fleeing, *Ready* refused; unfleeing (control) it posted. Gap: Delay is the encounter tracker's button, not refused |

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
| CND-19c | "Unless specified otherwise, at the end of each of your turns, the value of your frightened condition decreases by 1" | when:turn-end · effect:condition-removed | At its turn end frightened 2 becomes 1, and frightened 1 ends | this module: `scripts/conditions/index.mjs` (`onEndTurn`) | ✅ | Live, in combat: frightened 2, turn end → frightened 1; the same with the setting off (control) → still 2 |

### CND-20 · Grabbed

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-20a | "giving you the Off-Guard and Immobilized conditions" | effect:condition | A grabbed creature is off-guard and immobilized | pf2e: GrantItem off-guard and immobilized (in memory) | ✅ | Live: grabbed brought off-guard and immobilized, AC 10→8 |
| CND-20b | "If you attempt a manipulate action while grabbed, you must succeed at a flat or it is lost" | check:flat-check | A manipulate action rolls a DC 5 flat check and is lost on a failure | this module: `scripts/conditions/index.mjs` (the action wrap) | ✅ | Live: grabbed, *Interact* (manipulate) → DC 5 flat check; forced to fail → lost; forced to pass → the card |
| CND-20c | "roll the check after spending the action, but before any effects are applied" | check:flat-check | The action is spent even when the check fails | pf2e: nothing — the text is all | ✅ | Live: the check came before the action's card, so a failure applied nothing |

### CND-21 · Helpful

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-21a | "only supernatural effects (like a spell) can impose this condition on a PC" | — | — | pf2e: nothing | — | Who may be given an attitude is the GM's call |
| CND-21b | "It will accept reasonable Requests from that character, as long as such requests aren't at the expense of the helpful creature's goals or quality of life" | — | — | pf2e: nothing | — | Roleplaying |
| CND-21c | "If the character (or one of their allies) uses a hostile action against the creature, the creature gains a worse attitude condition depending on the severity of the hostile action, as determined by the GM" | — | — | pf2e: nothing; its `overrides` keep one attitude at a time | — | The new attitude is a GM ruling |

### CND-22 · Hidden

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-22a | "that creature knows the space you're in but can't tell precisely where you are" | effect:unobserved | The hidden creature is not seen, but its space is known | pf2e: sight detection refuses a hidden creature; hearing still finds it (rules-based vision) | ✅ | Live, with pf2e's rules-based vision on (off in world `pf`, switched on for the drive and back): a hidden target was sensed but not seen (filtered), not plainly observed |
| CND-22b | "When Seeking a creature using only imprecise senses, it remains hidden, rather than Observed" | effect:unobserved | A Seek by an imprecise sense leaves it hidden | pf2e: nothing — the text is all | ❌ | pf2e's Seek posts a check; whether a creature is then hidden or observed is set by hand |
| CND-22c | "A creature you're hidden from is Off-Guard to you" | effect:condition | The hidden creature's attacks find their target off-guard | this module: `scripts/conditions/index.mjs` (an attack stage) | ✅ | Live: the fixture hidden, its Strike rolled against AC 13 for a target of AC 15 (control: 15) |
| CND-22d | "it must succeed at a flat when targeting you with an attack, spell, or other effect or it fails to affect you" | check:flat-check | A DC 11 flat check before targeting the hidden creature; a failure affects nothing | this module: `scripts/conditions/index.mjs` (an attack gate) | ⚠️ | Live: an attack on a hidden target → DC 11 flat check, forced to fail → lost. Gap: spells and other effects aren't gated |
| CND-22e | "Area effects aren't subject to this flat check" | check:flat-check | An area catches the hidden creature with no flat check | this module: `scripts/targeting/catch.mjs` catches it (it refuses only a GM-hidden token) | ✅ | Live: as CND-04e — only attack rolls are gated |
| CND-22f | "A creature might be able to use the seek action to try to observe you" | — | Seek can end it | pf2e: its Seek action | ⚠️ | pf2e's Seek action exists and rolls; its result is applied by hand |

### CND-23 · Hostile

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-23a | "only supernatural effects (like a spell) can impose on a PC" | — | — | pf2e: nothing | — | Who may be given an attitude is the GM's call |
| CND-23b | "A creature hostile to a character actively seeks to harm that character" | — | — | pf2e: nothing; its `overrides` keep one attitude at a time | — | Roleplaying |
| CND-23c | "It doesn't necessarily attack, but it won't accept Requests from the character" | — | — | pf2e: nothing | — | Roleplaying |

### CND-24 · Immobilized

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-24a | "You can't use any actions that have the move trait" | effect:forbid | Stride, Step and other move actions are refused, and the token does not move | this module: `scripts/conditions/index.mjs` (refusals, and a token move gate) | ✅ | Live: immobilized, *Stride* (move) refused, *Interact* (control) posted; a player's token move refused (a player user simulated on the GM's client), the same move unimmobilized allowed |
| CND-24b | "If you're immobilized by something holding you in place and an external force would move you out of your space, the force must succeed at a check against either the DC of the effect holding you in place or the relevant defense (usually Fortitude DC) of the monster holding you in place" | check:maneuver | A push or pull on a held creature first beats the hold's DC | pf2e: nothing. This module: its push and pull riders do not test for a hold | ☐ | Not built: the push and pull riders do not test a hold before moving its creature |

### CND-25 · Indifferent

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-25a | "only supernatural effects (like a spell) can impose this condition on a PC" | — | — | pf2e: nothing | — | Who may be given an attitude is the GM's call |
| CND-25b | "A creature that is indifferent to a character doesn't really care one way or the other about that character" | — | — | pf2e: nothing | — | Roleplaying |
| CND-25c | "Assume a creature's attitude to a given character is indifferent unless specified otherwise" | — | — | pf2e: nothing; its `overrides` keep one attitude at a time | — | The default attitude is a GM assumption |

### CND-26 · Invisible

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-26a | "You can't be seen" | effect:unobserved | Sight finds no invisible creature, unless it sees invisibility | Foundry: the `invisible` status hides a token from sight without see-invisibility; no rule element on the item | ✅ | Live, with pf2e's rules-based vision on (off in world `pf`, switched on for the drive and back): an invisible target was not seen — only heard (filtered) |
| CND-26b | "You're Undetected to everyone" | effect:condition | An invisible creature is undetected | pf2e: nothing grants undetected | ⚠️ | Live: an attack on an invisible target → DC 11 flat check, as on an undetected one. Gap: with pf2e's rules-based vision on (off in world `pf`, switched on for the drive and back), a creature that can hear finds it hidden rather than undetected |
| CND-26c | "Creatures can Seek to detect you; if a creature succeeds at its Perception check against your Stealth DC, you become Hidden to that creature until you Sneak to become undetected again" | effect:condition | A successful Seek makes it hidden to the seeker | pf2e: nothing — the text is all | ❌ | As CND-22b: Seek posts its check; hidden is set by hand |
| CND-26d | "If you become invisible while someone can already see you, you start out hidden to them (instead of undetected) until you successfully Sneak" | effect:condition | Turning invisible in plain view gives hidden, not undetected | this module: `scripts/conditions/index.mjs` (`onInvisible`) | ⚠️ | Live: turning invisible → hidden as well. Gap: pf2e's hidden is for every observer, so it starts hidden even to those who couldn't see it |
| CND-26e | "You can't become Observed while invisible except via special abilities or magic" | effect:unobserved · effect:reveal | Only a revealing effect makes it observed | this module: `scripts/riders/reveal.mjs` (*Revealing Light*, *See the Unseen*) — the special magic; nothing else needed | ✅ | Live, with pf2e's rules-based vision on (off in world `pf`, switched on for the drive and back): an invisible target stayed unseen (heard only); special sight is `riders/reveal.mjs` |

### CND-27 · Observed

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-27a | "Anything in plain view is observed by you" | — | A visible creature is observed by default | Foundry: sight detection | ✅ | Live, with pf2e's rules-based vision on (off in world `pf`, switched on for the drive and back): a target with no condition was plainly observed |
| CND-27b | "If a creature takes measures to avoid detection, such as by using Stealth to Hide, it can become Hidden or Undetected instead of observed" | effect:condition | Hide makes the creature hidden | pf2e: nothing on this item | ✅ | Live, with pf2e's rules-based vision on (off in world `pf`, switched on for the drive and back): given hidden it was sensed but not seen; given undetected, not perceived at all |
| CND-27c | "If you have another precise sense besides sight, you might be able to observe a creature or object using that sense instead" | effect:sense | A precise non-visual sense observes what sight cannot | pf2e: its senses and detection modes | ⚠️ | Live, with pf2e's rules-based vision on (switched on for the drive and back off): blinded with a precise tremorsense the fixture still only sensed the target (filtered), as with hearing. Gap: the precise sense did not observe |
| CND-27d | "You can observe a creature with only your precise senses" | effect:sense | An imprecise sense alone never observes | pf2e: hearing detects but does not observe | ✅ | Live, with pf2e's rules-based vision on (switched on for the drive and back off): blinded, hearing alone (imprecise) only sensed the target; sighted (control) it observed it plainly |
| CND-27e | "When Seeking a creature using only imprecise senses, it remains hidden, rather than observed" | effect:unobserved | A Seek by an imprecise sense leaves it hidden | pf2e: nothing — the text is all | ❌ | As CND-22b: Seek's result is set by hand |

### CND-28 · Off-Guard

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-28a | "You take a –2 circumstance penalty to AC" | effect:penalty | −2 circumstance to AC | pf2e: FlatModifier circumstance −2 on `ac` | ✅ | Live: off-guard → AC 10→8, nothing else |
| CND-28b | "Some effects give you the off-guard condition only to certain creatures or against certain attacks" | effect:condition | Off-guard to one attacker leaves the AC against others untouched | pf2e: the condition is on the actor, for everyone; flanking gives a per-attacker off-guard | ⚠️ | pf2e's flanking gives off-guard against one attacker; the off-guard condition itself is for everyone |
| CND-28c | "If a rule doesn't specify that the condition applies only to certain circumstances, it applies to all of them" | — | Plain off-guard counts against every attack | pf2e: the condition's modifier applies everywhere | ✅ | Live: off-guard → AC −2 against every attack (the first drive) |

### CND-29 · Paralyzed

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-29a | "You have the Off-Guard condition" | effect:condition | A paralyzed creature is off-guard | pf2e: GrantItem off-guard (in memory) | ✅ | Live: paralyzed brought off-guard, AC 10→8 |
| CND-29b | "can't act except to Recall Knowledge and use actions that require only your mind (as determined by the GM)" | effect:forbid | Every action but Recall Knowledge and purely mental ones is refused | this module: `scripts/conditions/index.mjs` (refusals) | ✅ | Live: paralyzed, *Stride*, a cast and a Strike refused; *Recall Knowledge* posted |
| CND-29c | "Your senses still function, but only in the areas you can perceive without moving, so you can't Seek" | effect:forbid | Seek is refused | this module: `scripts/conditions/index.mjs` (refusals) | ✅ | Live: paralyzed, *Seek* refused |

### CND-30 · Persistent Damage

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-30a | "Like normal damage, it can be doubled or halved based on the results of an attack roll or saving throw" | effect:persistent | A critical hit's persistent damage is doubled; a save's degree halves or doubles it | pf2e: the condition records `criticalHit` from the damage roll and doubles on it | ✅ | Live: a Strike carrying 1d4 persistent bleed → on a critical hit (2 * 1d4) bleed; on a hit (control) 1d4 |
| CND-30b | "Instead of taking persistent damage immediately, you take it at the end of each of your turns as long as you have the condition, rolling any damage dice anew each time" | when:turn-end · effect:persistent | At each of its turn ends the damage is rolled anew and taken | this module: `scripts/conditions/index.mjs` (`onPersistentRoll`) | ✅ | Live, in combat: persistent 2 fire, turn end → pf2e's roll, then "takes 2 damage" by itself, HP 50→48 |
| CND-30c | "After you take persistent damage, roll a flat to see if you recover from the persistent damage" | check:flat-check · effect:persistent | A DC 15 flat check follows each tick | this module: `scripts/conditions/index.mjs` (`onPersistentRoll`) | ✅ | Live: after the damage, the DC 15 recovery check rolled by itself (it failed, and the condition stayed) |
| CND-30d | "If you succeed, the condition ends" | effect:condition-removed | Success removes that persistent damage | pf2e: `rollRecovery` removes the condition on a success | ✅ | Live: recovery with the die forced high → the condition ended; forced low (control) → it stayed |

### CND-31 · Petrified

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-31a | "You can't act, nor can you sense anything" | effect:forbid · effect:unobserved | Every action is refused and the creature perceives nothing | this module: `scripts/conditions/index.mjs` (refusals) | ⚠️ | Live: petrified, *Stride*, *Recall Knowledge*, a cast and a Strike all refused. Gap: "nor sense anything" is not modelled |
| CND-31b | "You become an object with a Bulk double your normal Bulk (typically 12 for a petrified Medium creature or 6 for a petrified Small creature), AC 9, Hardness 8, and the same current Hit Points you had when alive" | effect:form · effect:hardness | It reads AC 9 and Hardness 8, keeps its HP, and weighs double | pf2e: nothing — the text is all | ☐ | Not built: pf2e keeps a petrified creature an actor — there is no statue to weigh |
| CND-31c | "You don't have a Broken Threshold" | — | The statue never becomes broken | pf2e: nothing | ☐ | Not built: as CND-31b, no statue to break |
| CND-31d | "When the petrified condition ends, you have the same number of Hit Points you had as a statue" | — | Damage to the statue is still there afterwards | pf2e: nothing — HP are the actor's own throughout | — | Hit Points are the creature's own throughout |
| CND-31e | "If the statue is destroyed, you immediately die" | effect:death | Reducing the statue to 0 HP kills the creature | pf2e: nothing — the text is all | ☐ | Not built: as CND-31b |
| CND-31f | "While petrified, your mind and body are in stasis, so you don't age or notice the passing of time" | — | — | pf2e: nothing | — | Roleplaying |

### CND-32 · Prone

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-32a | "You are Off-Guard" | effect:condition | A prone creature is off-guard | pf2e: GrantItem off-guard (in memory) | ✅ | Live: prone brought off-guard, AC 10→8 |
| CND-32b | "take a –2 circumstance penalty to attack rolls" | effect:penalty | −2 circumstance on every attack roll | pf2e: FlatModifier circumstance −2 on `attack-roll` | ✅ | Live: prone → club Strike −2; skills unchanged — the control |
| CND-32c | "The only move actions you can use while you're prone are Crawl and Stand" | effect:forbid | Stride, Step and Leap are refused; Crawl and Stand are not | this module: `scripts/conditions/index.mjs` (refusals) | ✅ | Live: prone, *Stride* refused, *Crawl* posted |
| CND-32d | "Standing up ends the prone condition" | effect:condition-removed | Stand removes prone | pf2e: its Stand action removes prone | ✅ | Live: prone, pf2e's Stand → no longer prone |
| CND-32e | "You can Take Cover while prone to hunker down and gain greater cover against ranged attacks, even if you don't have an object to get behind, which grants you a +4 circumstance bonus to AC against ranged attacks (but you remain off-guard)" | effect:cover · effect:bonus | Taking Cover while prone gives +4 AC against ranged attacks only, and off-guard stays | pf2e: its Take Cover action posts `Effect: Cover` with a grade to choose; nothing here limits it to ranged attacks | ✅ | Live: prone, pf2e's Take Cover asked which cover, offering **Prone** → *Effect: Cover (Prone)*, greater, +4 |
| CND-32f | "If you would be knocked prone while you're Climbing or Flying, you fall" | effect:elevation/fall | A climbing or flying creature knocked prone falls | pf2e: nothing — the text is all | ☐ | Not built: being knocked prone while Climbing or Flying is not recognised |
| CND-32g | "You can't be knocked prone when Swimming" | effect:resistance | A swimming creature refuses prone | pf2e: nothing — the text is all | ☐ | Not built: as CND-32f, for Swimming |

### CND-33 · Quickened

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-33a | "You gain 1 additional action at the start of your turn each round" | when:turn-start · economy:extra-action | Four actions at the start of each turn | this module: `scripts/conditions/index.mjs` (`onStartTurn`) | ⚠️ | Live, in combat: quickened and slowed 1 → "regains 3 of 4 actions". Gap: announced, not enforced |
| CND-33b | "Many effects that make you quickened require you use this extra action only in certain ways" | economy:extra-action | The extra action is usable only for what its source names | pf2e: nothing — the text is all | — | The quickening effect says how its action is used |
| CND-33c | "If you become quickened from multiple sources, you can use the extra action you've been granted for any single action allowed by any of the effects that made you quickened" | economy:extra-action | Two sources still give one extra action, usable for either's list | pf2e: nothing — the text is all | — | A ruling on several sources |
| CND-33d | "Because quickened has its effect at the start of your turn, you don't immediately gain actions if you become quickened during your turn" | when:turn-start | Quickened mid-turn adds nothing until the next turn | pf2e: nothing — the text is all | ✅ | Live: actions are reckoned only at the start of a turn, so quickened gained mid-turn gives nothing until the next |

### CND-34 · Restrained

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-34a | "You have the Off-Guard and Immobilized conditions" | effect:condition | A restrained creature is off-guard and immobilized | pf2e: GrantItem off-guard and immobilized (in memory); ActiveEffectLike `canFlank` false | ✅ | Live: restrained brought off-guard and immobilized, AC 10→8 |
| CND-34b | "you can't use any attack or manipulate actions except to attempt to Escape or Force Open your bonds" | effect:forbid | Attacks and manipulate actions other than Escape and Force Open are refused | this module: `scripts/conditions/index.mjs` (refusals) | ✅ | Live: restrained, a Strike and *Interact* refused, *Escape* posted |
| CND-34c | "Restrained overrides Grabbed" | effect:suppress | A grabbed creature that is restrained loses grabbed's effects while restrained lasts | pf2e: `overrides: ["grabbed"]` — `ConditionPF2e#prepareSiblingData` deactivates grabbed | ✅ | Live: grabbed, then restrained → grabbed kept but inactive; grabbed alone is active (control) |

### CND-35 · Sickened

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-35a | "Sickened always includes a value" | — | The condition carries a value | pf2e: `value.isValued: true` | ✅ | Live: applied at 2, it reads sickened 2 |
| CND-35b | "You take a status penalty equal to this value on all your checks and DCs" | effect:penalty | A status penalty of the value on every check and DC | pf2e: FlatModifier status `-@item.badge.value` on `all` | ✅ | Live: sickened 2 → every check, the Strike and AC −2 |
| CND-35c | "You can't willingly ingest anything-including elixirs and potions-while sickened" | effect:forbid | Drinking an elixir or potion is refused while sickened | this module: `scripts/conditions/index.mjs` (a wrap on consuming) | ✅ | Live: a minor healing potion consumed 5→4; sickened, consuming it refused, still 4 |
| CND-35d | "You can spend a single action retching in an attempt to recover, which lets you immediately attempt a Fortitude save against the DC of the effect that made you sickened" | economy:granted-action · check:save | A one-action retch, rolled as a Fortitude save at the DC of what sickened the creature | pf2e: nothing — no action on the item, and the source's DC is not kept | ☐ | Not built: the retch needs the DC of what sickened the creature, which pf2e does not keep |
| CND-35e | "On a success, you reduce your sickened value by 1 (or by 2 on a critical success)" | check:save · effect:condition-climbs | The value drops by 1, or by 2 on a critical success | pf2e: nothing | ☐ | Not built: as CND-35d |

### CND-36 · Slowed

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-36a | "Slowed always includes a value" | — | The condition carries a value | pf2e: `value.isValued: true` | ✅ | Live: applied at 1, it reads slowed 1 |
| CND-36b | "When you regain your actions, reduce the number of actions regained by your slowed value" | when:turn-start | Slowed 1 leaves two actions at the start of the turn | this module: `scripts/conditions/index.mjs` (`onStartTurn`) | ⚠️ | Live, in combat: slowed 1 → "regains 3 of 4 actions" with quickened. Gap: announced, not enforced |
| CND-36c | "Because you regain actions at the start of your turn, you don't immediately lose actions if you become slowed during your turn" | when:turn-start | Slowed mid-turn takes nothing until the next turn | pf2e: nothing — the text is all | ✅ | Live: actions are reckoned only at the start of a turn |

### CND-37 · Stunned

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-37a | "You can't act" | effect:forbid | Every action is refused while stunned | this module: `scripts/conditions/index.mjs` (refusals) | ✅ | Live: stunned, *Stride*, *Recall Knowledge*, a cast and a Strike all refused |
| CND-37b | "Stunned usually includes a value, which indicates how many total actions you lose, possibly over multiple turns, from being stunned" | — | The value counts actions lost in all | pf2e: `value.isValued: true` | ✅ | Live: applied at 1, it reads stunned 1 |
| CND-37c | "Each time you regain actions, reduce the number you regain by your stunned value, then reduce your stunned value by the number of actions you lost" | when:turn-start · effect:condition-removed | Stunned 4 takes all three actions and leaves stunned 1; next turn one more, and it ends | this module: `scripts/conditions/index.mjs` (`onStartTurn`) | ⚠️ | Live, in combat: stunned 2, turn start → "regains 1 of 3 actions (2 lost to stunned)" and stunned gone; stunned 5 → 0 of 3, stunned 2 left; setting off (control) → nothing. Gap: the actions are announced — pf2e counts none, so nothing stops a fourth |
| CND-37d | "Stunned might also have a duration instead, such as "stunned for 1 minute," causing you to lose all your actions for the duration" | ending:duration | A duration stun takes every action until it ends | this module: `scripts/conditions/index.mjs` (`onStartTurn`) | ✅ | Live, in combat: stunned granted by a 1-minute effect → "stunned for its duration and loses all its actions", and it stays |
| CND-37e | "Stunned overrides Slowed" | effect:suppress | A slowed creature that is stunned loses slowed's effects while stunned lasts | pf2e: `overrides: ["slowed"]` — `ConditionPF2e#prepareSiblingData` deactivates slowed | ✅ | Live: slowed 1, then stunned 1 → slowed kept but inactive; slowed alone is active (control) |
| CND-37f | "If the duration of your stunned condition ends while you are slowed, you count the actions lost to the stunned condition toward those lost to being slowed" | when:turn-start | Stunned 1 and slowed 2 leave one action, not zero | pf2e: nothing — the text is all | ☐ | Not built: actions lost to stunned are not carried into slowed |

### CND-38 · Stupefied

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-38a | "Stupefied always includes a value" | — | The condition carries a value | pf2e: `value.isValued: true` | ✅ | Live: applied at 2, it reads stupefied 2 |
| CND-38b | "You take a status penalty equal to this value on Intelligence-, Wisdom-, and Charisma-based rolls and DCs, including Will saving throws, spell attack modifiers, spell DCs, and skill checks that use these attribute modifiers" | effect:penalty | Status −value on Will, spell attacks, spell DCs and Int-, Wis- and Cha-based skills | pf2e: FlatModifier status `-@item.badge.value` on `int-based`, `wis-based` and `cha-based` | ✅ | Live: stupefied 2 → Will, Perception, Arcana, Diplomacy and Religion −2; Fortitude and Athletics unchanged — the control |
| CND-38c | "Any time you attempt to Cast a Spell while stupefied, the spell is disrupted unless you succeed at a flat with a DC equal to 5 + your stupefied value" | when:cast · check:flat-check | Each cast rolls a flat check against 5 + value, and a failure loses the spell | this module: `scripts/conditions/index.mjs` (a cast stage) | ✅ | Live: stupefied 2, casting *Daze* → DC 7 flat check; forced to fail → lost; forced to pass → cast |

### CND-39 · Unconscious

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-39a | "You can't act" | effect:forbid | Every action is refused while unconscious | this module: `scripts/conditions/index.mjs` (refusals) | ✅ | Live: unconscious, every action, a cast and a Strike refused |
| CND-39b | "You take a –4 status penalty to AC, Perception, and Reflex saves" | effect:penalty | −4 status on AC, Perception and Reflex | pf2e: FlatModifier status −4 on `ac`, `perception` and `reflex` | ✅ | Live: unconscious → AC 10→4 (−4 with off-guard's −2), Reflex and Perception −4; Fortitude unchanged — the control |
| CND-39c | "you have the Blinded and Off-Guard conditions" | effect:condition | An unconscious creature is blinded and off-guard | pf2e: GrantItem blinded (deletion restricted) and off-guard (in memory) | ✅ | Live: unconscious brought blinded and off-guard |
| CND-39d | "When you gain this condition, you fall Prone" | effect:condition | Falling unconscious adds prone, which stays after waking | pf2e: GrantItem prone, detached when unconscious ends | ✅ | Live: unconscious brought prone, which stayed after unconscious went |
| CND-39e | "drop items you're holding unless the effect states otherwise or the GM determines you're positioned so you wouldn't" | effect:disarm | Held items are dropped | this module: `scripts/conditions/index.mjs` (`onUnconscious`) | ✅ | Live: falling unconscious, the fixture dropped its club (carry type `dropped`) |
| CND-39f | "If you're unconscious because you're Dying, you can't wake up while you have 0 Hit Points" | effect:condition-floor | Unconscious cannot be removed while dying at 0 HP | pf2e: dying's GrantItem restricts deleting the unconscious it grants | ✅ | Live: dying at 0 HP, unconscious deleted by hand → back at once |
| CND-39g | "If you are restored to 1 Hit Point or more, you lose the dying and unconscious conditions and can act normally on your next turn" | effect:stabilize · effect:condition-removed | Healing to 1 HP removes dying and unconscious | this module: `scripts/conditions/index.mjs` (`afterDamage`) | ✅ | Live: dying 1 at 0 HP, healed 5 → dying and unconscious gone |
| CND-39h | "If you are unconscious and at 0 Hit Points, but not dying, you return to 1 Hit Point and awaken after sufficient time passes" | effect:heal · effect:condition-removed | After the time passes it is at 1 HP and awake | pf2e: nothing — the text is all | — | "After sufficient time passes" is the GM's |
| CND-39i | "The GM determines how long you remain unconscious, from a minimum of 10 minutes to several hours" | — | — | pf2e: nothing | — | The time is a GM ruling |
| CND-39j | "If you are healed, you lose the unconscious condition and can act normally on your next turn" | effect:condition-removed | Any healing at 0 HP removes unconscious | this module: `scripts/conditions/index.mjs` (`afterDamage`) | ✅ | Live: unconscious (not dying) at 5 HP, healed 3 → awake |
| CND-39k | "You take damage, though if the damage reduces you to 0 Hit Points, you remain unconscious and gain the dying condition as normal" | when:damage-taken · effect:condition-removed | A sleeper above 1 HP wakes on damage, or turns dying at 0 HP | this module: `scripts/conditions/index.mjs` (`afterDamage`) | ✅ | Live: HP 5, 10 damage → dying 1 and unconscious; wounded 1 → dying 2 |
| CND-39l | "You receive healing, other than the natural healing you get from resting" | effect:condition-removed | Healing other than rest wakes it | this module: `scripts/conditions/index.mjs` (`afterDamage`) | ✅ | Live: healed by an applied heal → awake; a night's rest heals without waking anyone, as it should |
| CND-39m | "Someone shakes you awake with an Interact action" | effect:condition-removed | An Interact by an adjacent creature wakes it | pf2e: nothing — the text is all | — | Someone's Interact, adjudicated at the table |
| CND-39n | "At the start of your turn, you automatically attempt a Perception check against the noise's DC (or the lowest DC if there is more than one noise), waking up if you succeed" | when:turn-start · effect:condition-removed | At its turn start a Perception check against the noise's DC; success wakes it | pf2e: nothing — the text is all | — | The noise and its DC are the GM's |
| CND-39o | "If creatures are attempting to stay quiet around you, this Perception check uses their Stealth DCs" | — | The check's DC is the quiet creatures' Stealth DC | pf2e: nothing — the text is all | — | The GM's |
| CND-39p | "Some effects make you sleep so deeply that they don't allow you this Perception check" | — | Such an effect suppresses the turn-start check | pf2e: nothing — the text is all | — | The effect's own rule |
| CND-39q | "If you are simply asleep, the GM decides you wake up either because you have had a restful night's sleep or something disrupted that rest" | — | — | pf2e: nothing | — | Waking from sleep is a GM ruling |

### CND-40 · Undetected

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-40a | "When you are undetected by a creature, that creature can't see you at all, has no idea what space you occupy, and can't target you" | effect:unobserved | The undetected creature does not show for the other and cannot be targeted by it | pf2e: sight and hearing detection both refuse an undetected creature (rules-based vision); targeting is not refused | ✅ | Live, with pf2e's rules-based vision on (off in world `pf`, switched on for the drive and back): an undetected target was not perceived at all |
| CND-40b | "you still can be affected by abilities that target an area" | — | An area still catches it | this module: `scripts/targeting/catch.mjs` catches it (it refuses only a GM-hidden token) | ✅ | Live: as CND-04e — only attack rolls are gated |
| CND-40c | "When you're undetected by a creature, that creature is Off-Guard to you" | effect:condition | Its attacks find their target off-guard | this module: `scripts/conditions/index.mjs` (an attack stage) | ✅ | Live: the fixture undetected, its Strike rolled against AC 13 for AC 15 (control: 15) |
| CND-40d | "A creature you're undetected by can guess which square you're in to try targeting you" | effect:gm-note | An attack may be aimed at a guessed square | pf2e: nothing — the text is all | — | Guessing a square is the attacker's choice at the table |
| CND-40e | "This works like targeting a Hidden creature (requiring a flat), but the flat check and attack roll are rolled in secret by the GM, who doesn't reveal whether the attack missed due to failing the flat check, failing the attack roll, or choosing the wrong square" | check:flat-check · check:secret | A secret DC 11 flat check and a secret attack roll, with one undistinguished miss | this module: `scripts/conditions/index.mjs` (an attack gate) | ⚠️ | Live: an attack on an undetected target → DC 11 flat check, forced to fail → lost. Gap: not rolled in secret |
| CND-40f | "They can Seek to try to find you" | — | Seek can end it | pf2e: its Seek action | ⚠️ | As CND-22f |

### CND-41 · Unfriendly

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-41a | "only supernatural effects (like a spell) can impose this condition on a PC" | — | — | pf2e: nothing | — | Who may be given an attitude is the GM's call |
| CND-41b | "A creature that is unfriendly to a character dislikes and distrusts that character" | — | — | pf2e: nothing; its `overrides` keep one attitude at a time | — | Roleplaying |
| CND-41c | "The unfriendly creature won't accept Requests from the character" | — | — | pf2e: nothing | — | Roleplaying |

### CND-42 · Unnoticed

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-42a | "If you're unnoticed by a creature, that creature has no idea you're present" | effect:unobserved | The unnoticed creature does not show for the other | pf2e: sight and hearing detection both refuse an unnoticed creature (rules-based vision) | ✅ | Live, with pf2e's rules-based vision on (off in world `pf`, switched on for the drive and back): an unnoticed target was not perceived at all |
| CND-42b | "When you're unnoticed, you're also Undetected" | effect:condition | An unnoticed creature is undetected too | pf2e: nothing grants undetected | ✅ | Live, with pf2e's rules-based vision on (off in world `pf`, switched on for the drive and back): unnoticed hid the target exactly as undetected does |
| CND-42c | "This matters for abilities that can be used only against targets totally unaware of your presence" | economy:requires | An ability that needs an unaware target is allowed against it, and refused otherwise | pf2e: nothing on the item; such abilities predicate on the target's condition | — | Each such ability predicates on it |

### CND-43 · Wounded

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-43a | "If you lose the Dying condition and do not already have the wounded condition, you become wounded 1" | effect:condition | Losing dying gives wounded 1 | this module: `scripts/conditions/index.mjs` (`onDyingDeleted`) | ✅ | Live: dying lost with no wounded → wounded 1 |
| CND-43b | "If you already have the wounded condition when you lose the dying condition, your wounded condition value increases by 1" | effect:condition-climbs | Losing dying while wounded 1 gives wounded 2 | this module: `scripts/conditions/index.mjs` (`onDyingDeleted`) | ✅ | Live: wounded 2, dying lost → wounded 3 |
| CND-43c | "If you gain the dying condition while wounded, increase your dying condition value by your wounded value" | effect:condition-climbs | Wounded 2 at 0 HP gives dying 3 | this module: `scripts/conditions/index.mjs` (`onDyingCreated`, `afterDamage`) | ✅ | Live: wounded 1, then dying 1 → dying 2; knocked to 0 HP while wounded 1 → dying 2 |
| CND-43d | "The wounded condition ends if someone successfully restores Hit Points to you using Treat Wounds" | effect:condition-removed | A Treat Wounds that heals removes wounded | this module: `scripts/conditions/index.mjs` (`onTreatmentOrRefocus`) | ✅ | Live: the target wounded 1, a Treat Wounds Medicine check at it forced to a critical success → wounded gone; forced to fail (control) → kept |
| CND-43e | "or if you are restored to full Hit Points by any means and rest for 10 minutes" | effect:condition-removed | Full HP and 10 minutes' rest remove wounded | pf2e: only `restForTheNight` removes wounded, and only at full HP; a 10-minute rest does not | ⚠️ | Live: Rest for the Night at full HP removed wounded 1. Gap: the text's 10 minutes' rest at full HP removes nothing — only a night's rest does |
