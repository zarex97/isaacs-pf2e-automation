import { CastPipeline } from "./cast-pipeline.mjs";
import { FrequencyGuard } from "./economy/frequency-guard.mjs";
import { Recharge } from "./economy/recharge.mjs";
import { SpellFrequency } from "./economy/spell-frequency.mjs";
import { ActorPreparation } from "./lib/actor-preparation.mjs";
import { CheckPipeline } from "./lib/check-pipeline.mjs";
import { DamageBus } from "./lib/damage-bus.mjs";
import { DetectionModes } from "./lib/detection-modes.mjs";
import { EncounterDamage } from "./lib/encounter-damage.mjs";
import { ShieldBlock } from "./riders/shield-block.mjs";
import { SpellShield } from "./riders/spell-shield.mjs";
import { Deters } from "./riders/deters.mjs";
import { Dismiss } from "./riders/dismiss.mjs";
import { OriginAction } from "./riders/origin-action.mjs";
import { Affliction } from "./riders/affliction.mjs";
import { Unobserved } from "./riders/unobserved.mjs";
import { SetAside } from "./riders/set-aside.mjs";
import { Fall } from "./riders/fall.mjs";
import { Forbids } from "./riders/forbids.mjs";
import { CastZones } from "./targeting/zones.mjs";
import { Repels } from "./targeting/repels.mjs";
import { Barrier } from "./targeting/barrier.mjs";
import { MovementCost } from "./lib/movement-cost.mjs";
import { FastHealing } from "./lib/fast-healing.mjs";
import { RerollPipeline } from "./lib/reroll-pipeline.mjs";
import { Banish } from "./riders/banish.mjs";
import { registerRollBypass } from "./riders/bypass.mjs";
import { Encasement } from "./riders/encasement.mjs";
import { Escape } from "./riders/escape.mjs";
import { Riders } from "./riders/index.mjs";
import { SharedAllowance } from "./riders/shared-allowance.mjs";
import { StrikeTechnique } from "./riders/strike-technique.mjs";
import { registerEnemyTerrain } from "./targeting/enemy-terrain.mjs";
import { Extensions } from "./targeting/extensions.mjs";
import { AreaTargeting } from "./targeting/index.mjs";
import { Lingering } from "./targeting/lingering.mjs";
import { Inside } from "./targeting/inside.mjs";
import { Sustain } from "./riders/sustain.mjs";
import { registerTargetTiming, registerEndsWith, registerHostileEnd } from "./riders/apply.mjs";
import { Overlap } from "./targeting/overlap.mjs";
import { CastShape } from "./targeting/cast-shape.mjs";
import { MoveCaster } from "./targeting/move-caster.mjs";
import { Coexistence } from "./vanilla/coexistence.mjs";
import { Indicator } from "./vanilla/indicator.mjs";
import { Vanilla } from "./vanilla/table.mjs";

/**
 * What the automation does at `init` and at `setup`, as named steps.
 *
 * Named so whoever runs them can isolate each one — a feature that fails to start should cost that feature
 * and not the rest. `module.mjs` runs them, each in its own try so one failing step costs only itself.
 */
export const INIT = [
    ["area targeting's settings", () => AreaTargeting.registerSettings()],
    ["the cast pipeline's own stages", () => CastPipeline.registerDefaults()],
    ["recharging", () => Recharge.registerHooks()],
    ["spell frequency", () => SpellFrequency.registerHooks()],
    ["feat and action frequency", () => FrequencyGuard.registerHooks()],
    ["damaged this encounter", () => EncounterDamage.registerHooks()],
    ["a shield that ends when it blocks", () => ShieldBlock.register()],
    ["a shield a spell makes", () => SpellShield.register()],
    ["fast healing and regeneration, applied", () => FastHealing.registerHooks()],
    // Not awaited: nothing reads the table before a cast, and a failed fetch leaves vanilla content as it was.
    ["the vanilla table", () => void Vanilla.load()],
    ["the vanilla riders setting", () => Coexistence.registerSettings()],
    ["the automation indicator", () => Indicator.registerHooks()],
    ["the shape a cast chose, on its card", () => CastShape.registerHooks()],
    ["who stands where in the areas, on its card", () => CastZones.register()],
    ["an aura that keeps creatures off its caster", () => { Repels.registerHooks(); Repels.register(); }],
    ["walls of breakable sections", () => Barrier.registerHooks()],
    ["a spell that moves its caster", () => MoveCaster.register()],
];

