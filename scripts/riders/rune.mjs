import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";
import { flagOf } from "../lib/flags.mjs";
import { playersOf } from "./message.mjs";

/**
 * A message left in a rune.
 *
 * *Message Rune*: "You record a message up to 5 minutes long and inscribe a special rune … You also specify a trigger
 * that creatures must meet to activate the rune. For the duration of the spell, creatures that meet the criteria of the
 * trigger can touch the rune to hear the recorded message in their head … You know when someone is listening to the
 * message, but you don't know who's listening to it. You can Dismiss the spell." An effect with `rune: { message,
 * trigger }` (the cast's fields) posts the rune as a card everyone sees, with its trigger and a *Touch the rune* button.
 * A touch by the selected token asks the GM whether it meets the trigger; on a yes, the message is whispered to that
 * creature's players and the caster's are told someone is listening, not who. The rune lasts as long as its effect.
 */

const FLAG = "rune";

const controlled = () => canvas.tokens?.controlled?.[0]?.actor ?? game.user.character ?? null;

export const Rune = {
    /** Post the rune for the effect that carries it. */
    async post(effect, words) {
        const caster = effect.actor;
        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: caster }),
            flavor: effect.name,
            content: `<p>${t("Rune.Posted", { trigger: foundry.utils.escapeHTML(String(words.trigger ?? "")) })}</p><div class="isaacs-automation-choice"><button type="button" data-action="isaacs-automation-rune">${t("Rune.Touch")}</button></div>`,
            flags: { [LIB_ID]: { [FLAG]: { effectUuid: effect.uuid, message: String(words.message ?? ""), trigger: String(words.trigger ?? "") } } },
        });
    },

    registerHooks() {
        Hooks.on("renderChatMessageHTML", (message, html) => {
            const spec = flagOf(message, FLAG);
            if (!spec) return;
            const touch = html?.querySelector?.('[data-action="isaacs-automation-rune"]');
            if (touch && !touch.dataset.bound) {
                touch.dataset.bound = "1";
                touch.addEventListener("click", async () => {
                    const actor = controlled();
                    if (!actor) return ui.notifications.warn(t("Rune.Select"));
                    if (!fromUuidSync(spec.effectUuid)) return ui.notifications.warn(t("Rune.Gone"));
                    // Does it meet the trigger? The GM says.
                    await ChatMessage.create({
                        whisper: ChatMessage.getWhisperRecipients("GM").map((user) => user.id),
                        content: `<p>${t("Rune.Ask", { name: actor.name, trigger: foundry.utils.escapeHTML(spec.trigger) })}</p><div class="isaacs-automation-choice"><button type="button" data-action="isaacs-automation-rune-yes">${t("Rune.Yes")}</button></div>`,
                        flags: { [LIB_ID]: { [FLAG]: { ...spec, toucher: actor.uuid } } },
                    });
                });
            }
            const yes = html?.querySelector?.('[data-action="isaacs-automation-rune-yes"]');
            if (yes && !yes.dataset.bound && spec.toucher) {
                yes.dataset.bound = "1";
                yes.addEventListener("click", async () => {
                    const effect = fromUuidSync(spec.effectUuid);
                    const toucher = fromUuidSync(spec.toucher);
                    if (!effect || !toucher || !game.user.isGM) return;
                    yes.disabled = true;
                    await ChatMessage.create({ whisper: playersOf(toucher), flavor: effect.name, content: `<p>${t("Rune.Hears", { name: toucher.name })}</p><p>${foundry.utils.escapeHTML(spec.message)}</p>` });
                    await ChatMessage.create({ whisper: playersOf(effect.actor), flavor: effect.name, content: `<p>${t("Rune.Listening")}</p>` });
                });
            }
        });
    },
};
