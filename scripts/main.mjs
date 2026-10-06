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
import { Banish } from "./riders/banish.mjs";
import { registerRollBypass } from "./riders/bypass.mjs";
import { Encasement } from "./riders/encasement.mjs";
import { Escape } from "./riders/escape.mjs";
import { Riders } from "./riders/index.mjs";
import { SharedAllowance } from "./riders/shared-allowance.mjs";
import { StrikeTechnique } from "./riders/strike-technique.mjs";
import { registerEnemyTerrain } from "./targeting/enemy-terrain.mjs";
import { AreaTargeting } from "./targeting/index.mjs";
import { Lingering } from "./targeting/lingering.mjs";
import { Overlap } from "./targeting/overlap.mjs";

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
    // The rider engine and what it runs on its own.
    ["the rider engine's settings", () => Riders.registerSettings()],
    ["the banishment register", () => { Banish.registerSettings(); Banish.registerHooks(); }],
    ["enemies-only difficult terrain", () => registerEnemyTerrain()],
    ["lingering areas", () => { Lingering.register(); Lingering.registerHooks(); }],
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
    ["the reroll pipeline", () => RerollPipeline.install()],
    ["the rider engine", () => Riders.registerHooks()],
];