/**
 * The rider engine and what it runs on its own — skipped, as a whole, while a homebrew that carries its own
 * copy of the engine is active (`module.mjs`). Two engines would register the same damage stages, the
 * second throwing, and would both apply every rider.
 */
export const RIDER_INIT = [
    ["the rider engine's settings", () => Riders.registerSettings()],
    ["the banishment register", () => { Banish.registerSettings(); Banish.registerHooks(); }],
    ["enemies-only difficult terrain", () => registerEnemyTerrain()],
    ["lingering areas", () => { Lingering.register(); Lingering.registerHooks(); }],
    ["areas held while inside", () => Inside.registerHooks()],
    ["sustaining a spell that grows", () => Sustain.registerHooks()],
    ["effects timed to their target's turn", () => registerTargetTiming()],
    ["what ends with a condition", () => registerEndsWith()],
    ["what a hostile action ends", () => registerHostileEnd()],
    ["a ward its attackers save against", () => Deters.register()],
    ["dismissing an area", () => Dismiss.registerHooks()],
    ["an action spent from a creature's effect", () => { OriginAction.register(); OriginAction.registerHooks(); }],
    ["afflictions: stage damage and the save at the end of each turn", () => Affliction.registerHooks()],
    ["a creature one cannot observe", () => Unobserved.register()],
    ["what a near-miss counteract set aside, put back", () => SetAside.registerHooks()],
    ["a creature kept on the ground", () => Fall.registerHooks()],
    ["what a form forbids", () => Forbids.register()],
    ["overlapping areas' relay", () => Overlap.registerRelay()],
    ["armed Strikes", () => StrikeTechnique.registerHooks()],
    ["shared allowances", () => SharedAllowance.registerHooks()],
    ["encasements", () => Encasement.registerHooks()],
    ["escapes", () => Escape.registerHooks()],
    ["an item's bypass on its own damage roll", () => registerRollBypass()],
];

/** After `init`, so the system's document classes exist to be wrapped. */
export const SETUP = [
    ["the damage bus", () => DamageBus.install()],
    ["the check pipeline", () => CheckPipeline.install()],
    ["the cast pipeline", () => CastPipeline.install()],
    ["character preparation", () => ActorPreparation.install()],
    ["detection modes", () => DetectionModes.install()],
    ["movement cost", () => MovementCost.install()],
    ["the reroll pipeline", () => RerollPipeline.install()],
];

export const RIDER_SETUP = [
    ["the rider engine", () => Riders.registerHooks()],
    ["ground left behind and overlapping placements, after aiming", () => registerAreaSteps()],
];

/**
 * Lingering ground and overlapping placements are this module's own, so it asks for them after an area is
 * aimed. They were registered by the homebrew alone, which left a world running this module by itself with
 * an Ice Storm that never stormed. At `setup`, after every module's `init` has had its say, and only
 * where nobody registered the same step — a homebrew that still does so keeps its own.
 */
export const AREA_STEP = { lingering: 20, overlap: 30 };

export function registerAreaSteps() {
    const taken = new Set(Extensions.registered().afterAim.map((step) => step.name));
    if (!taken.has("lingering areas")) {
        Extensions.registerAfterAim("lingering areas", AREA_STEP.lingering, (config, regions, originToken) => Lingering.create(config, regions, originToken));
    }
    if (!taken.has("overlapping areas")) {
        Extensions.registerAfterAim("overlapping areas", AREA_STEP.overlap, (config, regions, originToken) => Overlap.apply(config, regions, originToken));
    }
}
