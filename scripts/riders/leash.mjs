import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";

/**
 * An effect that holds only while two creatures stay close.
 *
 * *Reflected Beauty*: "If you're ever more than 30 feet from the subject you're reflecting, reflected beauty immediately
 * ends." An effect with `leash: { feet }` remembers the other creature the cast reached; whenever either of them moves,
 * the effect ends if they stand more than `feet` apart on the same scene, or on different scenes. Active GM only.
 */

const FLAG = "leash";

/** Are two points more than so many feet apart, as the grid measures? */
export function strays(distance, feet) {
    return Number(distance) > Number(feet);
}

function tokenOn(actor, scene) {
    if (actor?.token) return actor.token.parent === scene ? actor.token : null;
    return scene?.tokens.find((token) => token.actorLink && token.actorId === actor?.id) ?? null;
}

export const Leash = {
    /** The flag for an effect leashed to `other`, `feet` away at most. */
    flag(feet, other) {
        return { [LIB_ID]: { [FLAG]: { feet: Number(feet) || 30, to: other?.uuid ?? null } } };
    },

    async check(scene) {
        if (game.users?.activeGM?.id !== game.user?.id || !scene) return;
        const holders = [...game.actors, ...scene.tokens.filter((token) => !token.actorLink && token.actor).map((token) => token.actor)];
        for (const holder of holders) {
            for (const effect of holder.itemTypes?.effect ?? []) {
                const spec = effect.flags?.[LIB_ID]?.[FLAG];
                if (!spec?.to) continue;
                const here = tokenOn(holder, scene);
                if (!here) continue;
                const other = fromUuidSync(spec.to);
                const there = tokenOn(other, scene);
                const feet = there ? canvas.grid.measurePath([here.object?.center ?? here, there.object?.center ?? there]).distance : Infinity;
                if (!strays(feet, spec.feet)) continue;
                await effect.delete();
                await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: holder }), content: `<p>${t("Leash.Ends", { name: effect.name, other: other?.name ?? "", feet: spec.feet })}</p>` });
            }
        }
    },

    registerHooks() {
        Hooks.on("updateToken", (token, change) => {
            if ("x" in change || "y" in change) void Leash.check(token.parent);
        });
    },
};
