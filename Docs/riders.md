# Riders

A rider is what happens to a target *besides* damage. When a save is rolled, a Strike lands, damage is
applied, or a turn ends, the conditions an item inflicts are applied to the right creature, on its own
sheet, without anyone clicking a condition on.

Riders are authored on whatever the rule belongs to — a spell, a feat, an action, an effect — under
`flags[<scope>].riders`, where `<scope>` is this module's id or any id registered with
`api.flags.registerFlagScope`:

```jsonc
"riders": [
    { "event": "strike-resolved",
      "outcomes": ["success", "criticalSuccess"],
      "predicate": [{ "or": ["item:category:unarmed", "item:trait:unarmed"] }],
      "apply": { "type": "save", "statistic": "will", "dc": "class", "riders": [
          { "outcomes": ["failure", "criticalFailure"],
            "predicate": [{ "not": "rider:target:condition:blinded" }],
            "apply": { "type": "condition", "slug": "blinded" } }
      ]}}
]
```

### Events

| `event` | Fires when | Whose riders are read |
| :-- | :-- | :-- |
| `save-rolled` *(default)* | A target rolls its save from a chat card | The item that forced the save |
| `strike-resolved` | This actor's Strike resolves | The attacker's items |
| `strike-received` | A Strike resolves against this actor | The defender's items |
| `action-used` | An action or spell is posted to chat | The item posted, against the targets you confirmed |
| `save-made` | This actor rolled a save against someone else's effect; the rider is aimed back at whoever forced it. `rider:trigger:enemy` / `rider:trigger:ally` say which side they are on (`rider:target:…` for an ordinary rider) | This actor's items |
| `damage-applied` | Damage from this actor's item lands | The origin's items |
| `damage-received` | Damage from someone else's item lands on this actor | The defender's items |
| `ally-damaged` | Damage lands on an **ally**, within the rider's own `range` in feet | The watching ally's items |
| `turn-start`, `turn-end` | This actor's turn begins or ends | This actor's items |
| `aura-tick` | A creature enters this actor's aura, or ends its turn inside it | The aura effect itself |

`ally-damaged` is the only event that takes a **`range`**, in feet. A rider without one never fires and
says so in the console: an ability that reaches the whole map is never what was meant.

A rider with no `event` means `save-rolled`. A rider with no `outcomes` fires on any outcome.

- **Only the item that produced the event is read** for `action-used`, `save-rolled` and `aura-tick`. The
  others search the whole sheet, because a Strike rider lives on the feat or armor rather than on the fist
  that threw it.
- **A roll the rider itself causes is not another use.** pf2e stamps the originating item onto every check
  it rolls, so the save a rider forces looks like the ability being used again. It is ignored.

### What a rider can do

The `apply.type` field. The built-in types are dispatched from one switch in `scripts/riders/apply.mjs`,
and `npm test` fails if this table and that switch disagree.

