import { CastPipeline } from "./cast-pipeline.mjs";
import { FrequencyGuard, mayPost } from "./economy/frequency-guard.mjs";
import { Recharge, intervalSeconds } from "./economy/recharge.mjs";
import { SpellFrequency } from "./economy/spell-frequency.mjs";
import { ActorPreparation } from "./lib/actor-preparation.mjs";
import { CheckPipeline } from "./lib/check-pipeline.mjs";
import { DamageBus } from "./lib/damage-bus.mjs";
import { DEGREES, degreeOf } from "./lib/degree.mjs";
import { DetectionModes } from "./lib/detection-modes.mjs";
import { EncounterDamage, OPTION as DAMAGED_THIS_ENCOUNTER, encounterOf } from "./lib/encounter-damage.mjs";
import { flagOf, flagScopes, registerFlagScope } from "./lib/flags.mjs";
import { RerollPipeline } from "./lib/reroll-pipeline.mjs";
import { describeActor, describeDamage, riderOptions, targetingOptions, testPredicate } from "./lib/roll-options.mjs";
import { catchTokens } from "./targeting/catch.mjs";
import { canRotate, configFor, feetOf, originTokenFor } from "./targeting/config.mjs";
import {
    applyHeightening,
    applyThresholds,
    bonusStepsFrom,
    effectiveLevel,
    registerStepProvider,
    stepsFor,
    thresholdsCrossed,
    valueAtLevel,
} from "./targeting/heightening.mjs";
import { AreaTargeting, VARIANT } from "./targeting/index.mjs";
import { aimAngle, discardArea, originOf, placeArea, shapeFromArea } from "./targeting/place.mjs";
import { REAIM } from "./targeting/review.mjs";

/**
 * Everything the automation offers another module, in one object.
 *
 * This is the contract: once the automation is its own module, this object is what
 * `game.modules.get(<id>).api` holds, and nothing outside it is promised. Grouped by what a caller is
 * doing — registering a stage, aiming an area, reading a roll option — rather than by file, so a file can
 * move without the contract changing.
 */
export function buildApi() {
    return {
        // The single-wrap pipelines. Each takes stages; none of them is wrapped twice.
        castPipeline: CastPipeline,
        damageBus: DamageBus,
        checkPipeline: CheckPipeline,
        actorPreparation: ActorPreparation,
        detectionModes: DetectionModes,
        rerollPipeline: RerollPipeline,

        // Area targeting and its registries (`registerPreAim`, `registerAfterAim`, …).
        targeting: AreaTargeting,
        areas: {
            placeArea,
            discardArea,
            originOf,
            shapeFromArea,
            aimAngle,
            catchTokens,
            configFor,
            originTokenFor,
            canRotate,
            feetOf,
            REAIM,
            VARIANT,
        },
        heightening: {
            registerStepProvider,
            bonusStepsFrom,
            effectiveLevel,
            stepsFor,
            applyHeightening,
            applyThresholds,
            thresholdsCrossed,
            valueAtLevel,
        },

        // Allowances pf2e writes down and never enforces or refills.
        recharge: Recharge,
        spellFrequency: SpellFrequency,
        frequencyGuard: FrequencyGuard,
        economy: { intervalSeconds, mayPost },

        // Roll options, degrees and the encounter's damage mark.
        rollOptions: { testPredicate, targetingOptions, riderOptions, describeActor, describeDamage },
        degree: { DEGREES, degreeOf },
        encounter: { EncounterDamage, encounterOf, DAMAGED_THIS_ENCOUNTER },

        // Which modules' flags carry authored config.
        flags: { registerFlagScope, flagOf, flagScopes },
    };
}
