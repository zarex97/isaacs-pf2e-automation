import {
    basicLadder,
    conditionUuidOf,
    growByStep,
    inflictPersistent,
    resolveCounteract,
    runSave,
} from "./riders/apply.mjs";
import { Banish } from "./riders/banish.mjs";
import { FLAG as BYPASS_FLAG, MEMORY as BYPASS_MEMORY, registerRollBypass, shadowTarget } from "./riders/bypass.mjs";
import { isAbilityUse } from "./riders/data.mjs";
import { Encasement } from "./riders/encasement.mjs";
import { Escape } from "./riders/escape.mjs";
import { RiderExtensions } from "./riders/extensions.mjs";
import { Riders } from "./riders/index.mjs";
import { canOffer } from "./riders/reactions.mjs";
import { Relay } from "./riders/relay.mjs";
import { SharedAllowance } from "./riders/shared-allowance.mjs";
import { RIDER_PRIORITY } from "./riders/sources.mjs";
import { StrikeTechnique } from "./riders/strike-technique.mjs";
import { registerEnemyTerrain, registerOriginFlag } from "./targeting/enemy-terrain.mjs";
import { BEHAVIOR_TYPE as LINGERING_TYPE, FLAG as LINGERING_FLAG, Lingering } from "./targeting/lingering.mjs";
import { Overlap } from "./targeting/overlap.mjs";

/**
 * The rider engine's part of the automation's contract.
 *
 * Phase 1's contract (`isaacs-pf2e-automation`'s `api.mjs`) already holds targeting and the pipelines. This
 * is what the engine adds to it when it moves there; until then the homebrew's door builds it from the
 * staged code. Grouped by what a caller is doing, so a file can move without the contract changing.
 */
export function buildRidersApi() {
    return {
        // The engine itself: settings, chat-card binding, its hooks and damage stages.
        riders: Riders,
        // Where other modules plug in — apply types, selectors, resolvers, stages (see extensions.mjs).
        riderExtensions: RiderExtensions,
        // The public GM relay: `register(action, fn)` once, `request(payload)` from any client.
        relay: Relay,
        riderPriority: RIDER_PRIORITY,

        // Pieces another module's own code reuses.
        riderApply: { inflictPersistent, resolveCounteract, runSave, basicLadder, growByStep, conditionUuidOf },
        riderData: { isAbilityUse },
        reactions: { canOffer },
        bypass: { shadowTarget, registerRollBypass, FLAG: BYPASS_FLAG, MEMORY: BYPASS_MEMORY },

        // What the engine runs on its own.
        banish: Banish,
        encasement: Encasement,
        escape: Escape,
        strikeTechnique: StrikeTechnique,
        sharedAllowance: SharedAllowance,

        // Ground an area leaves behind, overlapping placements, and enemies-only terrain.
        lingering: Lingering,
        lingeringData: { BEHAVIOR_TYPE: LINGERING_TYPE, FLAG: LINGERING_FLAG },
        overlap: Overlap,
        enemyTerrain: { register: registerEnemyTerrain, registerOriginFlag },
    };
}
