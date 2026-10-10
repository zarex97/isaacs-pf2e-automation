import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";
import { flagOf } from "../lib/flags.mjs";

/**
 * Words passed from mind to mind.
 *
 * *Mindlink*: "You link your mind to the target's mind and mentally impart to that target an amount of information".
 * *Sending*: "You send the creature a mental message of 25 words or fewer, and it can respond immediately with its own
 * message of 25 words or fewer." `{ type: "message", flag, words, reply }` whispers what the caster wrote as the spell
 * was cast (`castChoice`) to the target's players and the GM, cut to `words`; with `reply`, the card carries a button
 * that lets them answer once, in as many words, back to the caster. `to` names the recipient instead of a target: the
 * cast's own field holding an actor's name — a creature you know well need not be on this scene.
 *
 * *Telepathic Bond*: "The targets can communicate telepathically with any or all of the other targets". An effect with
 * `telepathy: true` names everyone the cast reached; its holder is given an action that asks for words and whispers
 * them to the others' players. The action goes with the effect.
 */

const FLAG = "message";
const ACTION = "telepathyAction";

/** The words, cut to at most `limit` of them. */
export function cutTo(text, limit) {
    const words = String(text ?? "").trim().split(/\s+/).filter(Boolean);
    return Number(limit) > 0 ? words.slice(0, Number(limit)).join(" ") : words.join(" ");
}

/** The users an actor speaks to: its players, and the GMs. */
export function playersOf(actor) {
    const owners = Object.entries(actor?.ownership ?? {}).filter(([id, level]) => id !== "default" && level >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER).map(([id]) => id);
    return [...new Set([...owners, ...ChatMessage.getWhisperRecipients("GM").map((user) => user.id)])];
}

async function ask(title, words) {
    const data = await foundry.applications.api.DialogV2.input({
        window: { title },
        content: `<p>${t(words ? "Message.Words" : "Message.Prompt", { words })}</p><div class="form-group"><input type="text" name="text"></div>`,
        rejectClose: false,
    });
    return data?.text ? cutTo(data.text, words) : null;
}

export async function sendMessage(rider, context, chosen = {}) {
    if (rider.apply.toGm) return askGm(rider, context, chosen);
    const from = context.originActor;
    const named = rider.apply.to ? chosen[rider.apply.to] : null;
    const to = (named ? game.actors?.getName?.(String(named).trim()) : null) ?? context.actor;
    const text = cutTo(chosen[rider.apply.flag ?? "message"], rider.apply.words);
    if (!from || !to || !text) {
        context.notes.push(t("Message.Nobody"));
        return;
    }
    const reply = rider.apply.reply ? `<div class="isaacs-automation-choice"><button type="button" data-action="isaacs-automation-reply">${t("Message.Reply")}</button></div>` : "";
    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: from }),
        whisper: playersOf(to),
        flavor: t("Message.To", { from: from.name, to: to.name }),
        content: `<p>${foundry.utils.escapeHTML(text)}</p>${reply}`,
        flags: { [LIB_ID]: { [FLAG]: { fromUuid: from.uuid, toUuid: to.uuid, words: rider.apply.words ?? null, reply: !!rider.apply.reply } } },
    });
}

/**
 * *Read Omens*: "Choose a particular goal or activity you plan to engage in within 1 week … You learn a cryptic clue or
 * piece of advice that could help with the chosen event". `toGm: true` whispers what the cast chose to the GMs alone,
 * with a button that whispers their answer back to the caster's players.
 */
async function askGm(rider, context, chosen) {
    const from = context.originActor;
    const text = cutTo(chosen[rider.apply.flag ?? "message"], rider.apply.words);
    if (!from || !text) {
        context.notes.push(t("Message.Nobody"));
        return;
    }
    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: from }),
        whisper: ChatMessage.getWhisperRecipients("GM").map((user) => user.id),
        flavor: t("Message.AsksGm", { from: from.name, spell: context.item?.name ?? "" }),
        content: `<p>${foundry.utils.escapeHTML(text)}</p><div class="isaacs-automation-choice"><button type="button" data-action="isaacs-automation-reply">${t("Message.Answer")}</button></div>`,
        flags: { [LIB_ID]: { [FLAG]: { fromUuid: from.uuid, toUuid: null, words: null, reply: true, spell: context.item?.name ?? null } } },
    });
}

export const Message = {
    /** Give a telepathy effect's holder its action. */
    async grantTelepathy(effect) {
        if (!effect?.actor) return;
        await effect.actor.createEmbeddedDocuments("Item", [{
            type: "action",
            name: t("Message.Telepathy", { name: effect.name }),
            img: "icons/magic/perception/eye-ringed-glow-angry-small-teal.webp",
            system: { actionType: { value: "free" }, actions: { value: null }, traits: { value: ["mental"] }, description: { value: `<p>${t("Message.TelepathyHint")}</p>` } },
            flags: { [LIB_ID]: { [ACTION]: effect.uuid, withEffect: effect.uuid } },
        }]);
    },

    registerHooks() {
        // The reply, from the client of whoever clicks it.
        Hooks.on("renderChatMessageHTML", (message, html) => {
            const spec = flagOf(message, FLAG);
            const button = spec?.reply && html?.querySelector?.('[data-action="isaacs-automation-reply"]');
            if (!button || button.dataset.bound) return;
            button.dataset.bound = "1";
            button.addEventListener("click", async () => {
                // A question to the GMs is answered by whoever is GM, not by a creature.
                const to = spec.toUuid ? await fromUuid(spec.toUuid) : null;
                const from = await fromUuid(spec.fromUuid);
                const text = await ask(t(spec.toUuid ? "Message.Reply" : "Message.Answer"), spec.words);
                if (!text || (spec.toUuid && !to) || !from) return;
                button.disabled = true;
                await ChatMessage.create({
                    speaker: to ? ChatMessage.getSpeaker({ actor: to }) : { alias: spec.spell ?? game.user.name },
                    whisper: playersOf(from),
                    flavor: to ? t("Message.To", { from: to.name, to: from.name }) : t("Message.Answered", { to: from.name }),
                    content: `<p>${foundry.utils.escapeHTML(text)}</p>`,
                });
            });
        });
        // Telepathy: the holder's own action, used on the client that used it.
        Hooks.on("createChatMessage", async (message, _options, userId) => {
            if (userId !== game.user?.id) return;
            const effectUuid = message.item?.flags?.[LIB_ID]?.[ACTION];
            if (!effectUuid) return;
            const effect = await fromUuid(effectUuid);
            const bond = (effect?.flags?.[LIB_ID]?.telepathy?.bond ?? []).filter((uuid) => uuid !== message.actor?.uuid);
            const others = (await Promise.all(bond.map((uuid) => fromUuid(uuid).catch(() => null)))).filter(Boolean);
            if (others.length === 0) return;
            const text = await ask(effect.name, null);
            if (!text) return;
            await ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor: message.actor }),
                whisper: [...new Set(others.flatMap(playersOf))],
                flavor: t("Message.To", { from: message.actor.name, to: others.map((a) => a.name).join(", ") }),
                content: `<p>${foundry.utils.escapeHTML(text)}</p>`,
            });
        });
    },
};
