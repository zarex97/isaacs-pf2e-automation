# Clauses — pf2e conditions and effects, part 1: conditions, and the small packs

*Effect tracker, clausified. Part 1 of the twelve in `Docs/pf2e-effects.md`: pf2e's 172 conditions, other effects, campaign
effects and the effects among the boons and curses. Every item is broken into **clauses**: independently-failable statements
quoted from its own description, one row each.*

**Tracker issue:** #79 (part 1 of #78) · **Source:** pf2e 8.4.1's own item text, as the sheet prints it
(`npm run index:pf2e` writes it to `build/data/pf2e-effect-text.json`).

## How a row is marked

| Mark | Meaning |
| :-- | :-- |
| ☐ | Not yet driven |
| ✅ | Driven live; the clause happened by itself |
| ⚠️ | Driven live; partially happens — the gap is named in **Evidence** |
| ❌ | Driven live; does not happen |
| 🔧 | Was ❌ or ⚠️, a fix has landed, awaiting re-drive |
| — | Nothing to automate (pure roleplaying / GM ruling) |

**Clause** is a verbatim fragment of the item's text; `npm test` asserts it still is one. **Patterns** tags the clause from
`Docs/patterns.md` (`—` when it states a fact and makes no move). **Must happen** is what a drive has to see. **Static
check** says what makes it happen today — pf2e's own rule elements on the item, this module, or nothing — and **Evidence**
what proved it in world `pf`. An item whose description is empty has no clauses.

Clause IDs are the item's ID and a letter: `CND-07b` is the second clause of CND-07.

## The items

| ID | Item | Name |
| :-- | :-- | :-- |
| CND-01 | `conditionitems/blinded` | Blinded |
| CND-02 | `conditionitems/broken` | Broken |
| CND-03 | `conditionitems/clumsy` | Clumsy |
| CND-04 | `conditionitems/concealed` | Concealed |
| CND-05 | `conditionitems/confused` | Confused |
| CND-06 | `conditionitems/controlled` | Controlled |
| CND-07 | `conditionitems/cursebound` | Cursebound |
| CND-08 | `conditionitems/dazzled` | Dazzled |
| CND-09 | `conditionitems/deafened` | Deafened |
| CND-10 | `conditionitems/doomed` | Doomed |
| CND-11 | `conditionitems/drained` | Drained |
| CND-12 | `conditionitems/dying` | Dying |
| CND-13 | `conditionitems/encumbered` | Encumbered |
| CND-14 | `conditionitems/enfeebled` | Enfeebled |
| CND-15 | `conditionitems/fascinated` | Fascinated |
| CND-16 | `conditionitems/fatigued` | Fatigued |
| CND-17 | `conditionitems/fleeing` | Fleeing |
| CND-18 | `conditionitems/friendly` | Friendly |
| CND-19 | `conditionitems/frightened` | Frightened |
| CND-20 | `conditionitems/grabbed` | Grabbed |
| CND-21 | `conditionitems/helpful` | Helpful |
| CND-22 | `conditionitems/hidden` | Hidden |
| CND-23 | `conditionitems/hostile` | Hostile |
| CND-24 | `conditionitems/immobilized` | Immobilized |
| CND-25 | `conditionitems/indifferent` | Indifferent |
| CND-26 | `conditionitems/invisible` | Invisible |
| CND-27 | `conditionitems/observed` | Observed |
| CND-28 | `conditionitems/off-guard` | Off-Guard |
| CND-29 | `conditionitems/paralyzed` | Paralyzed |
| CND-30 | `conditionitems/persistent-damage` | Persistent Damage |
| CND-31 | `conditionitems/petrified` | Petrified |
| CND-32 | `conditionitems/prone` | Prone |
| CND-33 | `conditionitems/quickened` | Quickened |
| CND-34 | `conditionitems/restrained` | Restrained |
| CND-35 | `conditionitems/sickened` | Sickened |
| CND-36 | `conditionitems/slowed` | Slowed |
| CND-37 | `conditionitems/stunned` | Stunned |
| CND-38 | `conditionitems/stupefied` | Stupefied |
| CND-39 | `conditionitems/unconscious` | Unconscious |
| CND-40 | `conditionitems/undetected` | Undetected |
| CND-41 | `conditionitems/unfriendly` | Unfriendly |
| CND-42 | `conditionitems/unnoticed` | Unnoticed |
| CND-43 | `conditionitems/wounded` | Wounded |
| OFX-01 | `other-effects/effect-1-circumstance-penalty-to-attack-rolls-until-you-score-a-critical-hit` | Effect: -1 circumstance penalty to attack rolls until you score a critical hit |
| OFX-02 | `other-effects/effect-2-circumstance-penalty-to-attack-rolls` | Effect: -2 circumstance penalty to attack rolls |
| OFX-03 | `other-effects/effect-2-circumstance-penalty-to-attack-rolls-made-with-this-attack-until-healed` | Effect: -2 circumstance penalty to attack rolls made with this attack until healed |
| OFX-04 | `other-effects/effect-2-circumstance-penalty-to-attack-rolls-until-healed` | Effect: -2 circumstance penalty to attack rolls until healed |
| OFX-05 | `other-effects/effect-2-circumstance-penalty-to-attack-rolls-with-this-weapon` | Effect: -2 circumstance penalty to attack rolls with this weapon |
| OFX-06 | `other-effects/effect-2-circumstance-penalty-to-checks-and-saving-throws-until-healed` | Effect: -2 circumstance penalty to checks and saving throws until healed |
| OFX-07 | `other-effects/effect-2-circumstance-penalty-to-ranged-attacks` | Effect: -2 circumstance penalty to ranged attacks |
| OFX-08 | `other-effects/effect-2-circumstance-penalty-to-spell-attack-rolls-and-spell-dcs` | Effect: -2 circumstance penalty to spell attack rolls and spell DC's |
| OFX-09 | `other-effects/effect-10-foot-circumstance-penalty-to-all-speeds` | Effect: –10-foot circumstance penalty to all Speeds |
| OFX-10 | `other-effects/effect-10-foot-circumstance-penalty-to-your-land-speed` | Effect: –10-foot circumstance penalty to your land Speed |
| OFX-11 | `other-effects/effect-10-foot-status-penalty-to-your-land-speed` | Effect: –10-foot status penalty to your land Speed |
| OFX-12 | `other-effects/effect-15-foot-status-penalty-to-your-land-speed` | Effect: –15-foot status penalty to your land Speed |
| OFX-13 | `other-effects/effect-5-foot-circumstance-penalty-to-your-land-speed` | Effect: –5-foot circumstance penalty to your land Speed |
| OFX-14 | `other-effects/effect-5-foot-status-penalty-to-your-land-speed` | Effect: –5-foot status penalty to your land Speed |
| OFX-15 | `other-effects/effect-1-circumstance-bonus-to-attack-rolls-for-3-rounds` | Effect: +1 circumstance bonus to attack rolls for 3 rounds |
| OFX-16 | `other-effects/effect-2-circumstance-bonus-to-ac` | Effect: +2 circumstance bonus to AC |
| OFX-17 | `other-effects/effect-2-circumstance-bonus-to-attack-rolls` | Effect: +2 circumstance bonus to attack rolls |
| OFX-18 | `other-effects/effect-2-status-bonus-to-ac-and-all-saving-throws` | Effect: +2 status bonus to AC and all saving throws |
| OFX-19 | `other-effects/effect-2-status-bonus-to-attack-rolls` | Effect: +2 status bonus to attack rolls |
| OFX-20 | `other-effects/effect-2-status-bonus-to-saving-throws-against-spells-for-1-min` | Effect: +2 status bonus to saving throws against spells for 1 min |
| OFX-21 | `other-effects/effect-4-circumstance-bonus-to-ac-against-your-ranged-attacks` | Effect: +4 circumstance bonus to AC against your ranged attacks |
| OFX-22 | `other-effects/effect-adverse-subsist-situation` | Effect: Adverse Subsist Situation |
| OFX-23 | `other-effects/effect-aid` | Effect: Aid |
| OFX-24 | `other-effects/effect-ancestral-might` | Effect: Ancestral Might |
| OFX-25 | `other-effects/effect-aquatic-combat` | Effect: Aquatic Combat |
| OFX-26 | `other-effects/effect-aura-of-protection` | Effect: Aura of Protection |
| OFX-27 | `other-effects/effect-avert-gaze` | Effect: Avert Gaze |
| OFX-28 | `other-effects/effect-called-foe` | Effect: Called Foe |
| OFX-29 | `other-effects/effect-catch-your-breath` | Effect: Catch your Breath |
| OFX-30 | `other-effects/effect-class-might` | Effect: Class Might |
| OFX-31 | `other-effects/effect-cover` | Effect: Cover |
| OFX-32 | `other-effects/effect-critical-moment` | Effect: Critical Moment |
| OFX-33 | `other-effects/effect-daring-attempt` | Effect: Daring Attempt |
| OFX-34 | `other-effects/effect-dazzled-until-end-of-your-next-turn` | Effect: Dazzled until end of your next turn |
| OFX-35 | `other-effects/effect-deafened-until-end-of-your-next-turn` | Effect: Deafened until end of your next turn |
| OFX-36 | `other-effects/effect-desperate-swing` | Effect: Desperate Swing |
| OFX-37 | `other-effects/effect-disarm-bonus` | Effect: Disarm (Bonus) |
| OFX-38 | `other-effects/effect-disarm-success` | Effect: Disarm (Success) |
| OFX-39 | `other-effects/effect-endure-the-onslaught` | Effect: Endure the Onslaught |
| OFX-40 | `other-effects/effect-fluid-motion` | Effect: Fluid Motion |
| OFX-41 | `other-effects/effect-follow-the-expert` | Effect: Follow The Expert |
| OFX-42 | `other-effects/effect-impossible-shot` | Effect: Impossible Shot |
| OFX-43 | `other-effects/effect-mounted` | Effect: Mounted |
| OFX-44 | `other-effects/effect-off-guard-until-end-of-your-next-turn` | Effect: Off-Guard until end of your next turn |
| OFX-45 | `other-effects/effect-press-on` | Effect: Press On |
| OFX-46 | `other-effects/effect-rage-and-fury` | Effect: Rage and Fury |
| OFX-47 | `other-effects/effect-remaining-air` | Effect: Remaining Air |
| OFX-48 | `other-effects/effect-resistance-5-to-all-damage` | Effect: Resistance 5 to all damage |
| OFX-49 | `other-effects/effect-scout` | Effect: Scout |
| OFX-50 | `other-effects/effect-spark-of-courage` | Effect: Spark of Courage |
| OFX-51 | `other-effects/effect-strike-true` | Effect: Strike True |
| OFX-52 | `other-effects/effect-treat-disease` | Effect: Treat Disease |
| OFX-53 | `other-effects/effect-treat-poison` | Effect: Treat Poison |
| CMP-01 | `campaign-effects/aura-righteous-call` | Aura: Righteous Call |
| CMP-02 | `campaign-effects/effect-attitude` | Effect: Attitude |
| CMP-03 | `campaign-effects/effect-azatas-grace` | Effect: Azata's Grace |
| CMP-04 | `campaign-effects/effect-bickering-family` | Effect: Bickering Family |
| CMP-05 | `campaign-effects/effect-blessed-coins` | Effect: Blessed Coins |
| CMP-06 | `campaign-effects/effect-boar-form` | Effect: Boar Form |
| CMP-07 | `campaign-effects/effect-burned-mouth-and-throat-linguistic` | Effect: Burned Mouth and Throat (Linguistic) |
| CMP-08 | `campaign-effects/effect-burned-mouth-and-throat-no-singing-or-yelling` | Effect: Burned Mouth and Throat (No Singing or Yelling) |
| CMP-09 | `campaign-effects/effect-burned-tongue-linguistic` | Effect: Burned Tongue (Linguistic) |
| CMP-10 | `campaign-effects/effect-burned-tongue-no-singing-or-yelling` | Effect: Burned Tongue (No Singing or Yelling) |
| CMP-11 | `campaign-effects/effect-call-upon-the-ancients` | Effect: Call Upon the Ancients |
| CMP-12 | `campaign-effects/effect-call-upon-the-sovyrian-stone` | Effect: Call Upon the Sovyrian Stone |
| CMP-13 | `campaign-effects/effect-chthonic-mucus` | Effect: Chthonic Mucus |
| CMP-14 | `campaign-effects/effect-chthonic-mucus-1-2` | Effect: Chthonic Mucus (1-2) |
| CMP-15 | `campaign-effects/effect-combat-mentor` | Effect: Combat Mentor |
| CMP-16 | `campaign-effects/effect-consecrated-altar-to-ydersius` | Effect: Consecrated Altar to Ydersius |
| CMP-17 | `campaign-effects/effect-crownhold-consecration` | Effect: Crownhold Consecration |
| CMP-18 | `campaign-effects/effect-exotic-edge` | Effect: Exotic Edge |
| CMP-19 | `campaign-effects/effect-extreme-stomach-cramps` | Effect: Extreme stomach cramps |
| CMP-20 | `campaign-effects/effect-favor-of-a-future-ally` | Effect: Favor of a Future Ally |
| CMP-21 | `campaign-effects/effect-favor-of-a-past-benefactor` | Effect: Favor of a Past Benefactor |
| CMP-22 | `campaign-effects/effect-favor-of-a-present-foe` | Effect: Favor of a Present Foe |
| CMP-23 | `campaign-effects/effect-favor-of-the-oliphaunt` | Effect: Favor of the Oliphaunt |
| CMP-24 | `campaign-effects/effect-forgive-foe` | Effect: Forgive Foe |
| CMP-25 | `campaign-effects/effect-grand-finale` | Effect: Grand Finale |
| CMP-26 | `campaign-effects/effect-heightened-awareness` | Effect: Heightened Awareness |
| CMP-27 | `campaign-effects/effect-heroic-aegis` | Effect: Heroic Aegis |
| CMP-28 | `campaign-effects/effect-heroic-hustle` | Effect: Heroic Hustle |
| CMP-29 | `campaign-effects/effect-heroic-inspiration` | Effect: Heroic Inspiration |
| CMP-30 | `campaign-effects/effect-hope-or-despair-critical-success` | Effect: Hope or Despair (Critical Success) |
| CMP-31 | `campaign-effects/effect-hope-or-despair-failure-or-critical-failure` | Effect: Hope or Despair (Failure or Critical Failure) |
| CMP-32 | `campaign-effects/effect-immediate-and-intense-headache` | Effect: Immediate and Intense Headache |
| CMP-33 | `campaign-effects/effect-improved-reflexes` | Effect: Improved reflexes |
| CMP-34 | `campaign-effects/effect-invoke-the-witchboles-spirit` | Effect: Invoke the Witchbole's Spirit |
| CMP-35 | `campaign-effects/effect-keen-insight` | Effect: Keen insight |
| CMP-36 | `campaign-effects/effect-light-in-the-dark` | Effect: Light in the Dark |
| CMP-37 | `campaign-effects/effect-little-ripples-blessing` | Effect: Little Ripple's Blessing |
| CMP-38 | `campaign-effects/effect-magical-mentor` | Effect: Magical Mentor |
| CMP-39 | `campaign-effects/effect-meditate-among-the-stones-critical-success` | Effect: Meditate Among the Stones (Critical Success) |
| CMP-40 | `campaign-effects/effect-meditate-among-the-stones-success` | Effect: Meditate Among the Stones (Success) |
| CMP-41 | `campaign-effects/effect-memories-of-failure` | Effect: Memories of Failure |
| CMP-42 | `campaign-effects/effect-nexian-researcher` | Effect: Nexian Researcher |
| CMP-43 | `campaign-effects/effect-pompous-rage` | Effect: Pompous Rage |
| CMP-44 | `campaign-effects/effect-practiced-medic` | Effect: Practiced Medic |
| CMP-45 | `campaign-effects/effect-protective-mentor` | Effect: Protective Mentor |
| CMP-46 | `campaign-effects/effect-recruit-the-recent-dead` | Effect: Recruit the Recent Dead |
| CMP-47 | `campaign-effects/effect-reflection-of-life-fast-healing` | Effect: Reflection of Life (Fast Healing) |
| CMP-48 | `campaign-effects/effect-resist-corruption` | Effect: Resist Corruption |
| CMP-49 | `campaign-effects/effect-righteous-call` | Effect: Righteous Call |
| CMP-50 | `campaign-effects/effect-rugged-mentor` | Effect: Rugged Mentor |
| CMP-51 | `campaign-effects/effect-seasonal-boon-outskirt-dweller` | Effect: Seasonal Boon (Outskirt Dweller) |
| CMP-52 | `campaign-effects/effect-skillful-mentor` | Effect: Skillful Mentor |
| CMP-53 | `campaign-effects/effect-spirit-power-flight` | Effect: Spirit Power (Flight) |
| CMP-54 | `campaign-effects/effect-spirit-power-passion` | Effect: Spirit Power (Passion) |
| CMP-55 | `campaign-effects/effect-spirit-powers` | Effect: Spirit Powers |
| CMP-56 | `campaign-effects/effect-spore-feedback` | Effect: Spore Feedback |
| CMP-57 | `campaign-effects/effect-stoop` | Effect: Stoop |
| CMP-58 | `campaign-effects/effect-tarnbreaker-champions` | Effect: Tarnbreaker Champions |
| CMP-59 | `campaign-effects/effect-technological-defence` | Effect: Technological Defence |
| CMP-60 | `campaign-effects/effect-tiger-form` | Effect: Tiger Form |
| CMP-61 | `campaign-effects/effect-utter-treerazers-name` | Effect: Utter Treerazer's Name |
| CMP-62 | `campaign-effects/effect-wind-barrier` | Effect: Wind Barrier |
| CMP-63 | `campaign-effects/effect-worldly-mentor` | Effect: Worldly Mentor |
| CMP-64 | `campaign-effects/effect-xenia-spirit-grand-feast` | Effect: Xenia Spirit Grand Feast |
| CMP-65 | `campaign-effects/malevolence` | Malevolence |
| CMP-66 | `campaign-effects/mixed-drink-dancing-lights` | Mixed Drink: Dancing Lights |
| CMP-67 | `campaign-effects/mixed-drink-guidance` | Mixed Drink: Guidance |
| CMP-68 | `campaign-effects/mixed-drink-luck` | Mixed Drink: Luck |
| CMP-69 | `campaign-effects/mixed-drink-prestidigitation` | Mixed Drink: Prestidigitation |
| BNC-01 | `boons-and-curses/effect-abadars-warning` | Effect: Abadar's Warning |
| BNC-02 | `boons-and-curses/effect-grandmother-spiders-underdog` | Effect: Grandmother Spider's Underdog |
| BNC-03 | `boons-and-curses/effect-gruhasthas-inspiration` | Effect: Gruhastha's Inspiration |
| BNC-04 | `boons-and-curses/effect-rovagugs-destruction` | Effect: Rovagug's Destruction |
| BNC-05 | `boons-and-curses/effect-shelyns-love` | Effect: Shelyn's Love |
| BNC-06 | `boons-and-curses/effect-shizurus-light` | Effect: Shizuru's Light |
| BNC-07 | `boons-and-curses/effect-torags-repairs` | Effect: Torag's Repairs |

