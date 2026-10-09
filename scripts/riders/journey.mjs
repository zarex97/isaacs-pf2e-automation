import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";
import { playersOf } from "./message.mjs";

/**
 * Travel faster than feet allow.
 *
 * *Umbral Journey*: "Each hour, you cover roughly as much ground as you normally would in 3 days. The landmarks are
 * vague and symbolic rather than concrete, leaving you within a mile of your intended destination when you Dismiss the
 * spell or its duration ends." `{ type: "journey", days }` whispers the caster the group's pace: pf2e's travel table
 * gives 8 miles a day for each 10 feet of the slowest traveller's Speed, and each hour covers `days` of those. An effect
 * with `endNote` posts its words to its holder's players when it ends, however it ends — dismissed, run out or removed.
 */

const NOTE = "endNote";

/** Miles a day of travel at a Speed in feet: pf2e's travel table, 8 miles for every 10 feet. */
export function milesPerDay(speed) {
    return Math.floor(((Number(speed) || 0) * 8) / 10);
}

/** A creature's land Speed, wherever this version of pf2e keeps it. */
export function landSpeed(actor) {
    const system = actor?.system ?? {};
    const value = system.movement?.speeds?.land?.value ?? system.attributes?.speed?.total ?? system.attributes?.speed?.value;
    return Number(value) || 0;
}

export async function journeyPace(rider, context) {
    const from = context.originActor;
    if (!from) return;
    const travellers = [from, ...(context.targets ?? []).map((token) => token?.actor ?? token)].filter((actor) => actor?.uuid);
    const speed = Math.min(...[...new Set(travellers)].map(landSpeed).filter((s) => s > 0));
    if (!Number.isFinite(speed)) return;
    const days = Number(rider.apply.days) || 3;
    const hourly = milesPerDay(speed) * days;
    const hours = Number(rider.apply.hours) || 8;
    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: from }),
        whisper: playersOf(from),
        flavor: context.item?.name ?? t("Journey.Title"),
        content: `<p>${t("Journey.Pace", { speed, hourly, days, total: hourly * hours, hours })}</p>`,
    });
}

export const Journey = {
    registerHooks() {
        Hooks.on("deleteItem", async (item) => {
            if (game.users?.activeGM?.id !== game.user?.id) return;
            const note = item.flags?.[LIB_ID]?.[NOTE];
            if (!note || !item.actor) return;
            await ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor: item.actor }),
                whisper: playersOf(item.actor),
                flavor: item.name,
                content: `<p>${foundry.utils.escapeHTML(game.i18n.localize(note))}</p>`,
            });
        });
    },
};
