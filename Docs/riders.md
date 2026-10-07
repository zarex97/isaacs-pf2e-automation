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
| `condition` | Applies a pf2e condition. With a `duration` it becomes a generated effect that expires on its own; without one it is a plain condition for the table to clear. `max` caps a cumulative one. `withoutGrants` takes off conditions the condition would bring with it (*Sleep*'s unconscious without prone). `escapeDc` grants the captive an Escape action against that DC, and `escapeStatistic` names the one skill it is rolled with instead of the better of Acrobatics and Athletics. |
| `effect` | Applies an effect item by UUID — or one written out, with `label` and `rules` and no `uuid`. `stack: true` walks a counter badge up instead of adding a second icon. `endsOnLeaving` ends it when the creature leaves the lingering area whose check gave it. `escapeDc` grants an Escape, and `escapeAll` makes that Escape release everything the ability left. `sustain: { step }` gives the holder a *Sustain* action that adds `step` to the badge, once per round and not in the round it was cast. |
| `damage` | Rolls real damage, so immunities and resistances apply, and posts it to chat. |
| `persistent-damage` | Applies a bleed or a burn. `perCounter` scales it by a counter the target already carries. |
| `heal` | Heals. Lands on the origin when the rider is `self`. |
| `save` | The target rolls a save and the rider carries its own riders, chosen by the result. A lingering area's check may name `statistics` instead of `statistic`; the creature rolls the better. `dc: "spell"` is the spell's own DC. |
| `flat-check` | Rolls a flat check and branches on it. |
| `counteract` | Rolls a counteract check against an effect. |
| `pool` | Spends focus points (`spend`), or refunds them (`gain`), with an optional `oncePerEncounter`. |
| `death` | Applies dying, or kills outright — whom it may kill is the **Automate death effects** setting. |
| `banish` | Removes a creature from the scene, and brings it back. |
| `teleport` | Moves along the caster→target line, grid-snapped and clamped to the scene. `measure: "from-origin"` makes it a destination rather than a delta. `stopsAtWalls` makes it a push: it stops short of the first wall that blocks movement. |
| `encasement` | Traps a creature in a hazard with its own escape DC. |
| `escape` | Offers an escape attempt against something holding the target. |
| `expire` | Takes a named effect back off before its own timer would. |
| `sustain` | The *Sustain* action an effect with `sustain` grants; not written by hand. |
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