## The clauses

**420 clauses:** 399 ☐, 21 —. None has been driven live yet. In 133 the Static check reads "pf2e: nothing": the text is all there is.

### CND-01 · Blinded

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-01a | "You can't detect anything using vision" | effect:unobserved | A blinded creature's token sees nothing by sight; others are not shown to it by vision | pf2e: `visionLevel` is BLINDED and `canSee` false with the condition (Foundry's blind status); no rule element on the item | ☐ | |
| CND-01b | "All normal terrain is difficult terrain to you" | effect:terrain | Every square costs the blinded creature double movement | pf2e: nothing — the text is all. This module: nothing (`scripts/lib/movement-cost.mjs` prices Regions, not a condition) | ☐ | |
| CND-01c | "You automatically critically fail Perception checks that require you to be able to see" | check:degree-shift | A sight-based Perception check comes out a critical failure whatever the die | pf2e: nothing — no AdjustDegreeOfSuccess on this item | ☐ | |
| CND-01d | "if vision is your only precise sense, you take a –4 status penalty to Perception checks" | effect:penalty | −4 status to Perception, and none for a creature with another precise sense | pf2e: FlatModifier status −4 on `perception`, unconditional — it also applies to a creature with another precise sense | ☐ | |
| CND-01e | "You are immune to visual effects" | effect:resistance | A visual effect does not affect the blinded creature | pf2e: Immunity `visual` | ☐ | |
| CND-01f | "Blinded overrides Dazzled" | effect:suppress | A dazzled creature that is blinded loses dazzled's effects while blinded lasts, and gets them back after | pf2e: `overrides: ["dazzled"]` — `ConditionPF2e#prepareSiblingData` deactivates dazzled | ☐ | |

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
| CND-03a | "Clumsy always includes a value" | — | The condition carries a value | pf2e: `value.isValued: true` | ☐ | |
| CND-03b | "You take a status penalty equal to the condition value to Dexterity-based rolls and DCs, including AC, Reflex saves, ranged attack rolls, and skill checks using Acrobatics, Stealth, and Thievery" | effect:penalty | Status −value on AC, Reflex, ranged attacks, Acrobatics, Stealth and Thievery | pf2e: FlatModifier status `-@item.badge.value` on `dex-based` | ☐ | |

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
| CND-05a | "You are Off-Guard" | effect:condition | The confused creature is off-guard (−2 circumstance AC) | pf2e: GrantItem off-guard (in memory) | ☐ | |
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
| CND-07b | "cursebound always includes a value" | — | The condition carries a value | pf2e: `value.isValued: true` | ☐ | |
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
| CND-09c | "You take a –2 status penalty to Perception checks for initiative and checks that involve sound but also rely on other senses" | effect:penalty | −2 status on initiative and on sound-involving checks | pf2e: FlatModifier status −2 on `perception`/`skill-check`, predicated on initiative or an auditory skill check | ☐ | |
| CND-09d | "If you perform an action that has the auditory trait, you must succeed at a flat or the action is lost" | check:flat-check | An auditory action rolls a DC 5 flat check and is lost on a failure | pf2e: ItemAlteration adds a note with a DC 5 flat-check link to auditory actions and feats and to every non-subtle spell; nothing rolls it or refuses the action | ☐ | |
| CND-09e | "attempt the check after spending the action but before any effects are applied" | check:flat-check | The action is spent even when the check fails | pf2e: nothing — the text is all | ☐ | |
| CND-09f | "You are immune to auditory effects while deafened" | effect:resistance | An auditory effect does not affect the deafened creature | pf2e: Immunity `auditory` | ☐ | |

### CND-10 · Doomed

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-10a | "Doomed always includes a value" | — | The condition carries a value | pf2e: `value.isValued: true` | ☐ | |
| CND-10b | "The Dying value at which you die is reduced by your doomed value" | effect:death | Doomed 1 makes dying 3 fatal | pf2e: `CreaturePF2e#prepareDerivedData` lowers `attributes.dying.max` by the doomed value | ☐ | |
| CND-10c | "If your maximum dying value is reduced to 0, you instantly die" | effect:death | Doomed 4 kills outright | pf2e: nothing — dying max reads 0 and nobody is killed | ☐ | |
| CND-10d | "When you die, you're no longer doomed" | effect:condition-removed | Death removes doomed | pf2e: nothing — the text is all | ☐ | |
| CND-10e | "Your doomed value decreases by 1 each time you get a full night's rest" | when:preparations · effect:condition-removed | Rest for the Night lowers doomed by 1 | pf2e: `restForTheNight` decreases doomed | ☐ | |

### CND-11 · Drained

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-11a | "Drained always includes a value" | — | The condition carries a value | pf2e: `value.isValued: true` | ☐ | |
| CND-11b | "You take a status penalty equal to your drained value on Constitution-based rolls and DCs, such as Fortitude saves" | effect:penalty | Status −value on Fortitude and other Con-based rolls | pf2e: FlatModifier status `-1 * @item.badge.value` on `con-based` | ☐ | |
| CND-11c | "You also lose a number of Hit Points equal to your level (minimum 1) times the drained value" | scaling:from-level | Gaining drained 2 at 3rd level takes 6 Hit Points | pf2e: LoseHitPoints `max(1,@actor.level) * @item.badge.value`, re-evaluated on update | ☐ | |
| CND-11d | "your maximum Hit Points are reduced by the same amount" | effect:penalty · scaling:from-level | Maximum HP drops by level × value | pf2e: FlatModifier on `hp`, `min(-1 * @actor.level,-1) * @item.badge.value` | ☐ | |
| CND-11e | "Losing these Hit Points doesn't count as taking damage" | — | The loss triggers nothing that answers damage | pf2e: LoseHitPoints writes HP without a damage roll | ☐ | |
| CND-11f | "Each time you get a full night's rest, your drained value decreases by 1" | when:preparations · effect:condition-removed | Rest for the Night lowers drained by 1 | pf2e: `restForTheNight` decreases drained | ☐ | |
| CND-11g | "This increases your maximum Hit Points, but you don't immediately recover the lost Hit Points" | — | Maximum HP rises on the decrease; current HP does not | pf2e: the `hp` modifier shrinks; LoseHitPoints only takes HP when the value rises | ☐ | |

### CND-12 · Dying

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-12a | "While you have this condition, you are Unconscious" | effect:condition | A dying creature is unconscious, and the unconscious cannot be removed while dying lasts | pf2e: GrantItem unconscious, `onDeleteActions.grantee: restrict` | ☐ | |
| CND-12b | "Dying always includes a value, and if it ever reaches dying 4, you die" | effect:condition-climbs · effect:death | Dying 4 (less doomed) kills | pf2e: `attributes.dying.max` is 4 less doomed and caps the value; nothing marks the creature dead | ☐ | |
| CND-12c | "When you're dying, you must attempt a recovery check at the start of your turn each round to determine whether you get better or worse" | when:turn-start · check:flat-check · effect:condition-climbs | At its turn start a recovery check (DC 10 + dying) is rolled and the value moves with it | pf2e: `ActorPF2e#rollRecovery` from the sheet's button — not at turn start, and the result is a note; the value is moved by hand | ☐ | |
| CND-12d | "Your dying condition increases by 1 if you take damage while dying, or by 2 if you take damage from an enemy's critical hit or a critical failure on your save" | when:damage-taken · effect:condition-climbs | Damage while dying adds 1, or 2 on a critical hit or a critically failed save | pf2e: nothing — the text is all | ☐ | |
| CND-12e | "If you lose the dying condition by succeeding at a recovery check and are still at 0 Hit Points, you remain unconscious" | effect:condition | Stabilised at 0 HP, it stays unconscious | pf2e: nothing — the unconscious goes with the dying that granted it | ☐ | |
| CND-12f | "You lose the dying condition automatically and wake up if you ever have 1 Hit Point or more" | effect:stabilize · effect:condition-removed | Healing to 1 HP or more removes dying and unconscious | pf2e: nothing. This module: `revive` in `scripts/riders/apply.mjs`, for its own stabilising riders only | ☐ | |
| CND-12g | "Any time you lose the dying condition, you gain the Wounded 1 condition, or increase your wounded condition value by 1 if you already have that condition" | effect:condition-climbs | Losing dying adds wounded 1, or raises wounded by 1 | pf2e: nothing. This module: `loseDying` in `scripts/riders/apply.mjs`, when one of its riders removes dying | ☐ | |

### CND-13 · Encumbered

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-13a | "You are carrying more weight than you can manage" | effect:condition | Carrying past the encumbered Bulk gives the condition | pf2e: `imposeEncumberedCondition` when the setting `automation.encumbrance` is on | ☐ | |
| CND-13b | "While you're encumbered, you're Clumsy 1" | effect:condition | Encumbered brings clumsy 1 | pf2e: GrantItem clumsy (in memory) | ☐ | |
| CND-13c | "take a 10-foot penalty to all your Speeds" | effect:speed · effect:penalty | Every Speed is 10 feet lower | pf2e: FlatModifier −10 on `all-speeds` | ☐ | |
| CND-13d | "As with all penalties to your Speed, this can't reduce your Speed below 5 feet" | effect:speed | A 10-foot Speed becomes 5, not 0 | pf2e: nothing — `SpeedStatistic#value` floors at 0, not 5 | ☐ | |

