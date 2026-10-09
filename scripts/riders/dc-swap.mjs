import { CheckPipeline } from "../lib/check-pipeline.mjs";
import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";
import { flagOf } from "../lib/flags.mjs";
import { RiderExtensions } from "./extensions.mjs";
import { Relay } from "./relay.mjs";
import { counteracts } from "./tether.mjs";

/**
 * A DC its holder may set by another statistic, and a creature that is hard to move.
 *
 * *Bracing Tendrils*: "Whenever you're on the ground and a creature or effect attempts to forcibly move you from your
 * space, you can use your spell DC in place of your Fortitude DC as the DC of the check to move you." An effect carries
 * `dcSwap: { actions, dc, rank, anchors }` — the actions it answers, the DC it offers and the rank it was cast at,
 * frozen when it was made (`apply.mjs`). A check against its holder by one of those actions rolls against that DC when
 * it is the higher: "can use" is a choice nobody makes for the lower one.
 *
 * `anchors` goes on: "If a creature wouldn't normally need a check to move you, it must succeed at an appropriate check
 * (usually an Athletics check for physical movement) against your spell DC or you are unmoved; if an effect wouldn't
 * normally need a check to move you, it must counteract bracing tendrils or you are unmoved." Before this module moves
 * the holder by someone else's push, pull or teleport (`Anchor.holds`), a spell's caster counteracts the tendrils and
 * anything else rolls its creature's Athletics. "When a creature fails to move you in this way, you can choose to have
 * the tendrils lash back and push them 5 feet away from you": a failed move, or a failed Shove or Reposition, whispers
 * the holder a button that does.
 */

const FLAG = "dcSwap";
const DEGREES = ["criticalFailure", "failure", "success", "criticalSuccess"];
const LASH = "lashBack";

/** The DC a check should face instead, or null: the swap's, when it answers the action and is higher. */
export function swappedDc(current, swap, options) {
    if (!swap || !Number.isFinite(Number(swap.dc)) || !Number.isFinite(current)) return null;
    const answers = (swap.actions ?? []).some((action) => options.has(`action:${action}`));
    return answers && Number(swap.dc) > current ? Number(swap.dc) : null;
}

/** Does a move by this check stand? A spell counteracts the anchor; anything else needs a success. */
export function moves({ spell, outcome, rank, anchorRank }) {
    if (spell) return counteracts(outcome, rank, anchorRank);
    return outcome === "success" || outcome === "criticalSuccess";
}

const swapOf = (actor) => (actor?.itemTypes?.effect ?? []).find((e) => e.flags?.[LIB_ID]?.[FLAG]) ?? null;
const tokenOf = (actor) => actor?.getActiveTokens?.(true, true).find((t) => t.parent === canvas?.scene) ?? null;

/** Whisper the holder a button that pushes the creature that failed 5 feet away. */
async function offerLashBack(holder, mover) {
    const holderToken = tokenOf(holder);
    const moverToken = mover?.document ?? tokenOf(mover?.actor ?? mover);
    if (!holderToken || !moverToken) return;
    const owners = Object.entries(holder.ownership ?? {}).filter(([id, level]) => id !== "default" && level >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER).map(([id]) => id);
    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: holder }),
        whisper: [...new Set([...owners, ...ChatMessage.getWhisperRecipients("GM").map((user) => user.id)])],
        content: `<p>${t("Anchor.LashPrompt", { actor: holder.name, mover: moverToken.name })}</p>`
            + `<div class="isaacs-automation-choice"><button type="button" data-action="isaacs-automation-lash-back">${t("Anchor.LashButton", { mover: moverToken.name })}</button></div>`,
        flags: { [LIB_ID]: { [LASH]: { holderUuid: holderToken.uuid, moverUuid: moverToken.uuid } } },
    });
}

