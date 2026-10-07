# The API

`game.modules.get("isaacs-pf2e-automation").api` — published at `init`, and announced with the
`isaacs-pf2e-automation.init` hook (`(api) => …`). Register on it in your module's `setup`: every module's
`init` has run by then, and the wraps the stages hang off are installed during this module's `setup`, which
reads its stages when it runs, not when it installs.

This file is the contract. Anything not listed here may change in any release; anything listed changes
shape only in a major version. A change starts here, then in `scripts/api.mjs`.

| Since | Meaning |
| --- | --- |
| 1.0.0 | Everything below unless marked otherwise |
| 1.1.0 | The rider engine, areas left behind, the `counteracted` hook — marked where they appear |
| 1.2.0 | The vanilla table and `api.vanilla` — marked where they appear |
| 1.3.0 | `checkPipeline.gate` — marked where it appears |
| 1.4.0 | The `requires` key and its cast stage — marked where they appear |

## Pipelines

One wrap per pf2e method, owned by this module. Other modules add **stages**. Every pipeline sorts its
stages by ascending `priority` (leave gaps), refuses a second stage with the same `name`, and has
`stages()` → `[{ name, priority }]` in run order (`{ before, after }` for those with both).

| Key | Wraps | Register | A stage is |
| --- | --- | --- | --- |
| `castPipeline` | `SpellcastingEntryPF2e#cast`, an action's `toMessage` | `before(name, priority, fn)` · `after(name, priority, fn)` | `before(spell, options)` → **truthy** to continue; anything falsy refuses (a closed dialog's `null` refuses). `options` reaches the system, so a stage may leave something on it. `after(cast, spell)` once the spell reached the table: `cast` is what was posted (a chosen variant), `spell` what the caster owns. A throw stops the cast |
| `damageBus` | `ActorPF2e#applyDamage` | `before(name, priority, fn)` · `after(name, priority, fn)` | `before(actor, params)` → may return an **undo**, called in a `finally`. `after(actor, params, hpBefore)`. Isolated: a throw is logged and the rest run |
| `checkPipeline` | `game.pf2e.Check.roll` | `before(name, priority, fn)` · `gate(name, priority, fn)` *(1.3.0)* | `before(check, context)` → a new context, or mutate the one given. Isolated. `gate(check, context)`, awaited before every stage → falsy refuses the roll (it returns `null`, as a closed dialog does); a throw counts as no objection. `gates()` lists them |
| `rerollPipeline` | `game.pf2e.Check.rerollFromMessage` | `before(name, priority, fn)` | `(message, options)` → truthy to allow; falsy refuses (say why yourself). A throw counts as no objection |
| `actorPreparation` | character `prepareDerivedData` | `after(name, priority, fn)` | `(actor)`, synchronous, after the system's own preparation. Isolated |
| `detectionModes` | `TokenDocument#_prepareDetectionModes` | `after(name, priority, fn)` | `(tokenDocument)`, synchronous; edit `detectionModes` in place. Isolated |

The cast pipeline's own stages: **what a spell needs** at `5` *(1.4.0)*, **a variant from the weapon in hand** at `7` *(1.4.0)*, **the actions spent** at `8` *(1.4.0)*, **a choice made as it is cast** at `9` *(1.4.0)*, **area targeting** at `10`, **spell frequency** at `50`
(`api.castPipeline` exports them as `CAST_PRIORITY` in the source; the numbers are the contract).

Characters prepared before `setup` — every one in the world, at load — have not been through
`actorPreparation` yet. A stage that must be true from the first frame re-prepares the actors it cares
about at `ready` (`actor.reset()`).

## Area targeting — `api.targeting`

`run(spell, options)` → `true` to cast, `false` when the caster backed out. Called by the cast pipeline;
call it yourself only for an ability that reaches the table some other way.

Registries, all awaited in ascending priority:

| Method | `fn` | Answers |
| --- | --- | --- |
| `registerPreAim(name, priority, fn)` | `(spell, options)` | `false` refuses the cast before anything is asked or aimed |
| `registerAimed(name, priority, fn)` | `(config, regions, originToken)` | a boolean ends the run with that answer (a placement about a place, not people); `undefined` carries on to the review |
| `registerAfterAim(name, priority, fn)` | `(config, regions, originToken)` | — runs after targets are set, while the placed Regions still exist |
| `registerOriginResolver(name, priority, fn)` | `(actor, item)` | a token to measure range and line of effect from, or `null`; first answer wins |
| `registerScopePredicate(name, fn)` | `(item)` | `true` puts an unauthored item in scope under the `registered` setting |
| `registerAreaCount(fn)` | `(cast, options)` | how many areas this cast places, or `false` to refuse. One per world |
| `registered()` | — | everything registered, for the console |

