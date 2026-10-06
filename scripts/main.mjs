import { CastPipeline } from "./cast-pipeline.mjs";
import { FrequencyGuard } from "./economy/frequency-guard.mjs";
import { Recharge } from "./economy/recharge.mjs";
import { SpellFrequency } from "./economy/spell-frequency.mjs";
import { ActorPreparation } from "./lib/actor-preparation.mjs";
import { CheckPipeline } from "./lib/check-pipeline.mjs";
import { DamageBus } from "./lib/damage-bus.mjs";
import { DetectionModes } from "./lib/detection-modes.mjs";
import { EncounterDamage } from "./lib/encounter-damage.mjs";
import { RerollPipeline } from "./lib/reroll-pipeline.mjs";
import { AreaTargeting } from "./targeting/index.mjs";

/**
 * What the automation does at `init` and at `setup`, as named steps.
 *
 * Named so whoever runs them can isolate each one — a feature that fails to start should cost that feature
 * and not the rest. Today the homebrew's entry point runs them; once the automation is its own module, its
 * own entry point will, and nothing here changes.
 */
export const INIT = [
    ["area targeting's settings", () => AreaTargeting.registerSettings()],
    ["the cast pipeline's own stages", () => CastPipeline.registerDefaults()],
    ["recharging", () => Recharge.registerHooks()],
    ["spell frequency", () => SpellFrequency.registerHooks()],
    ["feat and action frequency", () => FrequencyGuard.registerHooks()],
    ["damaged this encounter", () => EncounterDamage.registerHooks()],
];

/** After `init`, so the system's document classes exist to be wrapped. */
export const SETUP = [
    ["the damage bus", () => DamageBus.install()],
    ["the check pipeline", () => CheckPipeline.install()],
    ["the cast pipeline", () => CastPipeline.install()],
    ["character preparation", () => ActorPreparation.install()],
    ["detection modes", () => DetectionModes.install()],
    ["the reroll pipeline", () => RerollPipeline.install()],
];