### CND-14 · Enfeebled

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-14a | "Enfeebled always includes a value" | — | The condition carries a value | pf2e: `value.isValued: true` | ☐ | |
| CND-14b | "you take a status penalty equal to the condition value to Strength-based rolls and DCs, including Strength-based melee attack rolls, Strength-based damage rolls, and Athletics checks" | effect:penalty | Status −value on Strength-based attacks, damage and Athletics | pf2e: FlatModifier status `-@item.badge.value` on `str-based` and `str-damage` | ☐ | |

### CND-15 · Fascinated

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-15a | "You take a –2 status penalty to Perception and skill checks" | effect:penalty | −2 status on Perception and skill checks | pf2e: FlatModifier status −2 on `perception` and `skill-check` | ☐ | |
| CND-15b | "you can't use concentrate actions unless they (or their intended consequences) are related to the subject of your fascination, as determined by the GM" | effect:forbid · effect:gm-note | A concentrate action not about the subject is refused or put to the GM | pf2e: nothing — the text is all | ☐ | |
| CND-15c | "This condition ends if a creature uses hostile actions against you or any of your allies" | effect:condition-removed | A hostile action against the fascinated creature or an ally removes fascinated | pf2e: nothing — the text is all | ☐ | |

### CND-16 · Fatigued

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-16a | "You take a –1 status penalty to AC and saving throws" | effect:penalty | −1 status on AC and every save | pf2e: FlatModifier status −1 on `ac` and `saving-throw` | ☐ | |
| CND-16b | "You can't use exploration activities performed while traveling" | effect:forbid | Exploration activities are refused while fatigued | pf2e: nothing — the text is all | ☐ | |
| CND-16c | "You recover from fatigue after a full night's rest" | when:preparations · effect:condition-removed | Rest for the Night removes fatigued | pf2e: `restForTheNight` removes fatigued | ☐ | |

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
| CND-19a | "The frightened condition always includes a value" | — | The condition carries a value | pf2e: `value.isValued: true` | ☐ | |
| CND-19b | "You take a status penalty equal to this value to all your checks and DCs" | effect:penalty | Status −value on every check and DC | pf2e: FlatModifier status `-@item.badge.value` on `all` | ☐ | |
| CND-19c | "Unless specified otherwise, at the end of each of your turns, the value of your frightened condition decreases by 1" | when:turn-end · effect:condition-removed | At its turn end frightened 2 becomes 1, and frightened 1 ends | pf2e: nothing — `CombatantPF2e#onEndTurn` rolls only persistent damage | ☐ | |

### CND-20 · Grabbed

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-20a | "giving you the Off-Guard and Immobilized conditions" | effect:condition | A grabbed creature is off-guard and immobilized | pf2e: GrantItem off-guard and immobilized (in memory) | ☐ | |
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
| CND-28a | "You take a –2 circumstance penalty to AC" | effect:penalty | −2 circumstance to AC | pf2e: FlatModifier circumstance −2 on `ac` | ☐ | |
| CND-28b | "Some effects give you the off-guard condition only to certain creatures or against certain attacks" | effect:condition | Off-guard to one attacker leaves the AC against others untouched | pf2e: the condition is on the actor, for everyone; flanking gives a per-attacker off-guard | ☐ | |
| CND-28c | "If a rule doesn't specify that the condition applies only to certain circumstances, it applies to all of them" | — | Plain off-guard counts against every attack | pf2e: the condition's modifier applies everywhere | ☐ | |

### CND-29 · Paralyzed

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-29a | "You have the Off-Guard condition" | effect:condition | A paralyzed creature is off-guard | pf2e: GrantItem off-guard (in memory) | ☐ | |
| CND-29b | "can't act except to Recall Knowledge and use actions that require only your mind (as determined by the GM)" | effect:forbid | Every action but Recall Knowledge and purely mental ones is refused | pf2e: `canAct` false and `canFlank` false; nothing refuses an action. This module: no reaction card for it (`looksAbleToReact`, `scripts/riders/reactions.mjs`) | ☐ | |
| CND-29c | "Your senses still function, but only in the areas you can perceive without moving, so you can't Seek" | effect:forbid | Seek is refused | pf2e: nothing — the text is all | ☐ | |

### CND-30 · Persistent Damage

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-30a | "Like normal damage, it can be doubled or halved based on the results of an attack roll or saving throw" | effect:persistent | A critical hit's persistent damage is doubled; a save's degree halves or doubles it | pf2e: the condition records `criticalHit` from the damage roll and doubles on it | ☐ | |
| CND-30b | "Instead of taking persistent damage immediately, you take it at the end of each of your turns as long as you have the condition, rolling any damage dice anew each time" | when:turn-end · effect:persistent | At each of its turn ends the damage is rolled anew and taken | pf2e: `ConditionPF2e#onEndTurn` posts a fresh roll at the turn end; applying it is a click on the card | ☐ | |
| CND-30c | "After you take persistent damage, roll a flat to see if you recover from the persistent damage" | check:flat-check · effect:persistent | A DC 15 flat check follows each tick | pf2e: the card's recovery button (`rollRecovery`, DC from the condition, 15 by default); not rolled by itself | ☐ | |
| CND-30d | "If you succeed, the condition ends" | effect:condition-removed | Success removes that persistent damage | pf2e: `rollRecovery` removes the condition on a success | ☐ | |

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
| CND-32a | "You are Off-Guard" | effect:condition | A prone creature is off-guard | pf2e: GrantItem off-guard (in memory) | ☐ | |
| CND-32b | "take a –2 circumstance penalty to attack rolls" | effect:penalty | −2 circumstance on every attack roll | pf2e: FlatModifier circumstance −2 on `attack-roll` | ☐ | |
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
| CND-34a | "You have the Off-Guard and Immobilized conditions" | effect:condition | A restrained creature is off-guard and immobilized | pf2e: GrantItem off-guard and immobilized (in memory); ActiveEffectLike `canFlank` false | ☐ | |
| CND-34b | "you can't use any attack or manipulate actions except to attempt to Escape or Force Open your bonds" | effect:forbid | Attacks and manipulate actions other than Escape and Force Open are refused | pf2e: a Note on attacks and skill checks other than Escape and Force Open, and a description note on manipulate items; nothing is refused. This module: `scripts/riders/forbids.mjs` refuses these only for an effect carrying `forbids` | ☐ | |
| CND-34c | "Restrained overrides Grabbed" | effect:suppress | A grabbed creature that is restrained loses grabbed's effects while restrained lasts | pf2e: `overrides: ["grabbed"]` — `ConditionPF2e#prepareSiblingData` deactivates grabbed | ☐ | |

### CND-35 · Sickened

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-35a | "Sickened always includes a value" | — | The condition carries a value | pf2e: `value.isValued: true` | ☐ | |
| CND-35b | "You take a status penalty equal to this value on all your checks and DCs" | effect:penalty | A status penalty of the value on every check and DC | pf2e: FlatModifier status `-@item.badge.value` on `all` | ☐ | |
| CND-35c | "You can't willingly ingest anything-including elixirs and potions-while sickened" | effect:forbid | Drinking an elixir or potion is refused while sickened | pf2e: an ItemAlteration notes it on ingested consumables; nothing refuses the use | ☐ | |
| CND-35d | "You can spend a single action retching in an attempt to recover, which lets you immediately attempt a Fortitude save against the DC of the effect that made you sickened" | economy:granted-action · check:save | A one-action retch, rolled as a Fortitude save at the DC of what sickened the creature | pf2e: nothing — no action on the item, and the source's DC is not kept | ☐ | |
| CND-35e | "On a success, you reduce your sickened value by 1 (or by 2 on a critical success)" | check:save · effect:condition-climbs | The value drops by 1, or by 2 on a critical success | pf2e: nothing | ☐ | |

### CND-36 · Slowed

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-36a | "Slowed always includes a value" | — | The condition carries a value | pf2e: `value.isValued: true` | ☐ | |
| CND-36b | "When you regain your actions, reduce the number of actions regained by your slowed value" | when:turn-start | Slowed 1 leaves two actions at the start of the turn | pf2e: nothing — the condition has no rules and pf2e counts no actions | ☐ | |
| CND-36c | "Because you regain actions at the start of your turn, you don't immediately lose actions if you become slowed during your turn" | when:turn-start | Slowed mid-turn takes nothing until the next turn | pf2e: nothing — the text is all | ☐ | |

### CND-37 · Stunned

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-37a | "You can't act" | effect:forbid | Every action is refused while stunned | pf2e: `canAct` false (it stops flanking); nothing refuses an action. This module: no reaction card for it (`looksAbleToReact`, `scripts/riders/reactions.mjs`) | ☐ | |
| CND-37b | "Stunned usually includes a value, which indicates how many total actions you lose, possibly over multiple turns, from being stunned" | — | The value counts actions lost in all | pf2e: `value.isValued: true` | ☐ | |
| CND-37c | "Each time you regain actions, reduce the number you regain by your stunned value, then reduce your stunned value by the number of actions you lost" | when:turn-start · effect:condition-removed | Stunned 4 takes all three actions and leaves stunned 1; next turn one more, and it ends | pf2e: nothing — pf2e counts no actions and never lowers stunned | ☐ | |
| CND-37d | "Stunned might also have a duration instead, such as "stunned for 1 minute," causing you to lose all your actions for the duration" | ending:duration | A duration stun takes every action until it ends | pf2e: nothing on the item; an effect granting it carries the duration | ☐ | |
| CND-37e | "Stunned overrides Slowed" | effect:suppress | A slowed creature that is stunned loses slowed's effects while stunned lasts | pf2e: `overrides: ["slowed"]` — `ConditionPF2e#prepareSiblingData` deactivates slowed | ☐ | |
| CND-37f | "If the duration of your stunned condition ends while you are slowed, you count the actions lost to the stunned condition toward those lost to being slowed" | when:turn-start | Stunned 1 and slowed 2 leave one action, not zero | pf2e: nothing — the text is all | ☐ | |

### CND-38 · Stupefied

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-38a | "Stupefied always includes a value" | — | The condition carries a value | pf2e: `value.isValued: true` | ☐ | |
| CND-38b | "You take a status penalty equal to this value on Intelligence-, Wisdom-, and Charisma-based rolls and DCs, including Will saving throws, spell attack modifiers, spell DCs, and skill checks that use these attribute modifiers" | effect:penalty | Status −value on Will, spell attacks, spell DCs and Int-, Wis- and Cha-based skills | pf2e: FlatModifier status `-@item.badge.value` on `int-based`, `wis-based` and `cha-based` | ☐ | |
| CND-38c | "Any time you attempt to Cast a Spell while stupefied, the spell is disrupted unless you succeed at a flat with a DC equal to 5 + your stupefied value" | when:cast · check:flat-check | Each cast rolls a flat check against 5 + value, and a failure loses the spell | pf2e: ItemAlteration adds a note with the flat-check link to every spell; nothing rolls it. This module: nothing in `scripts/cast-pipeline.mjs` | ☐ | |

### CND-39 · Unconscious

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CND-39a | "You can't act" | effect:forbid | Every action is refused while unconscious | pf2e: `canAct` false; nothing refuses an action. This module: no reaction card for it (`looksAbleToReact`, `scripts/riders/reactions.mjs`) | ☐ | |
| CND-39b | "You take a –4 status penalty to AC, Perception, and Reflex saves" | effect:penalty | −4 status on AC, Perception and Reflex | pf2e: FlatModifier status −4 on `ac`, `perception` and `reflex` | ☐ | |
| CND-39c | "you have the Blinded and Off-Guard conditions" | effect:condition | An unconscious creature is blinded and off-guard | pf2e: GrantItem blinded (deletion restricted) and off-guard (in memory) | ☐ | |
| CND-39d | "When you gain this condition, you fall Prone" | effect:condition | Falling unconscious adds prone, which stays after waking | pf2e: GrantItem prone, detached when unconscious ends | ☐ | |
| CND-39e | "drop items you're holding unless the effect states otherwise or the GM determines you're positioned so you wouldn't" | effect:disarm | Held items are dropped | pf2e: nothing — the text is all | ☐ | |
| CND-39f | "If you're unconscious because you're Dying, you can't wake up while you have 0 Hit Points" | effect:condition-floor | Unconscious cannot be removed while dying at 0 HP | pf2e: dying's GrantItem restricts deleting the unconscious it grants | ☐ | |
| CND-39g | "If you are restored to 1 Hit Point or more, you lose the dying and unconscious conditions and can act normally on your next turn" | effect:stabilize · effect:condition-removed | Healing to 1 HP removes dying and unconscious | pf2e: nothing. This module: `revive` in `scripts/riders/apply.mjs`, for its own stabilising riders only | ☐ | |
| CND-39h | "If you are unconscious and at 0 Hit Points, but not dying, you return to 1 Hit Point and awaken after sufficient time passes" | effect:heal · effect:condition-removed | After the time passes it is at 1 HP and awake | pf2e: nothing — the text is all | ☐ | |
| CND-39i | "The GM determines how long you remain unconscious, from a minimum of 10 minutes to several hours" | — | — | pf2e: nothing | — | The time is a GM ruling |
| CND-39j | "If you are healed, you lose the unconscious condition and can act normally on your next turn" | effect:condition-removed | Any healing at 0 HP removes unconscious | pf2e: nothing — the text is all | ☐ | |
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
| CND-43a | "If you lose the Dying condition and do not already have the wounded condition, you become wounded 1" | effect:condition | Losing dying gives wounded 1 | pf2e: nothing. This module: `loseDying` in `scripts/riders/apply.mjs`, when one of its riders removes dying | ☐ | |
| CND-43b | "If you already have the wounded condition when you lose the dying condition, your wounded condition value increases by 1" | effect:condition-climbs | Losing dying while wounded 1 gives wounded 2 | pf2e: nothing. This module: `loseDying` (riders only) | ☐ | |
| CND-43c | "If you gain the dying condition while wounded, increase your dying condition value by your wounded value" | effect:condition-climbs | Wounded 2 at 0 HP gives dying 3 | pf2e: nothing — the text is all | ☐ | |
| CND-43d | "The wounded condition ends if someone successfully restores Hit Points to you using Treat Wounds" | effect:condition-removed | A Treat Wounds that heals removes wounded | pf2e: nothing — the text is all | ☐ | |
| CND-43e | "or if you are restored to full Hit Points by any means and rest for 10 minutes" | effect:condition-removed | Full HP and 10 minutes' rest remove wounded | pf2e: only `restForTheNight` removes wounded, and only at full HP; a 10-minute rest does not | ☐ | |