`api.areas`: `placeArea(config, originToken)`, `discardArea(regions)`, `originOf(region)`,
`shapeFromArea(area, originToken, point)`, `aimAngle(from, to)`, `catchTokens(region, config, originToken)`,
`configFor(item, override)`, `originTokenFor(actor, item)`, `canRotate(type)`, `feetOf(range)`, `REAIM`,
`VARIANT` (the symbol a chosen shape's spell travels on, on `options`).

### Authored config

An item opts in with `flags[<scope>].areaTargeting` — `{ area, affects, includesSelf, includesNeutral,
requireLineOfEffect, predicate, anchor, maxTargets, range, areas, length, heightening, alternateArea }` —
and may offer a shape choice with `flags[<scope>].areaTargetingShapes`. `<scope>` is this module's id or any
id registered with `api.flags.registerFlagScope`, so a module keeps authoring under its own namespace.

### Heightening — `api.heightening`

`registerStepProvider(name, fn)` — `(rollOptions: Set) => steps` for growth a cast rank cannot express
("heighten as though you were 4 levels higher"); answers add up. Also `bonusStepsFrom(options)`,
`effectiveLevel(actor)`, `stepsFor`, `applyHeightening`, `applyThresholds`, `thresholdsCrossed`, `valueAtLevel`.

An authored `heightening` block grows `maxTargets`, `range`, `areas` and `length` per step (`interval` ranks
each), at named character levels (`at: { level: gains }`), and — since 1.2.0 — at named cast ranks
(`atRank: { rank: gains }`, pf2e's own "Heightened (3rd) You can target up to five creatures").

## Allowances

- `api.spellFrequency` — a spell's `system.frequency` is spent on cast and refused at zero.
- `api.frequencyGuard` — a feat's or action's use card at zero uses is refused unless pf2e just counted
  that use. `exempt(slug)`: leave a slug alone whose uses another module counts itself.
- `api.recharge` — ISO-interval frequencies (`PT10M`, `PT1H`, …) refill as world time passes.
  `refillPeriod(per)` refills every item whose `flags[<scope>].recharge.per` is `per` — call it when a
  period of your own turns over.
- `api.economy`: `intervalSeconds(per)`, `mayPost({ type, slug, frequency, justCounted })`.

## Smaller pieces

- `api.rollOptions`: `testPredicate(predicate, options)`, `targetingOptions(origin, target, item)`,
  `riderOptions({ originActor, targetActor, item, extra })`, `describeActor(actor, prefix)`, `describeDamage(…)`.
- `api.degree`: `DEGREES`, `degreeOf({ dieValue, modifier, total, dc, adjustments })`.
- `api.encounter`: `encounterOf(actor)`, `DAMAGED_THIS_ENCOUNTER` (the roll option the damage bus sets on a
  creature that lost Hit Points this encounter), `EncounterDamage`.
- `api.flags`: `registerFlagScope(moduleId)`, `flagOf(document, key)`, `flagScopes()`.

## Riders — since 1.1.0

The authoring reference is [`riders.md`](riders.md): events, apply types, the `rider:*` options.

- `api.riders` — the engine's own settings and hooks, which this module installs itself; nothing to call.
- `api.relay` — the GM relay riders run through. `register(action, fn)` adds a handler of your own (an
  action already taken is kept); `request(payload)` runs `payload.action` on the active GM's client, at once
  if that is you, and warns the caster once per cast when no GM is online.
- `api.riderPriority` — `{ bypass, riders }`, where the engine's `damageBus` stages sit. Place a stage of
  your own relative to these.

### `api.riderExtensions`

Ordered registries run in ascending priority; a name is taken once and a second throws.

| Method | `fn` | Answers |
| --- | --- | --- |
| `registerApplyType(type, fn)` | `(rider, context)` | a rider `apply.type` of your own; the built-in types cannot be replaced |
| `registerStrikeSelector(name, fn)` | `(actor, { exact })` | the strike action `strikes.apply.strike: "<name>"` means, or `null` |
| `registerOriginValue(name, match, fn)` | `(context, match)` | a value an expression asks the origin for; `match` is an exact string or a RegExp; `undefined` passes |
| `registerDcResolver(name, priority, fn)` | `(dc, context)` | the number `dc: "<word>"` means; `undefined` passes. Unanswered and absent: class DC, else best spell DC |
| `registerStatisticResolver(name, priority, fn)` | `(actor, slug)` | a statistic by slug; `undefined` passes. Then `spellcasting`, `getStatistic`, `classDCs` |
| `registerDefaultStatistic(name, priority, fn)` | `(actor)` | the slug a `counteract` with no `statistic` uses; `undefined` passes. Then class DC, then `spellcasting` |
| `registerCounteractRankBonus(name, priority, fn)` | `(actor, item)` | ranks added to a counteract; answers add up |
| `registerAfterCounteract(name, priority, fn)` | `({ actor, effect, item, outcome, counteracted, suppressible, suppressed })` | awaited after the counteract resolves |
| `registerSuppressor(fn)` | `(effect, { actor, outcome, item })` | `{ suppressed, until }` — suppresses rather than ends a suppressible effect; `until` is the phrase the card prints. One per world |
| `registerSuppressibleTrait(trait)` | — | effects with this trait are suppressed, not ended (`stance`, `polymorph` built in) |
| `registerSaveModifier(name, priority, fn)` | `({ statistic, context })` | `{ statistic?, modifiers? }` for a save the engine rolls; a later step sees the statistic an earlier one chose |
| `registerDurationModifier(name, priority, fn)` | `(duration, rider, context)` | a rider effect's duration, adjusted |
| `registerTeleportRefusal(name, priority, fn)` | `(token, context)` | a reason the token refuses forced movement, or `null` |
| `registerEffectFollowUp(name, priority, fn)` | `(rider, context, created)` | awaited after a rider's effect is created |
| `registerAreaAnchors(name, fn)` | `(actor)` | `{ [anchor]: { x, y } }` an area rider's `area.anchor` may name |
| `registered()` | — | everything registered, for the console |

### Pieces to reuse

- `api.riderApply`: `inflictPersistent`, `resolveCounteract`, `runSave`, `basicLadder`, `growByStep`,
  `conditionUuidOf`.
- `api.riderData`: `isAbilityUse(message)` — a message is an item being used, not a roll the item caused.
- `api.reactions`: `canOffer({ hasReaction, alreadyOffered, ownerOnline, frequencyLeft })`.
- `api.bypass`: `shadowTarget(actor, { reduction, hardness, immunities, types })` → an undo;
  `registerRollBypass()`; `FLAG`, `MEMORY`. Damage flagged `bypass` ignores what it names.
- `api.banish`, `api.encasement`, `api.escape` — what the `banish`, `encasement` and `escape` apply types
  run on. `banish.records()`, `banish.isBanished(tokenUuid)`.
- `api.strikeTechnique` — a spell with a `strike-resolved` rider and no `attack` trait arms the caster's
  next Strike when cast, and only that Strike fires its riders. `isOne(item)`, `isArmed(actor, item)`.
- `api.sharedAllowance` — effects flagged `sharedAllowance` are one bonus with many holders: the first
  holder's roll takes back every other copy aimed at the same creature.

### Areas left behind — since 1.1.0

- `api.lingering` — an item's `flags[<scope>].lingering` (one spec or a list, each with an optional
  `predicate` and `duration`) leaves a Region of behavior type `api.lingeringData.BEHAVIOR_TYPE` behind the
  cast, expiring with world time. `specsFor(item)`.
- `api.overlap` — `flags[<scope>].overlap` on an item with several placements: a creature caught by more
  than one gets the item's penalty to the save, as an effect.
- `api.enemyTerrain` — `isaacs-pf2e-automation.enemyMovementCost`, difficult terrain that slows only the
  origin's opponents. `registerOriginFlag(key)` names another Region flag (with an `originUuid`) that says
  whose terrain it is.

## Vanilla content — since 1.2.0

Content nobody authored for this module, by slug: pf2e's own spells first. The config is the same an item's
flags carry; where it comes from, for each **authored key** (`AUTHORED_KEYS`: `areaTargeting`,
`areaTargetingShapes`, `riders`, `lingering`, `overlap`, `bypass`, `counterThresholds`, and since 1.4.0 `requires`, `variantFromWeapon`, `actionVariants`, `targetsPerAction`, `sameAttackPenalty` and `castChoice`), in order:

1. the item's own flags, in any flag scope — `false` switches that key off, table and all;
2. an entry another module registered for the item's slug;
3. this module's table (`data/vanilla.json`), by slug or by a legacy slug's alias.

Asked per key: an entry that says nothing about a key leaves the next source's answer standing. An entry may
carry `variants: { [overlayId]: { …keys } }` for a cast variant (pf2e's `item.variantId`). Items from another
module's compendium never take an entry, except a registering module's own items taking its own entries.

An area from 2 or 3 aims at the `registered` tier of the scope setting, not as authored. A rider from 2 or 3
is dropped when the spell is already covered by another active automation module (see the coexistence setting).

- `api.vanilla.register(moduleId, { [slug]: entry })` — register in your `setup`. A slug is taken once; a
  second module's claim is refused with a console warning.
- `api.vanilla.configOf(document, key)` → the value; `api.vanilla.sourceOf(document, key)` →
  `{ value, source: "flags" | "registered" | "table" | null, module, off, deferred, slug }`.
- `api.vanilla.registered()` → `{ [slug]: moduleId }`; `api.vanilla.covered()` → this module's slugs;
  `api.vanilla.AUTHORED_KEYS`.
- `api.vanilla.covering()` → `{ [slug]: moduleId }`, the spells another active automation module covers
  (PF2e Automations, read live from its `rules/config.json`; PF2e Assistant, from the list this module ships);
  `api.vanilla.deferredTo(slug)` → that module's id, `"setting:off"` when the setting has table riders off,
  or null when a table rider for that spell applies.
- `api.vanilla.describe(item)` → the indicator's rows, `[{ key, label, lines, source, applies, switchable }]`;
  `api.vanilla.openPanel(item)` opens the panel. Every item this module automates, from any source, carries
  a mark on its sheet header and its chat card that opens it. The GM's switches only touch what this module
  owns — a table or registered key (switching it off writes `false` under this module's id) or such a
  `false` (switching it back on removes it) — never an item's own authored config.

Since 1.2.0, a save rider with no `dc` on a spell is against that spell's own spellcasting DC; a substitution
may ask for `origin.item.rank`, the rank the ability was cast at (a pf2e spell effect's `@item.level`); and a
lingering area's flat `damage.formula` grows by a flat `perStep`.

## Hooks this module fires

| Hook | Args | When |
| --- | --- | --- |
| `isaacs-pf2e-automation.init` | `(api)` | at `init`, once the API is published |
| `isaacs-pf2e-automation.counteracted` | `(actor, { effect, counteracted, outcome })` | since 1.1.0 — a rider's counteract resolved |

## Settings

`areaTargeting` (world), `areaTargetingScope` (world: `authored` · `registered` · `all`), `enforceRange`
(world), `areaTargetingReview` (client).

Since 1.2.0: `vanillaRiders` (world: `off` · `uncovered` (default) · `all`) — whether a table or registered
entry's riders apply, and whether they step aside for a spell another active module automates.

Since 1.1.0: `riders` (world, boolean), `automateDeath` (world: `npcs` · `all` · `off`), `banishments`
(world, hidden — the creatures folded away and when they return).

## Legacy reads — since 1.1.0, removed in 2.0.0

The engine moved here from `isaacs-hb-pf2e`. Until 2.0.0 it also understands what that module wrote:

- card buttons posted under the old `isaacs-hb-rider-*`, `isaacs-hb-counteract` and `isaacs-hb-reaction`
  actions still work;
- once that module registers its flag scope (`api.flags.registerFlagScope("isaacs-hb-pf2e")`), receipts on
  messages and the ledgers on actors (`ridersApplied`, `poolSpent`, round gates) are merged across both
  namespaces, and an armed Strike is cleared from both — so a cast made just before the upgrade still
  resolves just after it.

New content is written under this module's id only.

While `isaacs-hb-pf2e` is active and still requires this module below 1.1.0, it runs its own copy of the
engine, and this module's rider engine does not start (the GM is told once). Everything else runs.
