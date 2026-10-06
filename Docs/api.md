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

## Pipelines

One wrap per pf2e method, owned by this module. Other modules add **stages**. Every pipeline sorts its
stages by ascending `priority` (leave gaps), refuses a second stage with the same `name`, and has
`stages()` → `[{ name, priority }]` in run order (`{ before, after }` for those with both).

| Key | Wraps | Register | A stage is |
| --- | --- | --- | --- |
| `castPipeline` | `SpellcastingEntryPF2e#cast`, an action's `toMessage` | `before(name, priority, fn)` · `after(name, priority, fn)` | `before(spell, options)` → **truthy** to continue; anything falsy refuses (a closed dialog's `null` refuses). `options` reaches the system, so a stage may leave something on it. `after(cast, spell)` once the spell reached the table: `cast` is what was posted (a chosen variant), `spell` what the caster owns. A throw stops the cast |
| `damageBus` | `ActorPF2e#applyDamage` | `before(name, priority, fn)` · `after(name, priority, fn)` | `before(actor, params)` → may return an **undo**, called in a `finally`. `after(actor, params, hpBefore)`. Isolated: a throw is logged and the rest run |
| `checkPipeline` | `game.pf2e.Check.roll` | `before(name, priority, fn)` | `(check, context)` → a new context, or mutate the one given. Isolated |
| `rerollPipeline` | `game.pf2e.Check.rerollFromMessage` | `before(name, priority, fn)` | `(message, options)` → truthy to allow; falsy refuses (say why yourself). A throw counts as no objection |
| `actorPreparation` | character `prepareDerivedData` | `after(name, priority, fn)` | `(actor)`, synchronous, after the system's own preparation. Isolated |
| `detectionModes` | `TokenDocument#_prepareDetectionModes` | `after(name, priority, fn)` | `(tokenDocument)`, synchronous; edit `detectionModes` in place. Isolated |

The cast pipeline's own stages: **area targeting** at `10`, **spell frequency** at `50`
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

## Hooks this module fires

| Hook | Args | When |
| --- | --- | --- |
| `isaacs-pf2e-automation.init` | `(api)` | at `init`, once the API is published |

## Settings

`areaTargeting` (world), `areaTargetingScope` (world: `authored` · `registered` · `all`), `enforceRange`
(world), `areaTargetingReview` (client).