### OFX-01 · Effect: -1 circumstance penalty to attack rolls until you score a critical hit

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-01a | "-1 circumstance penalty to attack rolls" | effect:penalty | Every attack roll the holder makes is 1 lower, as a circumstance penalty | pf2e: FlatModifier circumstance −1 on `attack` | ☐ | |
| OFX-01b | "until you score a critical hit" | when:strike-made · effect:penalty | The effect is removed the first time the holder's attack is a critical success | pf2e: nothing — the duration is unlimited and no rule removes the effect on a critical hit | ☐ | |

### OFX-02 · Effect: -2 circumstance penalty to attack rolls

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-02a | "-2 circumstance penalty to attack rolls" | effect:penalty | Every attack roll the holder makes is 2 lower, as a circumstance penalty | pf2e: FlatModifier circumstance −2 on `attack`; the item lasts 1 round, expiring at turn end (not in the text) | ☐ | |

### OFX-03 · Effect: -2 circumstance penalty to attack rolls made with this attack until healed

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-03a | "-2 circumstance penalty to attack rolls made with this attack" | reach:weapon · effect:penalty | Attacks with the one chosen weapon are 2 lower; the holder's other attacks are not | pf2e: ChoiceSet of an owned weapon, then FlatModifier circumstance −2 on that weapon's `-attack` selector | ☐ | |
| OFX-03b | "until healed" | effect:penalty | The effect is removed when the holder regains Hit Points | pf2e: nothing — the duration is unlimited and no rule removes the effect on healing | ☐ | |

### OFX-04 · Effect: -2 circumstance penalty to attack rolls until healed

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-04a | "-2 circumstance penalty to attack rolls" | effect:penalty | Every attack roll the holder makes is 2 lower, as a circumstance penalty | pf2e: FlatModifier circumstance −2 on `attack` | ☐ | |
| OFX-04b | "until healed" | effect:penalty | The effect is removed when the holder regains Hit Points | pf2e: nothing — the duration is unlimited and no rule removes the effect on healing | ☐ | |

### OFX-05 · Effect: -2 circumstance penalty to attack rolls with this weapon

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-05a | "-2 circumstance penalty to attack rolls with this weapon" | reach:weapon · effect:penalty | Attacks with the one chosen weapon are 2 lower; the holder's other attacks are not | pf2e: ChoiceSet of an owned weapon, then FlatModifier circumstance −2 on that weapon's `-attack` selector; the item lasts 1 round, expiring at turn end | ☐ | |

### OFX-06 · Effect: -2 circumstance penalty to checks and saving throws until healed

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-06a | "-2 circumstance penalty to checks and saving throws" | effect:penalty | Every check and save the holder rolls is 2 lower | pf2e: FlatModifier circumstance −2 on `all` — which also lowers the holder's DCs, more than the text says | ☐ | |
| OFX-06b | "until healed" | effect:penalty | The effect is removed when the holder regains Hit Points | pf2e: nothing — the duration is unlimited and no rule removes the effect on healing | ☐ | |

### OFX-07 · Effect: -2 circumstance penalty to ranged attacks

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-07a | "-2 circumstance penalty to ranged attacks" | effect:penalty | The holder's ranged attack rolls are 2 lower; melee ones are not | pf2e: FlatModifier circumstance −2 on `ranged-attack-roll`; the item lasts 1 round, expiring at turn end | ☐ | |

### OFX-08 · Effect: -2 circumstance penalty to spell attack rolls and spell DC's

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-08a | "-2 circumstance penalty to spell attack rolls and spell DC's" | effect:penalty | The holder's spell attack rolls and spell DCs are both 2 lower | pf2e: two FlatModifiers, circumstance −2 on `spell-attack` and on `spell-dc`; the item lasts 1 round, expiring at turn end | ☐ | |

### OFX-09 · Effect: –10-foot circumstance penalty to all Speeds

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-09a | "-10-foot circumstance penalty to all Speeds" | effect:speed · effect:penalty | Every Speed the holder has — land, fly, swim, climb, burrow — is 10 feet lower | pf2e: FlatModifier circumstance −10 on `speed` | ☐ | |

### OFX-10 · Effect: –10-foot circumstance penalty to your land Speed

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-10a | "-10-foot circumstance penalty to your land Speed" | effect:speed · effect:penalty | The holder's land Speed is 10 feet lower; its other Speeds are not | pf2e: FlatModifier circumstance −10 on `land-speed` | ☐ | |

### OFX-11 · Effect: –10-foot status penalty to your land Speed

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-11a | "-10-foot status penalty to your land Speed" | effect:speed · effect:penalty | The holder's land Speed is 10 feet lower, as a status penalty | pf2e: FlatModifier status −10 on `land-speed` | ☐ | |

### OFX-12 · Effect: –15-foot status penalty to your land Speed

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-12a | "-15-foot status penalty to your land Speed" | effect:speed · effect:penalty | The holder's land Speed is 15 feet lower, as a status penalty | pf2e: FlatModifier status −15 on `land-speed` | ☐ | |

### OFX-13 · Effect: –5-foot circumstance penalty to your land Speed

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-13a | "-5-foot circumstance penalty to your land Speed" | effect:speed · effect:penalty | The holder's land Speed is 5 feet lower, as a circumstance penalty | pf2e: FlatModifier circumstance −5 on `land-speed` | ☐ | |

### OFX-14 · Effect: –5-foot status penalty to your land Speed

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-14a | "-5-foot status penalty to your land Speed" | effect:speed · effect:penalty | The holder's land Speed is 5 feet lower, as a status penalty | pf2e: FlatModifier status −5 on `land-speed` | ☐ | |

### OFX-15 · Effect: +1 circumstance bonus to attack rolls for 3 rounds

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-15a | "+1 circumstance bonus to attack rolls for 3 rounds" | effect:bonus · ending:duration | Attack rolls are 1 higher, and the effect ends after 3 rounds | pf2e: FlatModifier circumstance +1 on `attack`; the item lasts 3 rounds, expiring at turn end | ☐ | |
| OFX-15b | "but you are Off-Guard" | effect:condition | The holder is off-guard for as long as the bonus lasts | pf2e: nothing — the item grants no off-guard; the text is all | ☐ | |

### OFX-16 · Effect: +2 circumstance bonus to AC

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-16a | "+2 circumstance bonus to AC" | effect:bonus | The holder's AC is 2 higher | pf2e: FlatModifier circumstance +2 on `ac`; the item lasts 1 round, expiring at turn end | ☐ | |

### OFX-17 · Effect: +2 circumstance bonus to attack rolls

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-17a | "+2 circumstance bonus to attack rolls" | effect:bonus | The holder's attack rolls are 2 higher | pf2e: FlatModifier circumstance +2 on `attack`; the item lasts 1 round, expiring at turn end | ☐ | |

### OFX-18 · Effect: +2 status bonus to AC and all saving throws

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-18a | "+2 status bonus to AC and all saving throws" | effect:bonus | AC, Fortitude, Reflex and Will are all 2 higher, as a status bonus | pf2e: FlatModifiers status +2 on `ac` and on `saving-throw`; the item lasts 1 round, expiring at turn end | ☐ | |

### OFX-19 · Effect: +2 status bonus to attack rolls

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-19a | "+2 status bonus to attack rolls" | effect:bonus | The holder's attack rolls are 2 higher, as a status bonus | pf2e: FlatModifier status +2 on `attack`; the item lasts 1 round, expiring at turn end | ☐ | |

### OFX-20 · Effect: +2 status bonus to saving throws against spells for 1 min

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-20a | "+2 status bonus to saving throws against spells for 1 min" | effect:bonus · ending:duration | Saves against spells are 2 higher, other saves are not, and the effect ends after 1 minute | pf2e: FlatModifier status +2 on `saving-throw`, predicate `spell`; the item lasts 1 minute | ☐ | |

### OFX-21 · Effect: +4 circumstance bonus to AC against your ranged attacks

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-21a | "Cover provides +4 circumstance bonus to AC against your ranged attacks" | effect:cover · effect:bonus | A creature with cover from the holder has +4 AC against the holder's ranged attacks | pf2e: a toggleable RollOption `overcompensate-effect` and a FlatModifier circumstance +4 on the **holder's own** `ac` when it is on — the holder's AC, not the covered target's, so it reads right only if the effect is put on the target; the item lasts 1 minute | ☐ | |

### OFX-22 · Effect: Adverse Subsist Situation

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-22a | "You take a –2 circumstance penalty to checks to Subsist." | effect:penalty | A Subsist check is 2 lower; other skill checks are not | pf2e: FlatModifier circumstance −2 on `skill-check`, predicate `action:subsist`; the item lasts 7 days | ☐ | |

### OFX-23 · Effect: Aid

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-23a | "You gain a circumstance bonus to the aided check based on the result of your ally's Aid check." | when:check-rolled · effect:bonus | The aided check gets the bonus the ally's Aid degree gives, and only that check | pf2e: ChoiceSet of −1, +1, +2, +3 or +4, picked by hand rather than read from the Aid check; FlatModifier circumstance on `attack-roll` and `skill-check`, removed after the next roll — any attack or skill check, not only the aided one | ☐ | |

### OFX-24 · Effect: Ancestral Might

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-24a | "You gain a +2 status bonus to checks based on the attributes that are boosted by your ancestry (ignoring free boosts)" | effect:bonus | Checks keyed to the ancestry's fixed boosts are 2 higher | pf2e: two ChoiceSets of an attribute, picked by hand rather than read from the ancestry; FlatModifier status +2 on each chosen `-based` selector | ☐ | |
| OFX-24b | "If your ancestry only grants free boosts, select one attribute to gain the bonus to instead" | check:caster-choice · effect:bonus | An ancestry with only free boosts asks for one attribute, and checks keyed to it are 2 higher | pf2e: the first ChoiceSet serves; the second allows no selection. Nothing tells the two cases apart | ☐ | |

### OFX-25 · Effect: Aquatic Combat

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-25a | "You're off-guard unless you have a swim Speed" | effect:condition | Off-guard while the effect holds, unless the holder has a swim Speed | pf2e: GrantItem off-guard, predicate neither `speed:swim` nor `aquatic-combat:not-off-guard` | ☐ | |
| OFX-25b | "You gain resistance 5 to acid and fire" | effect:resistance | Resistance 5 to acid and to fire | pf2e: Resistance 5 to `acid` and `fire` | ☐ | |
| OFX-25c | "You take a –2 circumstance penalty to your attack roll for bludgeoning or slashing attacks that pass through water" | effect:penalty | Bludgeoning and slashing attacks are 2 lower; piercing ones are not | pf2e: FlatModifier circumstance −2 on `attack-roll` for bludgeoning or slashing damage, unless the weapon has an underwater rune or the holder is an amphibious or aquatic NPC. Whether the attack passes through water is not read | ☐ | |
| OFX-25d | "Ranged attacks made by an underwater creature or against an underwater target have their range increments halved" | effect:range | The holder's ranged Strikes have half their range increment, and so do ranged attacks made against the holder | pf2e: AdjustStrike multiplies the holder's own ranged Strikes' `range-increment` by 0.5 (not with an underwater rune), and a Note on ranged attack rolls. Attacks made against the holder from outside are not halved | ☐ | |
| OFX-25e | "You can't cast fire spells or use actions with the fire trait underwater" | effect:forbid | Casting a fire spell or using a fire action is refused | pf2e: a Note on every fire-trait roll only; nothing refuses the cast or the action | ☐ | |
| OFX-25f | "any part of the effect that's unrelated to fire still works" | effect:damage | A fire weapon or spell still deals its other damage, with its fire damage removed | pf2e: DamageAlteration sets fire damage dice to 0 and AdjustModifier suppresses fire modifiers, on attack, spell and inline damage, except impulses | ☐ | |

