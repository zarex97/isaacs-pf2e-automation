import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";
import { flagOf } from "../lib/flags.mjs";
import { Relay } from "./relay.mjs";

/**
 * A voice thrown.
 *
 * *Ventriloquism*: "Whenever you speak or make any other sound vocally, you can make your vocalization seem to originate
 * from somewhere else within 60 feet, and you can change that apparent location freely as you vocalize. Any creature that
 * hears the sound can attempt to disbelieve your illusion." An effect carries `ventriloquism: { dc, rank }` and gives its
 * holder an action, *Throw your voice*: with a creature or object targeted within 60 feet, the voice comes from there,
 * and the holder's chat bubbles appear over it instead. At 1st rank, each thrown bubble whispers the GM a button for
 * every creature within 60 feet of the voice, to roll its Perception against the spell DC, once. "Heightened (2nd) …
 * Before a creature can attempt to disbelieve your illusion, it must actively attempt a Perception check": then no card,
 * and a creature's own Perception check within 60 feet of the voice is its attempt.
 */

const FLAG = "ventriloquism";
const ACTION = "throwVoice";
const RANGE = 60;
let relaying = false;

const isGM = () => game.users?.activeGM?.id === game.user?.id;
const feetBetween = (a, b) => (typeof a?.distanceTo === "function" ? a.distanceTo(b) : Infinity);
const effectOf = (actor) => (actor?.itemTypes?.effect ?? []).find((e) => e.flags?.[LIB_ID]?.[FLAG]) ?? null;

/** Who can still try to disbelieve: not the speaker, not those who tried, within reach of the voice. */
export function hearers(tokens, { voice, speaker, tried = [], feet = RANGE }) {
    return tokens.filter((token) => token.actor && token !== speaker && token.actor !== speaker?.actor && !tried.includes(token.actor.uuid) && feetBetween(voice, token) <= feet);
}

async function attempt(effect, token) {
    const spec = effect.flags[LIB_ID][FLAG];
    if ((spec.tried ?? []).includes(token.actor.uuid)) return;
    await effect.update({ [`flags.${LIB_ID}.${FLAG}.tried`]: [...(spec.tried ?? []), token.actor.uuid] });
    const roll = await token.actor.perception.roll({ dc: { value: Number(spec.dc) }, skipDialog: true, label: t("Ventriloquism.Check", { name: effect.name }) });
    const sees = (roll?.degreeOfSuccess ?? 0) >= 2;
    await ChatMessage.create({ whisper: ChatMessage.getWhisperRecipients("GM").map((u) => u.id), content: `<p>${t(sees ? "Ventriloquism.Sees" : "Ventriloquism.Fooled", { actor: token.name, speaker: effect.actor.name })}</p>` });
}

export const Ventriloquism = {
    /** Give the holder its action. */
    async grant(effect) {
        if (!effect?.actor) return;
        await effect.actor.createEmbeddedDocuments("Item", [{
            type: "action",
            name: t("Ventriloquism.Throw"),
            img: "icons/skills/toxins/cup-goblet-poisoned-spilled.webp",
            system: { actionType: { value: "free" }, actions: { value: null }, traits: { value: ["illusion"] }, description: { value: `<p>${t("Ventriloquism.ThrowHint")}</p>` } },
            flags: { [LIB_ID]: { [ACTION]: effect.uuid, withEffect: effect.uuid } },
        }]);
    },

    registerHooks() {
        // Throw your voice: the token targeted, within 60 feet, is where it comes from now.
        Hooks.on("createChatMessage", async (message, _options, userId) => {
            if (userId !== game.user?.id) return;
            const effectUuid = message.item?.flags?.[LIB_ID]?.[ACTION];
            if (!effectUuid) return;
            const effect = await fromUuid(effectUuid);
            const speaker = message.token?.object ?? effect?.actor?.getActiveTokens?.()?.[0];
            const voice = [...(game.user.targets ?? [])][0];
            if (!effect || !speaker || !voice || voice === speaker || feetBetween(speaker, voice) > RANGE) {
                ui.notifications.warn(t("Ventriloquism.Range"));
                return;
            }
            await Relay.request({ action: "ventriloquismVoice", effectUuid, voiceUuid: voice.document.uuid });
        });
        Relay.register("ventriloquismVoice", async ({ effectUuid, voiceUuid }) => {
            const effect = await fromUuid(effectUuid);
            if (effect) await effect.update({ [`flags.${LIB_ID}.${FLAG}.voice`]: voiceUuid });
        });

        // Its bubbles come from the voice, on every client.
        Hooks.on("chatBubbleHTML", (token, _html, message, options) => {
            if (relaying) return true;
            const effect = effectOf(token?.actor);
            const voice = effect ? fromUuidSync(effect.flags[LIB_ID][FLAG].voice ?? "")?.object : null;
            if (!voice || voice === token) return true;
            relaying = true;
            canvas.hud.bubbles.say(voice, message, options).finally(() => { relaying = false; });
            if (isGM() && Number(effect.flags[LIB_ID][FLAG].rank) < 2) Ventriloquism.offer(effect, voice, token);
            return false;
        });

        // The GM's buttons.
        Hooks.on("renderChatMessageHTML", (message, html) => {
            const spec = flagOf(message, FLAG);
            if (!spec || !html?.querySelectorAll) return;
            for (const button of html.querySelectorAll('[data-action="isaacs-automation-disbelieve"]')) {
                if (button.dataset.bound) continue;
                button.dataset.bound = "1";
                button.addEventListener("click", async () => {
                    button.disabled = true;
                    const effect = await fromUuid(spec.effectUuid);
                    const token = await fromUuid(button.dataset.token);
                    if (effect && token?.object) await attempt(effect, token.object);
                });
            }
        });

        // From 2nd rank, a Perception check within 60 feet of the voice is the attempt.
        Hooks.on("createChatMessage", async (message) => {
            if (!isGM() || message.flags?.pf2e?.context?.type !== "perception-check") return;
            const token = message.token?.object;
            if (!token) return;
            for (const placeable of canvas.tokens.placeables) {
                const effect = effectOf(placeable.actor);
                const spec = effect?.flags?.[LIB_ID]?.[FLAG];
                if (!spec || Number(spec.rank) < 2) continue;
                const voice = fromUuidSync(spec.voice ?? "")?.object;
                if (voice && hearers([token], { voice, speaker: placeable, tried: spec.tried }).length > 0) await attempt(effect, token);
            }
        });
    },

    async offer(effect, voice, speaker) {
        const spec = effect.flags[LIB_ID][FLAG];
        const near = hearers(canvas.tokens.placeables, { voice, speaker, tried: spec.tried });
        if (near.length === 0) return;
        await ChatMessage.create({
            whisper: ChatMessage.getWhisperRecipients("GM").map((u) => u.id),
            content: `<p>${t("Ventriloquism.Offer", { speaker: speaker.name, voice: voice.name })}</p><div class="isaacs-automation-choice">`
                + near.map((token) => `<button type="button" data-action="isaacs-automation-disbelieve" data-token="${token.document.uuid}">${foundry.utils.escapeHTML(token.name)}</button>`).join(" ") + "</div>",
            flags: { [LIB_ID]: { [FLAG]: { effectUuid: effect.uuid } } },
        });
    },
};
