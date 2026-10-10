import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";
import { flagOf } from "../lib/flags.mjs";
import { FLAG as ESCAPE } from "./escape.mjs";
import { playersOf } from "./message.mjs";

/**
 * An Escape, offered at once.
 *
 * *Liberating Command*: "If the target is Grabbed, Immobilized, or Restrained, it can immediately use a reaction to
 * attempt to escape." `{ type: "liberate", conditions }` whispers the target's players a card when it has one of those
 * conditions: a button for each Escape this module granted it (each against its own DC), and pf2e's own Escape, rolled
 * against the Athletics DC of the creature they target. Clicking one spends the target's reaction on it; the card
 * closes. A target held by nothing is told so, and offered nothing.
 */

const FLAG = "liberate";
const HELD = ["grabbed", "immobilized", "restrained"];

/** Which of the holding conditions a creature has. */
export function heldBy(conditionSlugs, wanted = HELD) {
    return wanted.filter((slug) => conditionSlugs.includes(slug));
}

export async function offerLiberation(rider, context) {
    const actor = context.actor;
    if (!actor) return;
    const held = heldBy([...(actor.conditions?.contents ?? actor.itemTypes?.condition ?? [])].map((c) => c.slug), rider.apply.conditions ?? HELD);
    if (held.length === 0) {
        context.notes.push(t("Liberate.Free", { name: actor.name }));
        return;
    }
    const escapes = actor.itemTypes.action.filter((item) => flagOf(item, ESCAPE));
    const buttons = [
        ...escapes.map((item) => `<button type="button" data-action="isaacs-automation-liberate" data-item="${item.id}">${foundry.utils.escapeHTML(item.name)}</button>`),
        `<button type="button" data-action="isaacs-automation-liberate" data-item="">${t("Liberate.Native")}</button>`,
    ];
    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        whisper: playersOf(actor),
        flavor: context.item?.name ?? t("Liberate.Title"),
        content: `<p>${t("Liberate.Offer", { name: actor.name, held: held.join(", ") })}</p><div class="isaacs-automation-choice">${buttons.join(" ")}</div>`,
        flags: { [LIB_ID]: { [FLAG]: { actorUuid: actor.uuid } } },
    });
}

export const Liberate = {
    registerHooks() {
        Hooks.on("renderChatMessageHTML", (message, html) => {
            const spec = flagOf(message, FLAG);
            if (!spec) return;
            for (const button of html.querySelectorAll?.('[data-action="isaacs-automation-liberate"]') ?? []) {
                if (button.dataset.bound) continue;
                button.dataset.bound = "1";
                if (spec.used) button.disabled = true;
                button.addEventListener("click", async () => {
                    const actor = await fromUuid(spec.actorUuid);
                    if (!actor?.isOwner || flagOf(message, FLAG)?.used) return;
                    await message.update({ [`flags.${LIB_ID}.${FLAG}.used`]: true });
                    const item = button.dataset.item ? actor.items.get(button.dataset.item) : null;
                    if (item) await item.toMessage();
                    else await game.pf2e.actions.get("escape")?.use({ actors: [actor] });
                });
            }
        });
    },
};