### OFX-26 · Effect: Aura of Protection

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-26a | "You gain resistance to all damage equal to the rank of the spell that you just cast." | effect:resistance | Resistance to all damage equal to the rank of the spell just cast | pf2e: ChoiceSet of a rank, picked by hand (ranks gated by the holder's level) rather than read from the cast; Resistance `all-damage` equal to it; the item lasts 1 round | ☐ | |

### OFX-27 · Effect: Avert Gaze

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-27a | "You gain a +2 circumstance bonus to saves against visual abilities that require you to look at a creature or object" | effect:bonus | Saves against visual effects are 2 higher; other saves are not | pf2e: FlatModifier circumstance +2 on `saving-throw`, predicate `item:trait:visual` — every visual effect, not only those needing a look; the item lasts 1 round | ☐ | |

### OFX-28 · Effect: Called Foe

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-28a | "Designate a foe" | reach:single | One creature is marked as the called foe | pf2e: TokenMark `called-foe` on the targeted token | ☐ | |
| OFX-28b | "You gain a +2 status bonus to attack rolls made against that foe" | effect:bonus | Attacks against the marked creature are 2 higher | pf2e: the −4 FlatModifier is turned into +2 by AdjustModifier when the target carries `target:mark:called-foe` | ☐ | |
| OFX-28c | "you take a –4 status penalty to attack rolls made against any other creature" | effect:penalty | Attacks against anyone else are 4 lower | pf2e: FlatModifier status −4 on `attack-roll` | ☐ | |

### OFX-29 · Effect: Catch your Breath

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-29a | "You gain a number of temporary Hit Points equal to twice the origin's level." | effect:temp-hp · scaling:from-level | Temporary Hit Points equal to twice the origin's level | pf2e: TempHP `2*@item.origin.level`; the item lasts the encounter | ☐ | |

### OFX-30 · Effect: Class Might

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-30a | "You gain a +2 status bonus to checks based on the key attribute of your class." | effect:bonus | Checks keyed to the class's key attribute are 2 higher | pf2e: ChoiceSet of an attribute, picked by hand rather than read from the class; FlatModifier status +2 on its `-based` selector; the item lasts 1 round | ☐ | |

### OFX-31 · Effect: Cover

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-31a | "When you're behind an obstacle that could block weapons, guard you against explosions, and make you harder to detect, you're behind cover" | effect:cover | A creature behind an obstacle has cover without anyone adding it | pf2e: nothing — the effect is added by hand; nothing measures obstacles. The world's copy is translated (*Efecto: Cobertura*) | ☐ | |
| OFX-31b | "Standard cover gives you a +2 circumstance bonus to AC" | effect:cover · effect:bonus | AC 2 higher under standard cover | pf2e: ChoiceSet of the cover level; FlatModifier circumstance on `ac` equal to its bonus | ☐ | |
| OFX-31c | "to Reflex saves against area effects" | effect:cover · effect:bonus | Reflex saves against an area are 2 higher; other Reflex saves are not | pf2e: FlatModifier circumstance on `reflex`, predicate `area-effect` | ☐ | |
| OFX-31d | "and to Stealth checks to Hide, Sneak, or otherwise avoid detection" | effect:cover · effect:bonus | Hide, Sneak and Avoid Notice checks are 2 higher | pf2e: FlatModifier circumstance on `stealth` for `action:hide`, `action:sneak` or `avoid-detection`, and on `initiative` for `action:avoid-notice` | ☐ | |
| OFX-31e | "You can increase this to greater cover using the Take Cover basic action, increasing the circumstance bonus to +4" | effect:cover · effect:bonus | Take Cover raises the bonus to +4 | pf2e: the ChoiceSet's Greater option, +4, picked by hand when the effect is added; nothing reads the Take Cover action | ☐ | |
| OFX-31f | "If cover is especially light, typically when it's provided by a creature, you have lesser cover, which grants a +1 circumstance bonus to AC" | effect:cover · effect:bonus | Lesser cover gives +1 to AC, and nothing to Reflex or Stealth | pf2e: the Lesser option, +1 — through the same rules, so lesser cover also gives +1 to Reflex against areas and to Stealth, more than the text says | ☐ | |
| OFX-31g | "A creature with standard cover or greater cover can attempt to use Stealth to Hide, but lesser cover isn't sufficient" | economy:requires | Hide is offered under standard or greater cover and refused under lesser cover or none | pf2e: nothing — Hide is never refused | ☐ | |

### OFX-32 · Effect: Critical Moment

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-32a | "Reroll the check twice and take the best result" | check:reroll · check:roll-twice | The check already rolled is rolled again twice, and the best of the new rolls stands | pf2e: RollTwice keep higher on `check` — the **next** check, not a reroll of the one already rolled | ☐ | |
| OFX-32b | "If you still fail this check, you become doomed 1" | when:check-rolled · effect:condition | On a failure or critical failure the holder gains doomed 1 | pf2e: a Note on failure and critical failure only; nothing applies doomed | ☐ | |

### OFX-33 · Effect: Daring Attempt

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-33a | "Select one untrained skill" | check:caster-choice | A prompt offers only the holder's untrained skills | pf2e: ChoiceSet of skills, predicate rank 0 | ☐ | |
| OFX-33b | "You are trained in that skill" | effect:proficiency | The chosen skill is trained | pf2e: ActiveEffectLike upgrades the skill's rank to 1 | ☐ | |

### OFX-34 · Effect: Dazzled until end of your next turn

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-34a | "You are Dazzled until the end of your next turn." | effect:condition · ending:next-turn | Dazzled, gone at the end of the holder's next turn | pf2e: GrantItem dazzled, which cannot be deleted on its own; the item lasts 1 round, expiring at turn end | ☐ | |

### OFX-35 · Effect: Deafened until end of your next turn

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-35a | "You are Deafened until the end of your next turn." | effect:condition · ending:next-turn | Deafened, gone at the end of the holder's next turn | pf2e: GrantItem deafened, which cannot be deleted on its own; the item lasts 1 round, expiring at turn end | ☐ | |

### OFX-36 · Effect: Desperate Swing

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-36a | "Your Strike ignores the multiple attack penalty" | economy:attack-penalty | The one Strike rolls with no multiple attack penalty | pf2e: AdjustModifier suppresses `multiple-attack-penalty` on `strike-attack-roll` — every Strike for the item's 1 round, not one | ☐ | |
| OFX-36b | "If you roll a critical success, you get a normal success instead" | check:degree-shift | A critical success on that Strike resolves as a success | pf2e: AdjustDegreeOfSuccess, critical success one degree worse, on `strike-attack-roll` | ☐ | |

### OFX-37 · Effect: Disarm (Bonus)

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-37a | "You gain a +2 circumstance bonus to Disarm." | effect:bonus | A Disarm against the loosened creature is 2 higher | pf2e: FlatModifier circumstance +2 on `skill-check`, predicate `action:disarm`; given as an EphemeralEffect by OFX-38 | ☐ | |

### OFX-38 · Effect: Disarm (Success)

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-38a | "You take a –2 circumstance penalty to attacks using the targeted item" | reach:weapon · effect:disarm · effect:penalty | Attacks with the loosened weapon are 2 lower; the holder's other attacks are not | pf2e: ChoiceSet of an equipped non-unarmed attack, FlatModifier circumstance −2 on its `-attack` selector; the duration is unlimited. This module: `scripts/riders/apply.mjs` (`applyDisarm`, `mode: "loosen"`) creates it with the held weapon already chosen | ☐ | |
| OFX-38b | "Further attempts to Disarm you gain a +2 circumstance bonus" | effect:disarm · effect:bonus | The next Disarm against the holder is 2 higher | pf2e: EphemeralEffect on the origin's `skill-check`, granting OFX-37 | ☐ | |

### OFX-39 · Effect: Endure the Onslaught

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-39a | "You gain resistance to all damage." | effect:resistance | Resistance to all damage | pf2e: Resistance `all-damage` 5, 10 at origin level 7, 15 at 12; the item lasts 1 round | ☐ | |

### OFX-40 · Effect: Fluid Motion

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-40a | "You gain a climb Speed and a swim Speed equal to half your Speed." | effect:speed | A climb Speed and a swim Speed, each half the land Speed | pf2e: BaseSpeed `climb` and `swim`, each `floor(land / 2)` | ☐ | |

### OFX-41 · Effect: Follow The Expert

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-41a | "You can add your level as a proficiency bonus to the associated skill check, even if you're untrained" | effect:proficiency · scaling:from-level | The chosen skill adds the holder's level as proficiency, even untrained | pf2e: ChoiceSet of the skill; FlatModifier of type `proficiency` equal to `@actor.level` on it | ☐ | |
| OFX-41b | "Additionally, you gain a circumstance bonus to your skill check based on your ally's proficiency" | effect:bonus | +2, +3 or +4 for an expert, master or legendary ally | pf2e: ChoiceSet of the ally's rank, picked by hand rather than read from the ally; FlatModifier circumstance equal to it on the chosen skill | ☐ | |

### OFX-42 · Effect: Impossible Shot

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-42a | "You double the range increment of your weapon or unarmed attack." | effect:range | The ranged Strike's range increment is doubled | pf2e: AdjustStrike multiplies `range-increment` by 2 on ranged Strikes; the item lasts 1 round | ☐ | |

### OFX-43 · Effect: Mounted

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-43a | "You take a –2 circumstance penalty to Reflex saves while mounted." | effect:penalty | Reflex saves are 2 lower while the holder is mounted, and not after it dismounts | pf2e: FlatModifier circumstance −2 on `reflex`; the effect is added and removed by hand — nothing reads being mounted | ☐ | |

### OFX-44 · Effect: Off-Guard until end of your next turn

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-44a | "You are Off-Guard until the end of your next turn." | effect:condition · ending:next-turn | Off-guard, gone at the end of the holder's next turn | pf2e: GrantItem off-guard, which cannot be deleted on its own; the item lasts 1 round, expiring at turn end | ☐ | |

### OFX-45 · Effect: Press On

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-45a | "You ignore penalties to checks and DCs from conditions." | effect:suppress · effect:penalty | Condition penalties are left out of the holder's checks and DCs while it lasts; the conditions stay | pf2e: AdjustModifier suppresses, on `all`, the penalties slugged blinded, clumsy, deafened, drained, enfeebled, fascinated, fatigued, frightened, off-guard, prone, sickened, stupefied and unconscious | ☐ | |

### OFX-46 · Effect: Rage and Fury

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-46a | "You gain a +2 bonus to damage to melee Strikes" | effect:strike-damage · effect:bonus | Melee Strikes deal 2 more damage; ranged ones do not | pf2e: untyped FlatModifier +2 on `melee-strike-damage` | ☐ | |
| OFX-46b | "a –1 AC penalty" | effect:penalty | AC is 1 lower | pf2e: untyped FlatModifier −1 on `ac`; the item lasts 1 round | ☐ | |

### OFX-47 · Effect: Remaining Air

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-47a | "You can hold your breath for a number of rounds equal to 5 + your Constitution modifier" | economy:charges | A counter of 5 + Con rounds of air | pf2e: ActiveEffectLike sets `flags.system.remainingAir.rounds` to 5 + Con, and the badge's maximum to it | ☐ | |
| OFX-47b | "Reduce your remaining air by 1 round at the end of each of your turns" | when:turn-end · economy:charges | The counter drops by 1 at each of the holder's turn ends | pf2e: nothing — the badge is counted down by hand | ☐ | |
| OFX-47c | "or by 2 if you attacked or cast any spells that turn" | when:turn-end · economy:charges | A turn with an attack or a spell drops it by 2 instead | pf2e: a Note on attack rolls and a line added to spell descriptions; nothing counts | ☐ | |
| OFX-47d | "You also lose 1 round worth of air each time you are critically hit" | when:strike-received · economy:charges | A critical hit on the holder drops the counter by 1 | pf2e: a Note on `damage-received` for a critical success; nothing counts | ☐ | |
| OFX-47e | "or critically fail a save against a damaging effect" | when:save-made · economy:charges | A critically failed save against damage drops the counter by 1 | pf2e: a Note on `saving-throw` for a critical failure, predicate `damaging-effect`; nothing counts | ☐ | |
| OFX-47f | "If you speak (including Casting a Spell) you lose all remaining air" | when:cast · economy:charges | Casting a non-subtle spell or using an auditory action empties the counter | pf2e: a line added to non-subtle spells' and auditory actions' and feats' descriptions; nothing empties the badge | ☐ | |

### OFX-48 · Effect: Resistance 5 to all damage

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-48a | "Resistance 5 to all damage" | effect:resistance | Resistance 5 to all damage | pf2e: Resistance `all-damage` 5; the item lasts 1 round | ☐ | |

### OFX-49 · Effect: Scout

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-49a | "You gain a +1 circumstance bonus to your initiative roll." | effect:bonus | The next initiative roll is 1 higher | pf2e: FlatModifier circumstance +1 on `initiative`, removed after an initiative roll (`check:type:initiative`) | ☐ | |

### OFX-50 · Effect: Spark of Courage

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-50a | "You gain a +2 status bonus to attack rolls and skill checks." | effect:bonus | Attack rolls and skill checks are 2 higher | pf2e: FlatModifier status +2 on `attack-roll` and `skill-check`; the item lasts 1 round, expiring at turn end | ☐ | |

### OFX-51 · Effect: Strike True

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-51a | "You roll twice and take the higher result on your Strike" | check:roll-twice | The one Strike rolls twice and keeps the higher | pf2e: RollTwice keep higher on `strike-attack-roll`, not removed after the roll — every Strike for the item's 1 round, not one | ☐ | |
| OFX-51b | "This Strike deals an extra die of damage on a hit if the attacker has fewer than half their maximum Hit Points" | effect:strike-damage | One more weapon die when the attacker is under half its Hit Points | pf2e: DamageDice 1 on `strike-damage`, predicate `hp-percent` from 25 to under 50 | ☐ | |
| OFX-51c | "or two extra dice if they have fewer than one quarter their maximum Hit Points" | effect:strike-damage | Two more dice when under a quarter | pf2e: DamageDice 2 on `strike-damage`, predicate `hp-percent` under 25 | ☐ | |

### OFX-52 · Effect: Treat Disease

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-52a | "You gain a circumstance bonus or penalty to your next save against the disease." | effect:bonus · effect:penalty · ending:spent | +4, +2 or −2 to the next disease save, by the Treat Disease degree, then gone | pf2e: ChoiceSet of +4, +2 or −2, filtered by the treating check's degree when the context carries it; FlatModifier circumstance on `saving-throw`, predicate `item:trait:disease`, removed after the roll | ☐ | |

### OFX-53 · Effect: Treat Poison

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| OFX-53a | "You gain a circumstance bonus or penalty to your next save against the poison." | effect:bonus · effect:penalty · ending:spent | +4, +2 or −2 to the next poison save, by the Treat Poison degree, then gone | pf2e: ChoiceSet of +4, +2 or −2, filtered by the treating check's degree when the context carries it; FlatModifier circumstance on `saving-throw`, predicate `item:trait:poison`, removed after the roll | ☐ | |

### CMP-01 · Aura: Righteous Call

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-01a | "Strikes your allies make while they're within 30 feet of you gain the holy trait" | area:aura/pf2e · reach:allies · effect:trait-gained | An ally inside 30 ft gets *Effect: Righteous Call* and its Strikes are holy; outside, or an enemy, nothing | pf2e: `Aura` 30 ft (allies, not self) granting *Effect: Righteous Call* (`AdjustStrike` adds the holy trait). The aura item also carries its own `AdjustStrike` adding holy as a property rune to the holder's Strikes, which the text does not give the holder | ☐ | |

### CMP-02 · Effect: Attitude

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-02a | "Use this effect to keep track of the attitude of relevant NPCs, increasing or decreasing the effect's badge value as needed" | effect:condition | Badge 1 to 5 puts Hostile, Unfriendly, Indifferent, Friendly, Helpful on the NPC, one at a time, swapped as the badge moves | pf2e: five in-memory `GrantItem`s, each predicated on `parent:badge:value:N`, granting Hostile … Helpful | ☐ | |

### CMP-03 · Effect: Azata's Grace

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-03a | "You gain 50 additional Hit Points, increasing both your maximum and current Hit Points" | effect:bonus | Maximum Hit Points +50, and current Hit Points +50 with it | pf2e: `FlatModifier` +50 on `hp` (the maximum); nothing on the item raises current Hit Points | ☐ | |
| CMP-03b | "gain the effects of the Righteous Call relic gift" | area:aura/pf2e · effect:trait-gained | The holder carries *Aura: Righteous Call* (CMP-01) | pf2e: `GrantItem` of *Aura: Righteous Call*, detached on delete | ☐ | |

### CMP-04 · Effect: Bickering Family

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-04a | "You gain a +1 status bonus to your saving throws" | effect:bonus | +1 status on every save | pf2e: `FlatModifier` status +1 on `saving-throw`; 1 round, ends at turn end | ☐ | |

### CMP-05 · Effect: Blessed Coins

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-05a | "You are granted a +1 item bonus to skill checks you attempt with the deities' divine skills" | check:caster-choice · effect:bonus | +1 item on the three divine skills, nothing on any other | pf2e: three `ChoiceSet`s of any skill, then `FlatModifier` item +1 on the three chosen; which skills are the deities' is picked by hand | ☐ | |

### CMP-06 · Effect: Boar Form

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-06a | "The polymorphed character transforms into a Large animal" | effect:form · effect:size | The token and the actor become Large | pf2e: `BattleForm` (`size: lg`, trait large) | ☐ | |
| CMP-06b | "AC = 36" | effect:form | AC reads 36 | pf2e: `BattleForm` `armorClass.modifier` 36 | ☐ | |
| CMP-06c | "30 temporary Hit Points" | effect:form · effect:temp-hp | 30 temporary Hit Points on entering the form | pf2e: `BattleForm` `tempHP` 30 | ☐ | |
| CMP-06d | "Low-light vision and scent (imprecise) 30 feet" | effect:form · effect:sense | Low-light vision, and imprecise scent 30 ft | pf2e: `BattleForm` senses (low-light vision, scent imprecise 30) | ☐ | |
| CMP-06e | "One or more unarmed melee attacks specific to the battle form, which are the only attacks you can use" | effect:form · effect:strikes-granted | The sheet shows the form's tusk and no other Strike | pf2e: `BattleForm` strikes (the tusk replaces the character's) | ☐ | |
| CMP-06f | "You can use your own unarmed attack modifier if it is better" | effect:form | The tusk's modifier is the higher of +25 and the character's own unarmed modifier | pf2e: `BattleForm` (its own-if-higher comparison) | ☐ | |
| CMP-06g | "Athletics modifier of +26 unless yours is better" | effect:form | Athletics reads +26, or the character's own if higher | pf2e: `BattleForm` `skills.athletics` 26 | ☐ | |
| CMP-06h | "You automatically roll a success to rally the crowd for your team" | economy:granted-action | *Rallying Display* is on the sheet, and using it rallies the crowd with no roll | pf2e: `GrantItem` of an adventure action; the automatic success is that action's text, nothing rolls or records it | ☐ | |
| CMP-06i | "You pull on the chains, moving a willing chained ally up to 10 feet to a space within your reach" | economy:granted-action · reach:allies · effect:forced-move/pull | *Reposition Chains* is on the sheet, and using it moves the chained ally up to 10 ft into reach | pf2e: `GrantItem` of an adventure action; nothing moves the ally — the text is all | ☐ | |
| CMP-06j | "Speed 40 feet" | effect:form · effect:speed | Land Speed reads 40 ft | pf2e: `BattleForm` `speeds.land` 40 | ☐ | |
| CMP-06k | "Melee 1 tusk +25, Damage 3d10+16 piercing" | effect:form · effect:strikes-granted | A tusk Strike at +25 for 3d10+16 piercing | pf2e: `BattleForm` strike `tusk` (+25, 3d10+16 piercing, unarmed) | ☐ | |
| CMP-06l | "Chained Charge 2 You Stride and then make a tusk Strike at the end of your movement" | economy:granted-action · effect:self-move · effect:strikes-made | *Chained Charge* is on the sheet: a Stride, then a tusk Strike | pf2e: `GrantItem` of an adventure action; neither the Stride nor the Strike is made by it — the text is all | ☐ | |
| CMP-06m | "If you move farther than 15 feet from your chained allies, you pull them along to the nearest open space 15 feet behind you" | reach:allies · effect:forced-move/pull | Chained allies left more than 15 ft behind are moved to the nearest open space 15 ft behind | pf2e: nothing — the text is all | ☐ | |
| CMP-06n | "The creature you hit must succeed at a reflex save or fall Prone" | when:strike-made · check:save · effect:condition | A Chained Charge hit asks a Reflex save; a failure is prone | pf2e: nothing on this effect — whatever the granted action carries | ☐ | |

