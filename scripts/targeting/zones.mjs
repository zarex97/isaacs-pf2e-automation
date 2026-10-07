import { LIB_ID } from "../id.mjs";
import { Extensions } from "./extensions.mjs";

/**
 * Who stood where inside the areas, carried onto the card.
 *
 * *Falling Stars*: "Each falling star deals 6d10 bludgeoning damage to each creature in the 10-foot burst at the
 * center of its area of effect before exploding, dealing 14d6 energy damage … to each creature in its 40-foot
 * burst." One cast, two rings: who is in the inner one is a fact about the placement, and the placement is gone
 * by the time the card's riders run. So the placement names them — `areaTargeting.zones: [{ id, within }]`,
 * the creatures whose centre is within `within` feet of any area's centre — and the card carries the names as
 * `flags[LIB_ID].zones.<name>`, the way the chosen shape is carried (`cast-shape.mjs`).
 */

/** A list of names waits this long for its card. pf2e posts it within the same cast. */
const WINDOW_MS = 60_000;

let pending = null;

/** The tokens whose centre lies within `feet` of any of these centres. */
export function withinOfAny(tokens, centres, feet, gridSize, gridDistance) {
    const px = (feet / (gridDistance || 5)) * gridSize;
    return tokens.filter((token) => centres.some((c) => Math.hypot(token.center.x - c.x, token.center.y - c.y) <= px + 0.5)).map((token) => token.id);
}

export const CastZones = {
    register() {
        Extensions.registerAfterAim("who stands where in the areas", 40, (config, regions) => CastZones.aimed(config, regions));
        Hooks.on("preCreateChatMessage", (message) => {
            if (!pending) return;
            if (Date.now() - pending.at > WINDOW_MS) {
                pending = null;
                return;
            }
            const uuid = message.flags?.pf2e?.origin?.uuid;
            if (!uuid || uuid !== pending.uuid) return;
            message.updateSource({ [`flags.${LIB_ID}.zones`]: pending.zones });
            pending = null;
        });
    },

    aimed(config, regions) {
        const zones = Array.isArray(config.zones) ? config.zones : [];
        if (zones.length === 0) return;
        const centres = [regions].flat().map((region) => region?.shapes?.[0]).filter((s) => Number.isFinite(s?.x) && Number.isFinite(s?.y));
        const targets = [...(game.user?.targets ?? [])];
        const named = Object.fromEntries(zones.map((zone) => [zone.id, withinOfAny(targets, centres, Number(zone.within) || 0, canvas.grid.size, canvas.scene.grid.distance)]));
        pending = { uuid: config.item.uuid, zones: named, at: Date.now() };
    },
};
