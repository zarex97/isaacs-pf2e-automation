import { LIB_ID } from "../id.mjs";

/** Where a lingering area keeps its origin. Spelled here rather than imported, so the two files do not import each other. */
const LINGERING_FLAG = "lingering";

/** Other flag keys on a Region that name whose terrain it is — see `registerOriginFlag`. */
const originFlags = [];

/**
 * Difficult terrain that only slows the people it was meant for.
 *
 * > **Senbonzakura** — The area is **difficult terrain for enemies** until the start of your next turn.
 *
 * Foundry's own `modifyMovementCost` behavior has exactly one field, `difficulties`, and no notion of who
 * is walking: a petal storm laid over a corridor slowed the caster's own party as readily as the enemy.
 * That is the whole of the gap — the terrain was real, it was simply indiscriminate.
 *
 * The seam Foundry does provide is `_getTerrainEffects(token, segment, options)`, which is handed the
 * token doing the moving. Subclassing the behavior and returning no effects for anyone on the caster's
 * side is all the filter needs to be, and it leaves every other part of Foundry's own implementation —
 * the schema, the twelve movement actions, the recalculation hooks — exactly where it was.
 *
 * Registered under the module's own type id, so a world that loses the module gets a behavior Foundry
 * does not recognise on an expired Region rather than a behavior that silently reverts to slowing allies.
 */

export const TYPE = `${LIB_ID}.enemyMovementCost`;

/**
 * Whose side is this token on?
 *
 * `system.details.alliance` is the field that survives: token disposition is writable but is reverted in
 * some worlds, and an NPC with no alliance of its own is opposition by default, which is what pf2e
 * assumes everywhere else.
 */
export function allianceOf(actor) {
    if (!actor) return null;
    const declared = actor.system?.details?.alliance;
    if (declared) return declared;
    return actor.type === "character" ? "party" : "opposition";
}

/** Would this terrain catch that token, given whose it is? */
/**
 * Whose terrain this is, wherever the module wrote it down.
 *
 * Two things now lay enemies-only ground and they keep their bookkeeping under different keys: a
 * `Lingering` area left behind by a cast, and a `TerrainAura` that stands around a form and moves with
 * it. Reading only the first meant Tiburón's water slowed his own party as readily as the enemy — the
 * filter was there, and it had nothing to compare against, so `catches` waved everybody through.
 */
function originOf(region) {
    const flags = region?.flags?.[LIB_ID] ?? {};
    const key = [LINGERING_FLAG, ...originFlags].find((name) => flags[name]?.originUuid);
    const uuid = key ? flags[key].originUuid : null;
    const document = uuid ? fromUuidSync(uuid) : null;
    return document?.actor ?? document;
}

/** Another module's Region flag that records an `originUuid` — a terrain aura that moves with its form. */
export function registerOriginFlag(key) {
    if (!originFlags.includes(key)) originFlags.push(key);
}

export function catches(originAlliance, tokenAlliance) {
    if (!originAlliance || !tokenAlliance) return true;   // unknown sides are caught, as before
    return originAlliance !== tokenAlliance;
}

export function registerEnemyTerrain() {
    const base = foundry.data?.regionBehaviors?.ModifyMovementCostRegionBehaviorType;
    if (!base) {
        console.warn(`Isaac's Homebrew | no ModifyMovementCostRegionBehaviorType; ${TYPE} is off.`);
        return false;
    }

    class EnemyMovementCost extends base {
        /** @override */
        _getTerrainEffects(token, segment, options) {
            const origin = originOf(this.parent?.parent);
            const mine = allianceOf(origin);
            const theirs = allianceOf(token?.actor);
            if (!catches(mine, theirs)) return [];
            return super._getTerrainEffects(token, segment, options);
        }
    }

    CONFIG.RegionBehavior.dataModels[TYPE] = EnemyMovementCost;
    CONFIG.RegionBehavior.typeIcons[TYPE] = "fa-solid fa-person-walking-dashed-line-arrow-right";
    return true;
}
