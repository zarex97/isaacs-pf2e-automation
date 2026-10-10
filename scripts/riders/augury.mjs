import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";
import { flagOf } from "../lib/flags.mjs";
import { playersOf } from "./message.mjs";

/**
 * A glimpse of what a course of action brings.
 *
 * *Augury*: "ask about the results of a particular course of action … reveal the GM's best guess among the following
 * outcomes: good, bad, mixed … and nothing … The GM rolls a secret flat. On a failure, the result is always 'nothing.' …
 * If anyone asks about the same topic as the first casting of augury during an additional casting, the GM uses the
 * secret roll result from the first casting." `{ type: "augury", flag, dc }` rolls the DC `dc` flat check for the GMs
 * alone — or, for a question already asked, takes that first roll — and whispers the GMs the question with four answer
 * buttons; on a failed flat check only *nothing* is offered. The answer chosen is whispered to the caster's players.
 */

const FLAG = "augury";
const ANSWERS = { good: "Augury.Good", bad: "Augury.Bad", mixed: "Augury.Mixed", nothing: "Augury.Nothing" };

/** A question as a topic: its words, without case or punctuation. */
export function topicOf(question) {
    return String(question ?? "").toLowerCase().replace(/[^a-z0-9 ]+/g, "").replace(/\s+/g, " ").trim();
}

export async function augury(rider, context, chosen = {}) {
    const caster = context.originActor;
    const question = String(chosen[rider.apply.flag ?? "question"] ?? "").trim();
    if (!caster || !question) return;
    const gms = ChatMessage.getWhisperRecipients("GM").map((user) => user.id);
    const topic = topicOf(question);
    const kept = game.settings.get(LIB_ID, "auguries") ?? {};
    let passed = kept[topic];
    if (passed === undefined) {
        const roll = await new Roll("1d20").evaluate();
        passed = roll.total >= (Number(rider.apply.dc) || 6);
        await roll.toMessage({ flavor: t("Augury.Flat", { dc: Number(rider.apply.dc) || 6 }), whisper: gms, blind: true }, { rollMode: "blindroll" });
        if (game.user.isGM) await game.settings.set(LIB_ID, "auguries", { ...kept, [topic]: passed });
    }
    const offered = passed ? Object.keys(ANSWERS) : ["nothing"];
    await ChatMessage.create({
        whisper: gms,
        speaker: ChatMessage.getSpeaker({ actor: caster }),
        flavor: context.item?.name ?? "",
        content: `<p>${t(passed ? "Augury.Asked" : "Augury.Failed", { actor: caster.name, question: foundry.utils.escapeHTML(question) })}</p><div class="isaacs-automation-choice">${offered.map((a) => `<button type="button" data-action="isaacs-automation-augury" data-answer="${a}">${t(ANSWERS[a])}</button>`).join(" ")}</div>`,
        flags: { [LIB_ID]: { [FLAG]: { casterUuid: caster.uuid, question } } },
    });
}

export const Augury = {
    registerSettings() {
        game.settings.register(LIB_ID, "auguries", { scope: "world", config: false, type: Object, default: {} });
    },

    registerHooks() {
        Hooks.on("renderChatMessageHTML", (message, html) => {
            const spec = flagOf(message, FLAG);
            if (!spec) return;
            for (const button of html.querySelectorAll?.('[data-action="isaacs-automation-augury"]') ?? []) {
                if (button.dataset.bound) continue;
                button.dataset.bound = "1";
                button.addEventListener("click", async () => {
                    const caster = fromUuidSync(spec.casterUuid);
                    if (!caster || !game.user.isGM) return;
                    await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: caster }), whisper: playersOf(caster), flavor: t("Augury.Title"), content: `<p>${t("Augury.Answer", { question: foundry.utils.escapeHTML(spec.question), answer: t(ANSWERS[button.dataset.answer]) })}</p>` });
                });
            }
        });
    },
};