### CMP-07 · Effect: Burned Mouth and Throat (Linguistic)

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-07a | "giving a -1 item penalty to linguistic-based checks and DCs for 1 hour" | effect:penalty · ending:duration | −1 item on linguistic checks and DCs only, gone after 1 hour | pf2e: `FlatModifier` item −1 on `all`, predicated `linguistic`; duration 1 hour | ☐ | |

### CMP-08 · Effect: Burned Mouth and Throat (No Singing or Yelling)

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-08a | "The drinker is unable to yell or sing for 8 hours" | effect:forbid · ending:duration | Singing or yelling (an auditory Performance, a composition) is refused for 8 hours | pf2e: nothing — no rules, only an 8-hour duration | ☐ | |

### CMP-09 · Effect: Burned Tongue (Linguistic)

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-09a | "giving a -1 item penalty to linguistic-based checks and DCs for 1 minute" | effect:penalty · ending:duration | −1 item on linguistic checks and DCs only, gone after 1 minute | pf2e: `FlatModifier` item −1 on `all`, predicated `linguistic`; duration 1 minute | ☐ | |

### CMP-10 · Effect: Burned Tongue (No Singing or Yelling)

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-10a | "The drinker is unable to yell or sing for 1 hour" | effect:forbid · ending:duration | Singing or yelling is refused for 1 hour | pf2e: nothing — no rules; a 1-hour duration, oddly marked sustained | ☐ | |

### CMP-11 · Effect: Call Upon the Ancients

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-11a | "You gain resistance 5 to all damage caused by Treerazer" | effect:resistance | Treerazer's damage is reduced by 5; anyone else's is not | pf2e: `Resistance` custom 5, defined by `origin:treerazer` | ☐ | |

### CMP-12 · Effect: Call Upon the Sovyrian Stone

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-12a | "Decrease the DC of Treerazer's primal innate spells and his Defoliation ability to DC 46" | effect:penalty | Treerazer's spell DC and Defoliation DC read 46 | pf2e: `FlatModifier` −3 on `spell-dc` and `defoliation-inline-dc` | ☐ | |
| CMP-12b | "the DC of his aura of corruption to DC 43" | effect:penalty | The aura of corruption's DC reads 43 | pf2e: `FlatModifier` −4 on `aura-of-corruption-inline-dc` | ☐ | |
| CMP-12c | "his spell attack modifier to +38" | effect:penalty | Treerazer's spell attack reads +38 | pf2e: `FlatModifier` −5 on `spell-attack` | ☐ | |

### CMP-13 · Effect: Chthonic Mucus

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-13a | "The creature takes a –5-foot status penalty to their Speed" | effect:penalty · effect:speed | Speed −5 ft status | pf2e: `FlatModifier` status −5 on `land-speed` (land only) | ☐ | |
| CMP-13b | "This reduction ends with the persistent spirit damage" | ending:with-condition | When the persistent spirit damage ends, the effect goes with it | pf2e: nothing — unlimited duration, no link to the persistent damage | ☐ | |

### CMP-14 · Effect: Chthonic Mucus (1-2)

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-14a | "The creature takes a –5-foot status penalty to its Speed for 1 round" | effect:penalty · effect:speed · ending:duration | Speed −5 ft status, gone after 1 round | pf2e: `FlatModifier` status −5 on `land-speed`; duration 1 round | ☐ | |

### CMP-15 · Effect: Combat Mentor

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-15a | "Your Level Bump modifier to attack rolls and spell attack rolls increases to 2" | effect:bonus | The Level Bump on attack and spell attack rolls reads +2 | pf2e: `AdjustModifier` upgrade, slug `level-bump`, to 2 on `attack-roll` | ☐ | |

### CMP-16 · Effect: Consecrated Altar to Ydersius

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-16a | "Creatures who worship Ydersius gain a +1 status bonus to attack rolls, skill checks, saving throws, and Perception checks" | reach:filtered · effect:bonus | A worshipper of Ydersius gets +1 status on those four; anyone else nothing | pf2e: `FlatModifier` status +1 on the four, with no predicate on the deity — whoever carries it gets it | ☐ | |
| CMP-16b | "their Strikes gain the unholy trait" | effect:trait-gained | The holder's Strikes carry unholy | pf2e: `AdjustStrike` adds the unholy trait | ☐ | |

### CMP-17 · Effect: Crownhold Consecration

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-17a | "Worshippers of Gorum get a +1 status bonus to attack rolls, skill checks, saving throws, and Perception checks" | reach:filtered · effect:bonus | A Gorum worshipper gets +1 status on those four | pf2e: `FlatModifier` status +1, predicated `self:deity:slug:gorum` | ☐ | |
| CMP-17b | "the underhanded nature of the PCs causes them to take a –1 status penalty to attack rolls, skill checks, saving throws, and Perception" | reach:filtered · effect:penalty | A PC takes −1 status on those four; an NPC does not | pf2e: `FlatModifier` status −1, predicated `self:type:character` | ☐ | |

### CMP-18 · Effect: Exotic Edge

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-18a | "You gain a +1 circumstance bonus to either all of your attack rolls or all of your skill checks" | check:caster-choice · effect:bonus | One choice, then +1 circumstance on attack rolls or on skill checks, not both | pf2e: `ChoiceSet` (attack roll or skill check), then `FlatModifier` circumstance +1 on the choice | ☐ | |

### CMP-19 · Effect: Extreme stomach cramps

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-19a | "You can't willingly ingest anything, even other drinks, for 8 hours" | effect:forbid · ending:duration | Drinking a potion or eating an elixir is refused for 8 hours | pf2e: nothing — no rules, only an 8-hour duration | ☐ | |

### CMP-20 · Effect: Favor of a Future Ally

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-20a | "You take a –3 penalty to AC" | effect:penalty | AC −3 | pf2e: `FlatModifier` −3 on `ac` | ☐ | |
| CMP-20b | "a –5 penalty to strike attack rolls" | effect:penalty | Strike attack rolls −5; spell attacks untouched | pf2e: `FlatModifier` −5 on `strike-attack-roll` | ☐ | |

### CMP-21 · Effect: Favor of a Past Benefactor

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-21a | "You take a –5 penalty to your spell DC and attack modifier" | effect:penalty | Spell DC and spell attack −5 | pf2e: `FlatModifier` −5 on `spell-attack-dc` (spell attack and spell DC); Strikes are not touched | ☐ | |

### CMP-22 · Effect: Favor of a Present Foe

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-22a | "You take a –4 penalty to skill checks, saving throws, and perception" | effect:penalty | −4 on skill checks, saves and Perception | pf2e: `FlatModifier` −4 on `skill-check`, `saving-throw`, `perception` | ☐ | |

### CMP-23 · Effect: Favor of the Oliphaunt

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-23a | "Your max HP is reduced by 110" | effect:penalty | Maximum Hit Points −110 | pf2e: `FlatModifier` −110 on `hp` | ☐ | |

### CMP-24 · Effect: Forgive Foe

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-24a | "The target suffers a -2 status penalty on all attacks, effect DCs" | effect:penalty | −2 status on the target's attacks and its DCs | pf2e: `FlatModifier` status −2 on `attack`, `inline-dc`, `spell-dc` | ☐ | |
| CMP-24b | "its Will DC against additional Forgive Foe attempts" | effect:penalty | The target's Will DC is 2 lower against a further Forgive Foe, and only that | pf2e: `FlatModifier` status −2 on `will-dc`, predicated `item:slug:forgive-foe` | ☐ | |
| CMP-24c | "until the end of your next turn" | ending:next-turn | The effect ends at the end of the user's next turn | pf2e: duration 1 round, expiring at turn end | ☐ | |

### CMP-25 · Effect: Grand Finale

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-25a | "You gain a +2 circumstance bonus to Performance checks" | effect:bonus | Performance +2 circumstance | pf2e: `FlatModifier` circumstance +2 on `performance` | ☐ | |
| CMP-25b | "20 temporary Hit Points" | effect:temp-hp | 20 temporary Hit Points | pf2e: `TempHP` 20 | ☐ | |
| CMP-25c | "a +1 circumstance bonus to Fortitude saves" | effect:bonus | Fortitude +1 circumstance | pf2e: `FlatModifier` circumstance +1 on `fortitude` | ☐ | |

### CMP-26 · Effect: Heightened Awareness

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-26a | "granting a +1 item bonus to Perception checks to Seek for 8 hours" | effect:bonus · ending:duration | +1 item on a Seek, not on other Perception checks, for 8 hours | pf2e: `FlatModifier` item +1 on `perception`, predicated `action:seek`; duration 8 hours | ☐ | |

### CMP-27 · Effect: Heroic Aegis

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-27a | "You gain a +2 status bonus to AC and saving throws" | effect:bonus | AC and saves +2 status | pf2e: `FlatModifier` status +2 on `ac`, `saving-throw` | ☐ | |

### CMP-28 · Effect: Heroic Hustle

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-28a | "You gain a +10-foot status bonus to your Speed" | effect:bonus · effect:speed | Speed +10 ft status | pf2e: `FlatModifier` status +10 on `land-speed` (land only) | ☐ | |

