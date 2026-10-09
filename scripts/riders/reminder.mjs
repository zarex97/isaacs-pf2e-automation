import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";

/**
 * A message that waits for a moment of the world's clock.
 *
 * *Timely Reminder*: "You send a message to yourself that's delivered at a delayed time of your choosing … At the chosen
 * moment, a gentle chime will sound in your head, followed by the message repeated twice". An effect carries
 * `reminder: { at, message }`, the world time and the words chosen as it was cast (`apply.mjs`). When the clock
 * reaches it, the message is whispered to the holder's owners and the effect ends. Active GM only.
 */

const FLAG = "reminder";

/** The effects whose reminder is due at this world time. */
export function due(effects, now) {
    return effects.filter((effect) => {
        const at = Number(effect.flags?.[LIB_ID]?.[FLAG]?.at);
        return Number.isFinite(at) && at <= now;
    });
}

/** The seconds a delay in days, hours and minutes comes to: at least a minute, at most a year. */
export function delaySeconds({ days = 0, hours = 0, minutes = 0 } = {}) {
    const seconds = ((Number(days) || 0) * 24 * 60 + (Number(hours) || 0) * 60 + (Number(minutes) || 0)) * 60;
    return Math.min(Math.max(seconds, 60), 365 * 24 * 3600);
}

export const Reminder = {
    registerHooks() {
        Hooks.on("updateWorldTime", () => Reminder.deliver());
        Hooks.once("ready", () => Reminder.deliver());
    },

    async deliver() {
        if (game.users?.activeGM?.id !== game.user?.id) return;
        const now = game.time.worldTime;
        for (const actor of game.actors ?? []) {
            for (const effect of due(actor.itemTypes?.effect ?? [], now)) {
                const { message } = effect.flags[LIB_ID][FLAG];
                const owners = Object.entries(actor.ownership ?? {})
                    .filter(([id, level]) => id !== "default" && level >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)
                    .map(([id]) => id);
                await ChatMessage.create({
                    speaker: ChatMessage.getSpeaker({ actor }),
                    whisper: [...new Set([...owners, ...ChatMessage.getWhisperRecipients("GM").map((user) => user.id)])],
                    content: `<p>${t("Reminder.Chime", { name: effect.name, message: foundry.utils.escapeHTML(String(message ?? "")) })}</p>`,
                });
                await effect.delete();
            }
        }
    },
};
