import { t } from "../i18n.mjs";
import { flagOf } from "../lib/flags.mjs";
import { LIB_ID } from "../id.mjs";

/**
 * An illusion a creature can see through.
 *
 * *Phantom Crowd*: "A creature that touches a member of the crowd or makes a Seek action to examine the crowd can
 * attempt to disbelieve your illusion. The crowd is difficult terrain for anyone who hasn't disbelieved the illusion."
 * A lingering area with `disbelief` keeps the caster's spell DC. A creature that moves into it, or Seeks within 30 feet
 * of it, rolls Perception against that DC, once. One who succeeds is written into the area's `disbelieved`, and the
 * area's terrain (`enemy-terrain.mjs`) no longer slows it. Active GM only.
 */

const LINGERING = "lingering";
const SEEK_FEET = 30;

/** Has this creature yet to try? */
export function mayTry(payload, actorUuid) {
    return !!payload?.disbelief && !!actorUuid && !(payload.tried ?? []).includes(actorUuid);
}

export const Disbelief = {
    async attempt(region, token) {
        if (game.users?.activeGM?.id !== game.user?.id) return;
        const payload = flagOf(region, LINGERING);
        const actor = token?.actor;
        if (!actor || !mayTry(payload, actor.uuid) || !actor.perception) return;
        const tried = [...(payload.tried ?? []), actor.uuid];
        await region.update({ [`flags.${LIB_ID}.${LINGERING}.tried`]: tried });
        const roll = await actor.perception.roll({ dc: { value: Number(payload.disbelief.dc) }, skipDialog: true, label: t("Disbelief.Check", { name: payload.name ?? region.name }) });
        const sees = (roll?.degreeOfSuccess ?? 0) >= 2;
        if (sees) await region.update({ [`flags.${LIB_ID}.${LINGERING}.disbelieved`]: [...(payload.disbelieved ?? []), actor.uuid] });
        await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<p>${t(sees ? "Disbelief.Sees" : "Disbelief.Fooled", { actor: actor.name, name: payload.name ?? region.name })}</p>` });
    },

    registerHooks() {
        // "Makes a Seek action to examine the crowd": a Seek within 30 feet of it.
        Hooks.on("createChatMessage", async (message) => {
            if (game.users?.activeGM?.id !== game.user?.id) return;
            const context = message.flags?.pf2e?.context;
            if (context?.type !== "perception-check" || !(context.options ?? []).includes("action:seek")) return;
            const token = message.token?.object ?? message.actor?.getActiveTokens?.()?.[0];
            if (!token) return;
            const perFoot = canvas.grid.size / (canvas.scene.grid.distance || 5);
            for (const region of canvas.scene.regions) {
                if (!flagOf(region, LINGERING)?.disbelief) continue;
                const shape = region.shapes?.[0];
                const radius = Number(shape?.radius) || 0;
                const gap = Math.hypot(token.center.x - shape.x, token.center.y - shape.y) - radius;
                if (gap / perFoot <= SEEK_FEET) await Disbelief.attempt(region, token.document);
            }
        });
    },
};