/** GM: the tendrils push the creature 5 feet away from their holder. */
async function lashBack({ holderUuid, moverUuid }) {
    const holder = await fromUuid(holderUuid);
    const mover = await fromUuid(moverUuid);
    if (!holder?.actor || !mover?.actor) return;
    const { applyRiderList, postNotes } = await import("./apply.mjs");
    const context = { actor: mover.actor, originActor: holder.actor, originToken: holder, item: null, target: mover, eventTarget: mover,
        adjustments: [], notes: [], prompts: [], choices: [], moves: [] };
    await applyRiderList([{ apply: { type: "teleport", distance: 5 } }], context);
    await postNotes({ notes: context.notes, item: swapOf(holder.actor), originActor: holder.actor, actor: mover.actor, outcome: null });
}

export const Anchor = {
    /** Before someone else's effect moves `context.actor`: true when the tendrils keep it where it is. */
    async holds(context, item) {
        const actor = context?.actor;
        const effect = swapOf(actor);
        const spec = effect?.flags?.[LIB_ID]?.[FLAG];
        const mover = context?.originActor;
        if (!spec?.anchors || !mover || mover === actor) return false;
        const spell = item?.type === "spell";
        const statistic = spell ? RiderExtensions.statistic(mover, "spellcasting") : mover.skills?.athletics;
        if (!statistic || !Number.isFinite(Number(spec.dc))) return false;
        const roll = await statistic.roll({ dc: { value: Number(spec.dc) }, skipDialog: true, label: t(spell ? "Anchor.Counteract" : "Anchor.Athletics", { name: effect.name }), ...(spell ? { extraRollOptions: [`${LIB_ID}:counteract`] } : {}) });
        const outcome = DEGREES[roll?.degreeOfSuccess ?? -1];
        const held = !moves({ spell, outcome, rank: Number(item?.rank) || 1, anchorRank: Number(spec.rank) || 1 });
        await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<p>${t(held ? "Anchor.Held" : "Anchor.Moved", { actor: actor.name, name: effect.name })}</p>` });
        if (held) await offerLashBack(actor, context.originToken ?? mover);
        return held;
    },

    register() {
        CheckPipeline.before("a DC its holder sets another way", 36, (_check, context) => {
            const target = context?.target?.actor;
            if (!target || typeof context.dc?.value !== "number") return;
            const effect = swapOf(target);
            if (!effect) return;
            const options = context.options instanceof Set ? context.options : new Set(context.options ?? []);
            const dc = swappedDc(context.dc.value, effect.flags[LIB_ID][FLAG], options);
            if (dc === null) return;
            const label = t("DcSwap.Label", { name: effect.name });
            return { ...context, dc: { ...context.dc, value: dc, ...(context.dc.label ? { label: `${context.dc.label} (${label})` } : {}) } };
        });

        // A Shove or a Reposition that failed against an anchored creature: the lash back is offered. Active GM only.
        Hooks.on("createChatMessage", async (message) => {
            if (game.users?.activeGM?.id !== game.user?.id) return;
            const context = message.flags?.pf2e?.context;
            if (context?.type !== "skill-check" || !["failure", "criticalFailure"].includes(context.outcome)) return;
            const target = context.target?.actor ? await fromUuid(context.target.actor).catch(() => null) : null;
            const spec = swapOf(target)?.flags?.[LIB_ID]?.[FLAG];
            const options = new Set(context.options ?? []);
            if (!spec?.anchors || !(spec.actions ?? []).some((action) => options.has(`action:${action}`))) return;
            await offerLashBack(target, message.token ?? message.actor);
        });

        Relay.register("lashBack", lashBack);
        Hooks.on("renderChatMessageHTML", (message, html) => {
            const spec = flagOf(message, LASH);
            const button = spec && html?.querySelector?.('[data-action="isaacs-automation-lash-back"]');
            if (!button || button.dataset.bound) return;
            button.dataset.bound = "1";
            button.addEventListener("click", async () => {
                button.disabled = true;
                await Relay.request({ action: "lashBack", ...spec });
            });
        });
    },
};

export const DcSwap = Anchor;