### CMP-29 · Effect: Heroic Inspiration

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-29a | "You gain a +1 circumstance bonus to checks of the same type the origin succeeded against" | check:caster-choice · effect:bonus | +1 circumstance on checks of the type the origin succeeded against, and no other | pf2e: `ChoiceSet` (attack, Perception, save, skill), then `FlatModifier` circumstance +1 on it — the type is picked by hand, not read from the origin's success | ☐ | |

### CMP-30 · Effect: Hope or Despair (Critical Success)

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-30a | "as long as they pursue either goal, they gain a +1 status bonus to all checks while remaining in the shrine's area" | effect:bonus | +1 status on every check that counts, while in the shrine | pf2e: `FlatModifier` status +1 on `all`, predicated `shelyns-hope` — a roll option nothing on the item sets, so it applies only when that option is supplied by hand | ☐ | |
| CMP-30b | "The GM determines whether or not a check counts toward this goal" | — | — | pf2e: nothing — the GM's call | — | Which checks count is the GM's ruling |

### CMP-31 · Effect: Hope or Despair (Failure or Critical Failure)

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-31a | "For the next hour, the creature takes a -1 penalty to all saving throws against mental effects" | effect:penalty · ending:duration | −1 on saves against mental effects, gone after an hour | pf2e: `FlatModifier` status −1 on `saving-throw`, predicated `mental`; the item's duration is unlimited, not an hour | ☐ | |
| CMP-31b | "this penalty increases to a -2 penalty against emotion mental effects" | effect:penalty | −2, not −3, against emotion mental effects | pf2e: `FlatModifier` status −2 predicated `mental` and `emotion`; both are status, so only the −2 counts | ☐ | |
| CMP-31c | "This effect has the curse trait" | — | The effect carries the curse trait, so what reads curse sees it | pf2e: nothing — the item carries no traits | ☐ | |
| CMP-31d | "Critical Failure As failure, but the effects persist as long as the green hag Tulvak remains in control of the shrine" | ending:permanent | On a critical failure the penalty has no hourly end | pf2e: unlimited duration (both outcomes share it) | ☐ | |

### CMP-32 · Effect: Immediate and Intense Headache

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-32a | "causing weakness 5 to mental damage for 8 hours" | effect:weakness · ending:duration | Mental damage +5, for 8 hours | pf2e: `Weakness` mental 5; duration 8 hours | ☐ | |

### CMP-33 · Effect: Improved reflexes

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-33a | "giving a +1 item bonus to Reflex saves for 8 hours" | effect:bonus · ending:duration | Reflex +1 item, for 8 hours | pf2e: `FlatModifier` item +1 on `reflex`; duration 8 hours | ☐ | |

### CMP-34 · Effect: Invoke the Witchbole's Spirit

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-34a | "PCs gain a +4 circumstance bonus to all saving throws against Witchbole Collapse effects" | effect:bonus | A PC's save against Witchbole Collapse gets +4 circumstance; other saves nothing | pf2e: `FlatModifier` circumstance +4 on `saving-throw`, predicated `witchbole-collapse` — an option the Witchbole Collapse effect must supply | ☐ | |
| CMP-34b | "Conversely, Treerazer takes a –4 circumstance penalty to his saving throws against the same effects" | effect:penalty | Treerazer's save against the same effects is −4 circumstance | pf2e: `AdjustModifier` multiply −1 on the +4, predicated `self:type:npc` — any NPC carrying it, not only Treerazer | ☐ | |

### CMP-35 · Effect: Keen insight

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-35a | "granting a +1 item bonus to Perception checks to Sense Motive for 8 hours" | effect:bonus · ending:duration | +1 item on Sense Motive only, for 8 hours | pf2e: `FlatModifier` item +1 on `perception`, predicated `action:sense-motive`; duration 8 hours | ☐ | |

### CMP-36 · Effect: Light in the Dark

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-36a | "You gain a +1 circumstance bonus to Diplomacy checks to Request Assistance or Make an Impression while adventuring in Razmiran" | effect:bonus | +1 circumstance on those two uses of Diplomacy, not on others | pf2e: `FlatModifier` circumstance +1 on every `diplomacy` check — no predicate on the action or the place | ☐ | |

### CMP-37 · Effect: Little Ripple's Blessing

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-37a | "You gain a +1 status bonus to Will saves" | effect:bonus | Will +1 status | pf2e: `FlatModifier` status +1 on `will` | ☐ | |

### CMP-38 · Effect: Magical Mentor

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-38a | "Your Level Bump modifier bonus to your spell DC that is the same tradition of the mentor increases to 2" | check:caster-choice · effect:bonus | The Level Bump on the mentor's tradition's spell DC reads +2; other traditions unchanged | pf2e: `ChoiceSet` of tradition, then an untyped `FlatModifier` +1 on `spell-dc` predicated `spellcasting:<tradition>` — it adds 1 rather than upgrading the Level Bump, as Combat Mentor does | ☐ | |

### CMP-39 · Effect: Meditate Among the Stones (Critical Success)

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-39a | "You gain a +2 circumstance bonus to your next Intelligence-based skill check" | when:check-rolled · effect:bonus · ending:spent | +2 circumstance on the next Intelligence skill check, then gone | pf2e: `FlatModifier` circumstance +2 on `int-skill-check`, `removeAfterRoll: if-enabled` | ☐ | |

### CMP-40 · Effect: Meditate Among the Stones (Success)

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-40a | "You gain a +1 circumstance bonus to your next Intelligence-based skill check" | when:check-rolled · effect:bonus · ending:spent | +1 circumstance on the next Intelligence skill check, then gone | pf2e: `FlatModifier` circumstance +1 on `int-skill-check`, `removeAfterRoll: if-enabled` | ☐ | |

### CMP-41 · Effect: Memories of Failure

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-41a | "You take a -1 penalty to all saving throws against emotion effects created by the marked creature" | effect:penalty | −1 on saves against the marked creature's emotion effects; other creatures' effects untouched | pf2e: `TokenMark` `memories-of-failure`, then `FlatModifier` −1 on `saving-throw` predicated `item:trait:emotion` and `origin:mark:memories-of-failure` | ☐ | |

### CMP-42 · Effect: Nexian Researcher

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-42a | "If you are Untrained in Pathfinder Society Lore, you can add your level to your Intelligence modifier when determining your bonus" | scaling:from-level · effect:bonus | An untrained Pathfinder Society Lore check adds the character's level | pf2e: `FlatModifier` +`@actor.level` on `skill-check`, predicated on Pathfinder Society Lore and `proficiency:untrained`, `removeAfterRoll: if-enabled` | ☐ | |
| CMP-42b | "If you are at least Trained in Pathfinder Society Lore, you gain a +2 circumstance bonus to this check instead" | effect:bonus · ending:spent | Trained or better: +2 circumstance on that check instead | pf2e: `FlatModifier` circumstance +2, predicated `proficiency:trained` (exactly trained, not expert or better) and a `nexian-researcher` option the item never sets | ☐ | |

### CMP-43 · Effect: Pompous Rage

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-43a | "Foroxicks takes a –2 circumstance penalty to his jaws attack" | effect:penalty | The jaws Strike −2 circumstance | pf2e: `FlatModifier` circumstance −2 on `jaws-attack` | ☐ | |
| CMP-43b | "but each hit deals additional piercing damage" | effect:strike-damage | A jaws hit adds piercing damage | pf2e: nothing — and the text gives no amount | ☐ | |

### CMP-44 · Effect: Practiced Medic

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-44a | "You can improve a Medicine check's degree of success by one step to Administer First Aid, Treat Disease, Treat Poison, or Treat Wounds" | when:check-rolled · check:degree-shift · ending:spent | One of those four Medicine checks comes out one degree better, once | pf2e: `AdjustDegreeOfSuccess` one better on `medicine`, predicated Treat Poison, Treat Wounds or Treat Disease, `removeAfterRoll: if-enabled` — Administer First Aid is missing, and it applies by itself rather than at the holder's choice | ☐ | |

### CMP-45 · Effect: Protective Mentor

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-45a | "Your maximum Hit Points increases in addition to the bonus provided by the Level Bump" | effect:bonus | Maximum Hit Points rise by 3 per Reputation tier, on top of the Level Bump | pf2e: `FlatModifier` on `hp` = 3 × the origin's Radiant Oath reputation tier (0–3) | ☐ | |

### CMP-46 · Effect: Recruit the Recent Dead

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-46a | "Reduce Treerazer's AC to 51" | effect:penalty | Treerazer's AC reads 51 | pf2e: `FlatModifier` −3 on `ac` | ☐ | |
| CMP-46b | "his Blackaxe Strike modifier to +44, and his jaws Strike modifier to +42" | effect:penalty | Blackaxe +44, jaws +42 | pf2e: `FlatModifier` −3 on `strike-attack-roll` | ☐ | |

### CMP-47 · Effect: Reflection of Life (Fast Healing)

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-47a | "You gain fast healing for 1 minute" | when:turn-start · effect:fast-healing · ending:duration | Hit Points regained at each turn start, for 1 minute | pf2e: `FastHealing`; duration 1 minute. this module: `scripts/lib/fast-healing.mjs` applies pf2e's posted fast healing | ☐ | |
| CMP-47b | "This amount of fast healing starts at 3 and increases by 1 for every 2 levels you have beyond 5th level" | scaling:from-level · effect:fast-healing | 3 up to 6th level, 4 at 7th–8th, 5 at 9th–10th … | pf2e: `FastHealing` value `max(3, ceil(level/2))`, which matches the text | ☐ | |

### CMP-48 · Effect: Resist Corruption

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-48a | "You gain resistance to unholy equal to your Reputation Tier with the Vigilant Seal faction" | effect:resistance | Resistance to unholy equal to the Vigilant Seal tier | pf2e: `Resistance` unholy = the origin's Vigilant Seal reputation tier (0–3) | ☐ | |

### CMP-49 · Effect: Righteous Call

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-49a | "Your Strikes gain the holy trait" | effect:trait-gained | The holder's Strikes carry holy | pf2e: `AdjustStrike` adds the holy trait | ☐ | |

### CMP-50 · Effect: Rugged Mentor

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-50a | "Your Level Bump modifier to saving throws increases to 2" | effect:bonus | The Level Bump on saves reads +2 | pf2e: an untyped `FlatModifier` +1 on `saving-throw` — added beside the Level Bump, not an upgrade of it | ☐ | |

### CMP-51 · Effect: Seasonal Boon (Outskirt Dweller)

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-51a | "You gain a status bonus to your initiative roll equal to the number of seasons since you've started Season of Ghosts (+1 during the first adventure, up to a maximum of +4 during the fourth and final adventure)" | check:caster-choice · effect:bonus | Initiative +1 to +4 status, by the season | pf2e: `ChoiceSet` of season (offered by character level), then `FlatModifier` status on `initiative` equal to it | ☐ | |

### CMP-52 · Effect: Skillful Mentor

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-52a | "Your Level Bump modifier to skill checks increases to 2" | effect:bonus | The Level Bump on skill checks reads +2 | pf2e: an untyped `FlatModifier` +1 on `skill-check` | ☐ | |

### CMP-53 · Effect: Spirit Power (Flight)

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-53a | "You gain a fly Speed equal to your Speed or 30 feet, whichever is greater" | effect:speed | A fly Speed of the land Speed or 30 ft, whichever is greater | pf2e: `BaseSpeed` fly `max(30, land Speed)` | ☐ | |

### CMP-54 · Effect: Spirit Power (Passion)

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-54a | "Your body is engulfed in fire of a color of your choice that sheds bright light in a 40-foot radius (and dim light to the next 40 feet)" | check:caster-choice · effect:light | The token sheds bright light 40 ft and dim to 80 ft, in the chosen colour | pf2e: `ChoiceSet` of colour, then `TokenLight` bright 40, dim 80 | ☐ | |
| CMP-54b | "Your melee Strikes inflict an additional 1d6 points of fire damage" | effect:strike-damage | Melee Strike damage adds 1d6 fire | pf2e: `DamageDice` 1d6 fire on `melee-strike-damage` | ☐ | |
| CMP-54c | "you gain resistance 10 to fire" | effect:resistance | Fire resistance 10 | pf2e: `Resistance` fire 10 | ☐ | |
| CMP-54d | "you gain the Reactive Scorch reaction" | economy:reaction · effect:feature-granted | *Reactive Scorch* is on the sheet while the effect lasts | pf2e: `GrantItem` of the adventure action | ☐ | |

### CMP-55 · Effect: Spirit Powers

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-55a | "they remain susceptible to void damage and are healed by vitality effects" | — | Void still harms the PC and vitality still heals it | pf2e: nothing changes the creature's living nature, as the text wants | ☐ | |
| CMP-55b | "They gain low-light vision, or darkvision if their ancestry already has low-light vision" | effect:sense | Low-light vision; darkvision for an ancestry that already has low-light | pf2e: `Sense` low-light vision only — the darkvision step is missing | ☐ | |
| CMP-55c | "A PC in this state never gains the wounded condition" | effect:condition | Recovering from dying leaves no wounded | pf2e: nothing — the text is all | ☐ | |
| CMP-55d | "If a PC dies while transmigrated, they awaken, alive, in the Willowshore mindscape and gain the Doomed 1 condition" | effect:condition | A death while transmigrated brings the PC back alive with doomed 1 | pf2e: nothing — the text is all | ☐ | |
| CMP-55e | "They gain a +2 circumstance bonus to saving throws (or any other defense) against disease, poison, sleep, and any effects that would impose the Paralyzed condition" | effect:bonus | +2 circumstance on saves and other defences against disease, poison, sleep and paralysis | pf2e: `FlatModifier` circumstance +2 on `saving-throw` predicated disease, poison, sleep or `inflicts:paralyzed` — saves only, not AC or other defences | ☐ | |
| CMP-55f | "they each gain two minor spirit powers and one major spirit power from the spirit powers listed on the following pages" | check:caster-choice · effect:feature-granted | Two minor and one major spirit power chosen and put on the sheet | pf2e: three `ChoiceSet`s (`item:tag:minor-spirit-power` ×2, `major-spirit-power`) each with a `GrantItem` | ☐ | |
| CMP-55g | "Every time the PCs do their daily preparations, they can reselect their chosen spirit powers" | when:preparations · effect:feature-granted | Each daily preparation reopens the three choices | pf2e: nothing — the choices are answered once, when the effect is created | ☐ | |
| CMP-55h | "When a spirit power calls for a saving throw, use the higher of that PC's class DC or spell DC" | check:class-dc | A power's save is against the higher of class DC and spell DC | pf2e: nothing on this effect — each power's own item decides | ☐ | |
| CMP-55i | "Any spirit powers calling for attack rolls use this DC – 10" | check:class-dc · check:attack | A power's attack roll is that DC − 10 | pf2e: nothing on this effect | ☐ | |
| CMP-55j | "Use the PC's own level for determining the effects of any counteract checks" | check:counteract | A power's counteract uses the PC's level | pf2e: nothing on this effect | ☐ | |
| CMP-55k | "Each time a dying transmigrated PC would normally gain the wounded condition, they're instead exposed to soul degradation and must attempt a new saving throw to resist increasing the stage of this curse" | check:save · effect:affliction | Instead of wounded, a save against soul degradation; a failure raises its stage | pf2e: nothing — the text is all | ☐ | |

