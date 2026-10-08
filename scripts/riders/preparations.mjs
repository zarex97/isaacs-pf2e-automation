import { LIB_ID } from "../id.mjs";

/**
 * Effects that last until their caster's next daily preparations.
 *
 * *Darkvision* (5th), *Light*, *Vital Beacon*: "until your next daily preparations" — the caster's, wherever the effect
 * landed. An effect with `untilPreparations` keeps its caster (`flags.<module>.untilPreparations`) and has no timer of
 * its own; when that caster Rests for the Night (pf2e's `pf2e.restForTheNight`), every such effect of theirs ends, on
 * any actor in the world or on the scene.
 */

const FLAG = "untilPreparations";

/** The effects among these that end when this caster prepares. */
export function endingWith(effects, casterUuid) {
    return (effects ?? []).filter((e) => e.flags?.[LIB_ID]?.[FLAG] === casterUuid);
}

export const Preparations = {
    registerHooks() {
        Hooks.on("pf2e.restForTheNight", async (actor) => {
            if (game.users.activeGM?.id !== game.user.id || !actor?.uuid) return;
            const holders = new Set([...game.actors, ...(canvas?.tokens?.placeables ?? []).map((t) => t.actor).filter(Boolean)]);
            for (const holder of holders) {
                const ending = endingWith(holder.itemTypes?.effect, actor.uuid);
                if (ending.length > 0) await holder.deleteEmbeddedDocuments("Item", ending.map((e) => e.id)).catch(() => {});
            }
        });
    },
};
