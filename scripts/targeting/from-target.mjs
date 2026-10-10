import { configOf } from "../lib/config-of.mjs";
import { AreaTargeting } from "./index.mjs";

/**
 * An area centred on the creature the spell touched.
 *
 * *Circle of Protection*: "Range touch; Area 10-foot emanation … You ward a creature and those nearby". With
 * `areaTargeting.fromTarget`, the area is built on the one creature the caster targets rather than on the caster — and
 * a lingering area that follows its origin then follows that creature.
 */
export const FromTarget = {
    register() {
        AreaTargeting.registerOriginResolver("an area on the creature touched", 35, (_actor, item) => {
            if (configOf(item, "areaTargeting")?.fromTarget !== true) return null;
            const targets = [...(game.user?.targets ?? [])];
            return targets.length === 1 ? targets[0] : null;
        });
    },
};