### CMP-56 · Effect: Spore Feedback

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-56a | "Treerazer's maximum Hit Points are reduced to 500" | effect:penalty | Treerazer's maximum Hit Points read 500 | pf2e: `FlatModifier` −50 on `hp` | ☐ | |
| CMP-56b | "his regeneration reduces to 30" | effect:fast-healing | Treerazer regenerates 30 a turn, not his usual amount; holy damage switches it off | pf2e: a further `FastHealing` regeneration 30 (`deactivatedBy` holy) — added beside his own regeneration, not replacing it. this module: `scripts/lib/fast-healing.mjs` applies it and honours `deactivatedBy` | ☐ | |

### CMP-57 · Effect: Stoop

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-57a | "these creatures take a –1 circumstance penalty on attack rolls" | reach:filtered · effect:penalty | A Medium creature's attack rolls −1 circumstance; a Small one untouched | pf2e: `FlatModifier` circumstance −1 on `attack`, predicated size ≥ Medium (Large and bigger too) | ☐ | |
| CMP-57b | "and are clumsy 1" | reach:filtered · effect:condition | A Medium creature is clumsy 1 | pf2e: `GrantItem` of Clumsy, same size predicate | ☐ | |

### CMP-58 · Effect: Tarnbreaker Champions

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-58a | "you gain a +1 circumstance bonus on all Diplomacy checks to Make a Request while playing in an adventure that takes place primarily in the Lands of the Linnorm Kings" | effect:bonus | +1 circumstance on Make a Request | pf2e: `FlatModifier` circumstance +1 on `diplomacy`, predicated `action:request`; the setting is left to the table | ☐ | |

### CMP-59 · Effect: Technological Defence

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-59a | "You gain a +1 circumstance bonus to a saving throw against a technological weapon or effect" | effect:bonus | +1 circumstance on a save against a technological weapon or effect, and no other | pf2e: a toggleable `RollOption` `technological-defence`, and `FlatModifier` circumstance +1 on `saving-throw` while it is on — switched by hand | ☐ | |

### CMP-60 · Effect: Tiger Form

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-60a | "The polymorphed character transforms into a Large animal" | effect:form · effect:size | The token and the actor become Large | pf2e: `BattleForm` (`size: lg`, trait large) | ☐ | |
| CMP-60b | "AC = 36" | effect:form | AC reads 36 | pf2e: `BattleForm` `armorClass.modifier` 36 | ☐ | |
| CMP-60c | "30 temporary Hit Points" | effect:form · effect:temp-hp | 30 temporary Hit Points on entering the form | pf2e: `BattleForm` `tempHP` 30 | ☐ | |
| CMP-60d | "Low-light vision and scent (imprecise) 30 feet" | effect:form · effect:sense | Low-light vision, and imprecise scent 30 ft | pf2e: `BattleForm` senses (low-light vision, scent imprecise 30) | ☐ | |
| CMP-60e | "One or more unarmed melee attacks specific to the battle form, which are the only attacks you can use" | effect:form · effect:strikes-granted | The sheet shows the jaws and claw and no other Strike | pf2e: `BattleForm` strikes (jaws and claw replace the character's) | ☐ | |
| CMP-60f | "You can use your own unarmed attack modifier if it is better" | effect:form | Each Strike's modifier is the higher of +25 and the character's own unarmed modifier | pf2e: `BattleForm` (its own-if-higher comparison) | ☐ | |
| CMP-60g | "Athletics modifier of +26 unless yours is better" | effect:form | Athletics reads +26, or the character's own if higher | pf2e: `BattleForm` `skills.athletics` 26 | ☐ | |
| CMP-60h | "You automatically roll a success to rally the crowd for your team" | economy:granted-action | *Rallying Display* is on the sheet, and using it rallies the crowd with no roll | pf2e: `GrantItem` of an adventure action; the automatic success is that action's text | ☐ | |
| CMP-60i | "You pull on the chains, moving a willing chained ally up to 10 feet to a space within your reach" | economy:granted-action · reach:allies · effect:forced-move/pull | *Reposition Chains* is on the sheet, and using it moves the chained ally up to 10 ft into reach | pf2e: `GrantItem` of an adventure action; nothing moves the ally | ☐ | |
| CMP-60j | "Speed 30 feet" | effect:form · effect:speed | Land Speed reads 30 ft | pf2e: `BattleForm` `speeds.land` 30 | ☐ | |
| CMP-60k | "Melee 1 jaws +25, Damage 3d6+16 piercing plus Grab" | effect:form · effect:strikes-granted · effect:hold/condition | A jaws Strike at +25 for 3d6+16 piercing; a hit offers Grab | pf2e: `BattleForm` strike `jaws`; a `Note` on a jaws hit and `GrantItem` of the Grab ability — Grab is reminded, not applied | ☐ | |
| CMP-60l | "Melee 1 claw +25 (agile), Damage 2d8+16 slashing" | effect:form · effect:strikes-granted | An agile claw Strike at +25 for 2d8+16 slashing | pf2e: `BattleForm` strike `claw` (agile) | ☐ | |
| CMP-60m | "Wrestle 1 You make a claw Strike against a creature Grabbed or Restrained by you" | economy:granted-action · economy:requires · effect:strikes-made | *Wrestle* is on the sheet: a claw Strike, only against a creature the tiger has grabbed or restrained | pf2e: `GrantItem` of an adventure action; nothing makes the Strike or checks the target | ☐ | |
| CMP-60n | "If you hit, you deal damage as usual and that creature is knocked Prone" | when:strike-made · effect:condition | A Wrestle hit leaves the target prone | pf2e: nothing on this effect — whatever the granted action carries | ☐ | |

### CMP-61 · Effect: Utter Treerazer's Name

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-61a | "Decrease Treerazer's saving throw modifiers, Perception check modifiers, and skill check modifiers by 3" | effect:penalty | Treerazer's saves, Perception and skills −3 | pf2e: `FlatModifier` −3 on `saving-throw`, `perception`, `skill-check` | ☐ | |

### CMP-62 · Effect: Wind Barrier

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-62a | "You gain a +2 circumstance bonus to AC against ranged attacks" | effect:bonus | AC +2 circumstance against a ranged attack, not a melee one | pf2e: `FlatModifier` circumstance on `ac`, predicated `item:ranged` | ☐ | |
| CMP-62b | "At 13th level, this increases to a +3 circumstance bonus to AC against ranged attacks" | scaling:from-level · effect:bonus | +3 from 13th level | pf2e: value `ternary(level ≥ 13, 3, 2)` | ☐ | |

### CMP-63 · Effect: Worldly Mentor

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-63a | "Your Level Bump bonus modifier to perception checks increases by 2" | effect:bonus | The Level Bump on Perception rises by 2 | pf2e: an untyped `FlatModifier` +1 on `perception` — the text says by 2 | ☐ | |

### CMP-64 · Effect: Xenia Spirit Grand Feast

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-64a | "The Xenia Spirit takes a –2 penalty to its attack, AC, DCs, Perception, and skill modifiers" | effect:penalty | −2 on its attacks, AC, DCs, Perception and skills | pf2e: `FlatModifier` −2 on `all` (every check and DC) | ☐ | |

### CMP-65 · Malevolence

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-65a | "You take a status penalty equal to this value to all saving throws against effects generated by haunts and against all curse and possession effects" | effect:penalty | A status penalty of the value on saves against haunts, curses and possession; other saves untouched | pf2e: `FlatModifier` status −badge on `saving-throw`, predicated `origin:trait:haunt`, `item:trait:curse` or `item:trait:possession` | ☐ | |
| CMP-65b | "The malevolence condition can be reduced by restoration" | effect:condition-removed | A *Restoration* lowers the value | pf2e: nothing — the text is all | ☐ | |
| CMP-65c | "The malevolence can never increase above a value of 4" | effect:condition-climbs | The value stops at 4 | pf2e: a valued badge with no maximum set | ☐ | |
| CMP-65d | "If an effect would increase a creature's malevolence value higher than 4, the creature is instead Stupefied 1 for 24 hours" | effect:condition-climbs · effect:condition · ending:duration | A rise past 4 gives stupefied 1 for 24 hours instead | pf2e: nothing — the text is all | ☐ | |
| CMP-65e | "A creature that has a malevolence 4 won't voluntarily leave the Xarwin Manor grounds" | — | — | pf2e: nothing — the creature's behaviour | — | Where a creature goes is the GM's to rule |
| CMP-65f | "Each time you get a full night's rest in a region not influenced by the malevolence condition, the value of your malevolence decreases by 1" | when:preparations · effect:condition-removed | A night's rest away from the manor lowers the value by 1 | pf2e: nothing — the text is all | ☐ | |

### CMP-66 · Mixed Drink: Dancing Lights

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-66a | "You can cast Light as a primal cantrip once within the next day" | effect:feature-granted · economy:frequency · ending:spent | *Light* castable once as a primal cantrip, then gone; gone after a day either way | pf2e: nothing — no rules, no spell granted; only a 1-day duration | ☐ | |

### CMP-67 · Mixed Drink: Guidance

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-67a | "You can cast Guidance as a primal cantrip once within the next day" | effect:feature-granted · economy:frequency · ending:spent | *Guidance* castable once as a primal cantrip, then gone; gone after a day either way | pf2e: nothing — no rules, no spell granted; only a 1-day duration | ☐ | |

### CMP-68 · Mixed Drink: Luck

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-68a | "once during the next 8 hours when you attempt a saving throw or a skill check, you can roll twice and take the higher result" | when:check-rolled · check:roll-twice · ending:spent | On one save or skill check, offered a keep-higher roll; spent once used, gone after 8 hours | pf2e: nothing — no rules; only an 8-hour duration | ☐ | |
| CMP-68b | "This is a fortune effect" | check:fortune | The roll twice is refused on a roll another fortune effect already touched | pf2e: nothing — the item carries no fortune trait | ☐ | |

### CMP-69 · Mixed Drink: Prestidigitation

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| CMP-69a | "You can cast Prestidigitation as a primal cantrip once within the next day" | effect:feature-granted · economy:frequency · ending:spent | *Prestidigitation* castable once as a primal cantrip, then gone; gone after a day either way | pf2e: nothing — no rules, no spell granted; only a 1-day duration | ☐ | |

### BNC-01 · Effect: Abadar's Warning

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| BNC-01a | "Once, when someone rolls a success on a Deception check to Lie maliciously to you and you alone, they get a critical failure instead" | check:degree-shift · ending:spent | The first successful Lie told to the holder alone becomes a critical failure, and the boon is spent | pf2e: a GM-only `Note` on the holder's **own** Deception checks to Lie, on a success — the wrong side of the roll, and no degree is changed | ☐ | |

### BNC-02 · Effect: Grandmother Spider's Underdog

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| BNC-02a | "Any time a creature with a level lower than yours rolls a success on a check against you, it critically succeeds instead" | check:degree-shift | A lower-level creature's success against the holder becomes a critical success | pf2e: `AdjustDegreeOfSuccess` success → one better on the holder's **own** checks when the holder's level is lower than the target's — the reverse of the curse | ☐ | |

### BNC-03 · Effect: Gruhastha's Inspiration

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| BNC-03a | "Allies within 60 feet gain a +2 status bonus to Will saves" | area:aura/pf2e · reach:allies · effect:bonus | Allies within 60 ft get Will +2 status; those farther away do not | pf2e: `FlatModifier` status +2 on `will` for the holder only — no aura, no allies | ☐ | |

### BNC-04 · Effect: Rovagug's Destruction

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| BNC-04a | "Your weapon or unarmed attack gains the deadly d12 trait" | check:caster-choice · reach:weapon · effect:trait-gained | The chosen weapon or unarmed attack has deadly d12 | pf2e: `ChoiceSet` of attacks, then `ItemAlteration` adding `deadly-d12` to the chosen weapon item (`itemType: weapon`, so a basic unarmed attack is not reached) | ☐ | |

### BNC-05 · Effect: Shelyn's Love

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| BNC-05a | "You and your allies gain a +3 status bonus to saving throws and skill checks as long as you can see each other" | reach:allies · effect:bonus | The holder and each ally in mutual sight get +3 status on saves and skills | pf2e: `FlatModifier` status +3 on `saving-throw`, `skill-check` for the holder only — no allies, no sight test | ☐ | |

### BNC-06 · Effect: Shizuru's Light

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| BNC-06a | "Your weapon glows with bright light out to 60 feet" | reach:weapon · effect:light | Bright light 60 ft from the holder's weapon | pf2e: `TokenLight` bright 60 on the holder's token | ☐ | |

### BNC-07 · Effect: Torag's Repairs

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| BNC-07a | "The item's Hardness doubles" | reach:object · effect:hardness | The chosen armour, shield or weapon's Hardness reads doubled | pf2e: `ChoiceSet` of an owned armour, shield or weapon, then `ItemAlteration` multiply `hardness` by 2 | ☐ | |
