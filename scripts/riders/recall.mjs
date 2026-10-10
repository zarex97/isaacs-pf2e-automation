import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";
import { CheckPipeline } from "../lib/check-pipeline.mjs";
import { flagOf } from "../lib/flags.mjs";
import { playersOf } from "./message.mjs";

/**
 * Knowledge recalled all at once.
 *
 * *Hypercognition*: "You can instantly use up to 6 Recall Knowledge actions as part of Casting this Spell. For these
 * actions, you can't use any special abilities, reactions, or free actions that trigger when you Recall Knowledge."
 * `{ type: "recall", count }` whispers the caster a card holding `count` Recall Knowledge checks, at no action: a skill
 * to pick — the Recall Knowledge skills and every Lore — and a button that rolls it, secretly, as pf2e rolls the
 * action. The card counts them down and closes at none.
 *
 * Those checks carry the `hypercognition` roll option, and a check stage strips from them every roll note that
 * answers a Recall Knowledge — a feat's "when you Recall Knowledge" (pf2e writes those as notes predicated on
 * `action:recall-knowledge`). What a Recall Knowledge is worth stays: a modifier is not something that triggers.
 */

const FLAG = "recall";
const OPTION = "hypercognition";
const SKILLS = ["arcana", "crafting", "medicine", "nature", "occultism", "religion", "society"];

/** The skills a creature can Recall Knowledge with: the usual seven and its Lores. */
export function recallSkills(skills) {
    return Object.entries(skills ?? {})
        .filter(([slug, statistic]) => SKILLS.includes(slug) || statistic?.lore === true || slug.endsWith("-lore"))
        .map(([slug, statistic]) => ({ slug, label: statistic?.label ?? slug }));
}

/** Does a roll note answer a Recall Knowledge? */
export function triggeredByRecall(note) {
    return JSON.stringify(note?.predicate ?? []).includes("action:recall-knowledge");
}

function hasOption(context) {
    const options = context?.options;
    return options instanceof Set ? options.has(OPTION) : Array.isArray(options) && options.includes(OPTION);
}

function card(actor, left) {
    const options = recallSkills(actor.skills).map(({ slug, label }) => `<option value="${slug}">${foundry.utils.escapeHTML(label)}</option>`).join("");
    return `<p>${t("Recall.Left", { left })}</p>`
        + `<div class="isaacs-automation-choice"><select name="skill">${options}</select>`
        + `<button type="button" data-action="isaacs-automation-recall"${left > 0 ? "" : " disabled"}>${t("Recall.Roll")}</button></div>`;
}

export async function offerRecall(rider, context) {
    const actor = context.originActor;
    if (!actor) return;
    const left = Math.max(1, Number(rider.apply.count) || 6);
    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        whisper: playersOf(actor),
        flavor: context.item?.name ?? t("Recall.Title"),
        content: card(actor, left),
        flags: { [LIB_ID]: { [FLAG]: { actorUuid: actor.uuid, left } } },
    });
}

export const Recall = {
    register() {
        CheckPipeline.before("notes a recall knowledge would trigger", 42, (_check, context) => {
            if (!hasOption(context) || !Array.isArray(context.notes)) return;
            for (let i = context.notes.length - 1; i >= 0; i--) if (triggeredByRecall(context.notes[i])) context.notes.splice(i, 1);
        });
    },

    registerHooks() {
        Hooks.on("renderChatMessageHTML", (message, html) => {
            const spec = flagOf(message, FLAG);
            const button = spec && html?.querySelector?.('[data-action="isaacs-automation-recall"]');
            if (!button || button.dataset.bound) return;
            button.dataset.bound = "1";
            button.addEventListener("click", async () => {
                const actor = await fromUuid(spec.actorUuid);
                const left = Number(flagOf(message, FLAG)?.left) || 0;
                const slug = html.querySelector('select[name="skill"]')?.value;
                const statistic = actor?.skills?.[slug];
                if (!statistic || left <= 0 || !actor.isOwner) return;
                button.disabled = true;
                await message.update({ [`flags.${LIB_ID}.${FLAG}.left`]: left - 1, content: card(actor, left - 1) });
                await statistic.roll({
                    label: t("Recall.Check", { skill: statistic.label }),
                    extraRollOptions: ["action:recall-knowledge", OPTION],
                    traits: ["concentrate", "secret"],
                    rollMode: "blindroll",
                    skipDialog: true,
                });
            });
        });
    },
};
