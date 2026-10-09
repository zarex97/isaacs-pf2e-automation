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
import { ShareDamage } from "./riders/share-damage.mjs";
import { Nudge } from "./riders/nudge.mjs";
import { ConditionFloor } from "./riders/condition-floor.mjs";
import { Unfettered } from "./riders/unfettered.mjs";
import { Deters } from "./riders/deters.mjs";
import { Dismiss } from "./riders/dismiss.mjs";
import { OriginAction } from "./riders/origin-action.mjs";
import { Affliction } from "./riders/affliction.mjs";
import { Unobserved } from "./riders/unobserved.mjs";
import { SetAside } from "./riders/set-aside.mjs";
import { Fall } from "./riders/fall.mjs";
import { Forbids } from "./riders/forbids.mjs";
import { Guardian } from "./riders/guardian.mjs";
import { Conditions } from "./conditions/index.mjs";
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
import { Summon } from "./targeting/summon.mjs";
import { Sacrifice } from "./vanilla/sacrifice.mjs";
import { Phase } from "./vanilla/phase.mjs";
import { SaveModifier } from "./vanilla/save-modifier.mjs";
import { Draws } from "./riders/draws.mjs";
import { HeldFast } from "./riders/held-fast.mjs";
import { FlanksWith } from "./riders/flanks-with.mjs";
import { DcSwap } from "./riders/dc-swap.mjs";
import { Reminder } from "./riders/reminder.mjs";
import { SpellImmunity } from "./riders/spell-immunity.mjs";
import { Conjure } from "./riders/conjure.mjs";
import { Trail } from "./riders/trail.mjs";
import { Disbelief } from "./targeting/disbelief.mjs";
import { Languages } from "./vanilla/languages.mjs";
import { Pocket } from "./targeting/pocket.mjs";
import { Message } from "./riders/message.mjs";
import { Ventriloquism } from "./riders/ventriloquism.mjs";
import { SensesLink } from "./riders/senses-link.mjs";
import { SecretPage } from "./riders/secret-page.mjs";
import { BlindEye } from "./riders/blind-eye.mjs";
import { Travel } from "./riders/travel.mjs";
import { Victuals } from "./riders/poison.mjs";
import { Recall } from "./riders/recall.mjs";
import { Journey } from "./riders/journey.mjs";
import { Preparations } from "./riders/preparations.mjs";
import { Reveal } from "./riders/reveal.mjs";
import { LightOrb } from "./targeting/light-orb.mjs";
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
    ["damage shared with a caster", () => { ShareDamage.register(); ShareDamage.registerHooks(); }],
    ["a nudge after the die falls", () => Nudge.register()],
    ["a condition held at a value", () => ConditionFloor.registerHooks()],
    ["an escape unfettered movement makes", () => Unfettered.register()],
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
    ["a creature summoned", () => { Summon.register(); Summon.registerHooks(); }],
    ["a minion sacrificed", () => Sacrifice.register()],
    ["a circumstance bonus to AC that counts less", () => Phase.register()],
    ["a save a spell changes for some", () => SaveModifier.register()],
    ["metal drawn to a creature", () => Draws.register()],
    ["a weapon that cannot be let go", () => HeldFast.registerHooks()],
    ["a pair that flanks wherever it stands", () => FlanksWith.register()],
    ["a DC its holder sets another way, and an anchor", () => DcSwap.register()],
    ["a message for a moment of the clock", () => Reminder.registerHooks()],
    ["a ward against one named spell", () => SpellImmunity.register()],
    ["an object conjured for as long as an effect lasts", () => Conjure.registerHooks()],
    ["a path its holder leaves behind", () => Trail.registerHooks()],
    ["an illusion a creature can see through", () => Disbelief.registerHooks()],
    ["languages a vanilla spell makes up", () => Languages.register()],
    ["a room that is not on the map", () => Pocket.registerHooks()],
    ["words passed from mind to mind", () => Message.registerHooks()],
    ["a voice thrown", () => Ventriloquism.registerHooks()],
    ["seeing through another creature's eyes", () => SensesLink.registerHooks()],
    ["a page that says something else", () => SecretPage.registerHooks()],
    ["an object that will not be used to watch", () => BlindEye.register()],
    ["where a creature has been", () => Travel.registerHooks()],
    ["food made fine for an hour", () => Victuals.registerHooks()],
    ["knowledge recalled all at once", () => { Recall.register(); Recall.registerHooks(); }],
    ["words for when an effect ends", () => Journey.registerHooks()],
    ["until the caster's daily preparations", () => Preparations.registerHooks()],
    ["a revealed creature is seen", () => Reveal.registerMode()],
    ["a light set down", () => { LightOrb.register(); LightOrb.registerHooks(); }],
    ["pf2e's conditions, made to do what they say", () => { Conditions.registerSettings(); Conditions.registerHooks(); Conditions.register(); }],
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
    ["a guardian that takes a Strike first", () => Guardian.register()],
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
    ["what sickened refuses", () => Conditions.install()],
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
