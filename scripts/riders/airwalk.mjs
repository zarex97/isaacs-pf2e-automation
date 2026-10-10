import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";

/**
 * Walking on air.
 *
 * *Air Walk*: "The target can walk on air as if it were solid ground. It can ascend and descend in this way at a maximum
 * of a 45-degree angle." A creature carrying an effect with `airWalk` may change its token's elevation while it walks,
 * but by no more than the distance it moves across the ground in the same move: a step 5 feet over rises 5 feet at most.
 * A steeper change is refused before it is made. Without the effect, nothing is checked.
 */

/** May a move go `rise` feet up or down while covering `across` feet over the ground? */
export function climbable(rise, across) {
    return Math.abs(Number(rise) || 0) <= (Number(across) || 0) + 0.01;
}

export const AirWalk = {
    registerHooks() {
        Hooks.on("preUpdateToken", (token, change, options) => {
            if (!("elevation" in change) || options?.forcedMovement) return;
            if (!token.actor?.itemTypes?.effect?.some((e) => e.flags?.[LIB_ID]?.airWalk)) return;
            const scene = token.parent;
            const perFoot = scene.grid.size / (scene.grid.distance || 5);
            const dx = ("x" in change ? change.x : token._source.x) - token._source.x;
            const dy = ("y" in change ? change.y : token._source.y) - token._source.y;
            const across = Math.max(Math.abs(dx), Math.abs(dy)) / perFoot;
            const rise = (Number(change.elevation) || 0) - (Number(token._source.elevation) || 0);
            if (climbable(rise, across)) return;
            ui.notifications.warn(t("AirWalk.TooSteep", { name: token.name, rise: Math.abs(rise), across }));
            return false;
        });
    },
};