| `type` | What it does |
| :-- | :-- |
| `condition` | Applies a pf2e condition. `endsWith: [slug]` on a plain one ends it when that condition goes (*Vision of Death*'s fleeing). With a `duration` it becomes a generated effect that expires on its own; without one it is a plain condition for the table to clear. `max` caps a cumulative one. A `duration` with `of: "target"` ends on the **target's** turn ("until its next turn begins") rather than the caster's. `endsOnHostile` ends it once its holder uses a hostile action (an attack, a damage roll, or an action or spell aimed at an enemy). `withoutGrants` takes off conditions the condition would bring with it (*Sleep*'s unconscious without prone). `escapeDc` grants the captive an Escape action against that DC, and `escapeStatistic` names the one skill it is rolled with instead of the better of Acrobatics and Athletics. |
| `effect` | `preselect` answers a pf2e ChoiceSet: `"$outcome"` from the save, `"$cast"` from the spell's `castChoice`; in `carries`, `"$cast:<flag>"` is the same choice. Applies an effect item by UUID — or one written out, with `label` and `rules` and no `uuid`. A written-out effect may carry a counter (`badge`), and an action its caster spends it with (`originAction`: `name`, `areaTargeting`, `riders` — fixed at the cast's DC and rank; *Blister*). `endsOnBlock: { immunity }` ends the effect when the shield it raised blocks, putting `immunity` (a pf2e effect) on in its place (*Shield*). `atCastRank` gives a pf2e effect the cast rank as its level, for effects whose rules read `@item.level` (*Heroism*). `preselect: { <flag>: <answer> }` answers a pf2e ChoiceSet before the effect lands (`"$outcome"` for the save's degree). `stack: true` walks a counter badge up instead of adding a second icon. `endsOnLeaving` ends it when the creature leaves the lingering area whose check gave it; `withArea` ends it when that area ends, wherever its holder is (*Hypnotize*). `escapeDc` grants an Escape, and `escapeAll` makes that Escape release everything the ability left. An effect or a timed condition can `carries` riders of its own, which fire on its holder's events; a save among them with no DC, or `"spell"`, is given the caster's DC when the effect is made. `link` remembers the creature the cast was aimed at, for the riders the effect carries. `noTurnHealing` takes away its holder's fast healing and regeneration while it lasts. `deters: { statistic, dc }` makes it a ward (*Sanctuary*): an attack on its holder first rolls the attacker's `statistic` (Will) against `dc` (the spell's, frozen when cast) — a critical success ends the ward, a success lets this turn's attacks through, a failure wastes this one and the rest this turn, a critical failure bars the attacker while it lasts. A written-out effect may name a `slug` for predicates to read (`target:effect:<slug>`). `sustained: { repeat: true }` also casts the spell again, at its rank and variant, each time it is Sustained (*Spiritual Armament*). `sustained: true` makes it last only while its caster Sustains the spell: the caster gets one *Sustain* action for it, and a turn ending unsustained (after the casting round) ends every effect the spell left. `sustain: { step }` gives the holder a *Sustain* action that adds `step` to the badge, once per round and not in the round it was cast. |
| `damage` | Rolls real damage, so immunities and resistances apply, and posts it to chat. |
| `persistent-damage` | Applies a bleed or a burn. `perCounter` scales it by a counter the target already carries. `endsWith: ["sickened"]` ends it when the creature is no longer sickened. |
| `heal` | Heals. Lands on the origin when the rider is `self`. |
| `save` | The target rolls a save and the rider carries its own riders, chosen by the result. A lingering area's check may name `statistics` instead of `statistic`; the creature rolls the better. `dc: "spell"` is the spell's own DC. |
| `flat-check` | Rolls a flat check and branches on it. |
| `counteract` | Rolls a counteract check against an effect. `spellEffects: true` offers every effect a spell left, whatever its traits (*Dispel Magic*), and `dcFrom: "effect"` sets the DC to that spell's caster's spell DC rather than the level table. |
| `pool` | Spends focus points (`spend`), or refunds them (`gain`), with an optional `oncePerEncounter`. |
| `death` | Applies dying, or kills outright — whom it may kill is the **Automate death effects** setting. `hpFraction`: only at or below that share of its Hit Points; `maxLevel` (+`maxLevelPerStep` per step, in `carries`): only a creature of that level or lower (*Seal Fate*). |
| `banish` | Removes a creature from the scene, and brings it back. |
| `teleport` | Moves along the caster→target line, grid-snapped and clamped to the scene. `measure: "from-origin"` makes it a destination rather than a delta. `stopsAtWalls` makes it a push: it stops short of the first wall that blocks movement. `direction: "choose"` asks which way — a compass point, away or toward. |
| `encasement` | Traps a creature in a hazard with its own escape DC. `ac` may be a DC word (`"spell"`); `hpPerStepInterval` grows its Hit Points every so many ranks; `atOnce` makes it break only to one blow of its Hit Points or more; `withArea` frees the creature when the cast's lingering area ends; `onePerTarget` keeps one hold per spell per creature, adding the new result's conditions to it (*Slither*). |
| `escape` | Offers an escape attempt against something holding the target. |
| `expire` | Takes a named effect back off before its own timer would. |
| `sustain` | The *Sustain* action an effect with `sustain` grants; not written by hand. |
| `decoy` | On a `strike-received` rider carried by an effect with a counter badge (*Mirror Image*): a failure destroys an image; a hit rolls whether it lands on an image (1 on 1d4 / 1–2 on 1d6 / 1–3 on 1d6 for three / two / one) — a critical hit on an image becomes a hit on the holder. The effect ends with its last image. |
| `transfer` | Moves `amount` (+`perStep` per heightening step) Hit Points from the caster to the creature, no more than it is missing and ignoring temporary Hit Points (*Spirit Link*). Carried by an effect with `link`, the creature is the one linked when it was made; the link ends at 0 Hit Points. |
| `temp-hp` | Gives temporary Hit Points as an effect holding pf2e's TempHP rule, so the higher of two amounts is kept and they go when the effect ends (its `duration`). `value` is a number or an expression — `event.damage.total` is what the blow actually took — and `times` a share of it, rounded down (*Vampiric Feast*). |
| `cast` | Casts the rider's own spell at the rider's creature — a reaction that is a spell (*Schadenfreude*, nested with `trigger: true`). |
| `aftermath` | On the cast (`self: true`): a tally of the creatures it reached and of those that must answer (`awaits`, a predicate). `aftermath-mark` — the last of each answering creature's riders — ticks one off and notes whether it died. When none is left: with nobody dead, `none` lands on every reached creature `noneTo` admits, `noneSelf` on the caster (*Massacre*'s backlash). Kept on the active GM's client. |
| `aftermath-mark` | The last of each answering creature's riders under an `aftermath`: this one's result is in. |
| `affliction` | Afflicts the creature — an effect whose badge is the stage and whose rules grant the stage's conditions (pf2e's own affliction item exists only in its development builds): `name`, `stage` (where it starts), `stages` (`damage: [{ formula, type }]`, `conditions: [{ slug, value }]`, `duration`), `maxRounds`, `save` — the DC is the spell's. Each stage's damage is rolled and applied as it begins; at the end of each of the creature's turns it saves (critical success −2 stages, success −1, failure +1, critical failure +2), ending below stage 1 or after `maxRounds`. Exposed again, it moves up by `stage` (*Spider Sting*). |
| `spend-charge` | The action an effect with `originAction` grants its caster spends one of the effect's counter badge; the last one ends the effect, and the action goes with it. Its `areaTargeting` may say `includesOrigin`: the creature the area is aimed from is caught with it. Not written by hand. |
| `dismiss` | The *Dismiss* action an area with `dismiss` grants its caster; not written by hand. Using it deletes the area. |
| `area-damage` | Damage rolled **once for the cast** and saved against once per creature (`save`, basic): each of `parts` (`formula`, `perStep`, `type` or `typeFromSpell`: one of the spell's own damage partials) is rolled once; a part with a `zone` reaches only the creatures the placement named for that zone (`areaTargeting.zones`); what reaches a creature lands as one roll of several types (*Falling Stars*). A part with `weaponDice` (and `perStepDice`) rolls that many dice of a weapon the caster holds, its die as held and its type; `critSpecialization` puts the weapon's critical specialization effect on a critical failure (*Weapon Storm*). |
| `pull` | Every creature the cast reached saves (`save`), then each moves toward the area's centre by `feet[outcome]`, nearest first, a square at a time, stopping at walls, other creatures and the centre — forced movement, no reactions (*Gravity Well*). Needs `areaTargeting.markCentre`. |
| `contest` | The caster rolls `statistic` (`"spell-attack"`: the spell's own) against the target's `against` DC; the nested `riders` are chosen by the caster's result (*Telekinetic Maneuver*). A nested rider with `toOrigin` lands on the caster. |
| `disarm` | The target's held weapon: `mode: "loosen"` is pf2e's *Effect: Disarm (Success)* on that weapon (–2 to its attacks while held), `"drop"` lets go of it. |
| `rays` | One spell attack per targeted creature, all at the penalty the cast chose; a hit rolls the cast's own damage and applies it, doubled on a critical hit (*Blazing Bolt*). Put it on `self: true`: it runs once, with every target. `failure: [types]`: what a miss still deals (*Live Wire*); `riders`: by the ray's result, on the creature it reached. `save: { statistic, worseOnCritical }`: a hit is a basic save against the spell DC instead, one degree worse on a critical hit; `objects: "destroy"`: a hit on a wall section or a hazard destroys it (*Disintegrate*). |
| `climb` | Moves a valued condition by `by` (negative to lower it) within `[0, max]`; reaching `max` runs the riders in `onMax`, reaching 0 those in `onZero` — *Petrify*'s slowed that turns to stone. |
| `shorten` | Takes `rounds` off the effect that carries this rider, or ends it with `rounds: "all"` — *Paralyze*'s save at the end of each turn. |
| `strikes` | Rolls a volley, dealt round-robin across the confirmed targets. `mapIndex` picks the variant. Follows through to damage. |
| `toggle` | Flips a roll option on the **target**, unless the rider is `self`. |
| `reaction` | Offers the actor a reaction, as buttons on a card. |
| `prompt` | Whispers the GM. Automating half of a rider and being honest about the other half beats guessing. |
| `pick` | Whispers the caster a card of **creatures** — everything within `range` feet matching `affects` — and applies the nested `riders` to the one they click. |
| `choice` | Whispers the caster a card of buttons and applies the one they pick. |
| `readout` | Posts an informational card and touches no sheet. |

Another module adds its own with `api.riderExtensions.registerApplyType(type, fn)`; the built-in types
cannot be replaced.

**The DC.** A `save` rider's `dc` is a number, or a word a registered DC resolver answers
(`registerDcResolver`). With no `dc` at all it is the origin's class DC, else its best spell DC. A
`counteract` with no `statistic` uses a registered default, else the origin's class DC statistic, else its
best spellcasting.

**A rider is not only a thing done to a target.** `heal`, `toggle` and `strikes` act on the origin when the
rider is `self`; `prompt`, `choice`, `pick` and `readout` produce chat output without touching a sheet.

### Areas

A `turn-start` or `turn-end` rider can carry an `area`, and then it fans out from the origin's token
instead of landing on one creature. It reuses the containment and alliance filtering of cast-time area
targeting, so "enemies within 10 feet" means the same thing in both places. `area.anchor` centres it on a
named point another module provides (`registerAreaAnchors`).

### Asking about the target

Predicates can use the system's own `target:*` options, plus a `rider:*` vocabulary for the questions an
escalating rider needs to ask:

| Option | True when |
| :-- | :-- |
| `rider:target:condition:<slug>` | The target has that condition |
| `rider:target:condition:<slug>:<n>` / `:<n>+` | …at exactly, or at least, that value |
| `rider:target:effect:<slug>` | The target carries that effect |
| `rider:target:effect:<slug>:<n>` / `:<n>+` | …with a counter badge at exactly, or at least, that |
| `rider:target:hp-zero`, `rider:target:hp-half-or-less` | Health, after the damage landed |
| `rider:damage:type:<type>` | The damage that fired this rider included that type |
| `rider:damage:outcome:<outcome>` | The Strike that dealt it had that degree of success |

Every predicate is tested against a snapshot taken **before** anything is applied, so an escalation
ladder advances exactly one step per hit. A `live` rider is tested against the world as the pass leaves it.

Rerolls are handled: changing the degree of success removes the riders applied for the old one and applies
the new set, and only ever removes what this module created — including winding a counter badge back down.

This needs a **GM online**, because a player cannot write to a monster's sheet. If none is, the caster is
told what would have been applied. Turn the whole thing off with **Apply riders automatically**.

### With pf2e-toolbelt

Pairs with [`pf2e-toolbelt`](https://github.com/reonZ/pf2e-toolbelt)'s **Target Helper**. Targets set by
area targeting arrive on the chat card as its per-target rows, each rolls its own save from the card, and
each of those rolls is what `save-rolled` riders key off.
