import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";
import { CheckPipeline } from "../lib/check-pipeline.mjs";

/**
 * One creature that cannot observe another.
 *
 * *Blinding Fury*: "The target can't Observe you until the end of its turn, and if you're currently observed by it,
 * you become Hidden to it." pf2e's hidden is a condition on the hidden creature, for everyone at once; this is one
 * pair. The watcher carries an effect naming the creature it cannot observe (`unobserves`, a token uuid). Its attacks
 * on that creature first need the hidden creature's DC 11 flat check — a failure loses the attack — and that
 * creature's attacks find it off-guard (–2 to its AC), as a creature is to one hidden from it.
 *
 * `unobserve`: `watcher` and `hidden` each name a creature of the rider's context — `"origin"` or `"target"`.
 * `onlyEffectOrigin`: only when `hidden` is the creature that gave the effect carrying this rider (*Blinding Fury*'s
 * failure: "every time the target damages you").
 */

const FLAG = "unobserves";

/** The token a context names. */
function tokenOf(context, which) {
    if (which === "origin") return context.originToken ?? context.originActor?.getActiveTokens?.(true, true)?.[0] ?? null;
    return context.target?.document ?? context.target ?? null;
}

/** Does this actor carry an effect that keeps it from observing that token? */
export function cannotObserve(actor, tokenUuid) {
    if (!actor || !tokenUuid) return false;
    return (actor.itemTypes?.effect ?? []).some((e) => e.flags?.[LIB_ID]?.[FLAG] === tokenUuid);
}

export const Unobserved = {
    async apply(rider, context) {
        const watcherToken = tokenOf(context, rider.apply.watcher ?? "target");
        const hiddenToken = tokenOf(context, rider.apply.hidden ?? "origin");
        const watcher = watcherToken?.actor;
        if (!watcher || !hiddenToken?.uuid || watcher === hiddenToken.actor) return;
        if (rider.apply.onlyEffectOrigin) {
            const origin = context.riderItem?.system?.context?.origin?.actor;
            if (!origin || origin !== hiddenToken.actor?.uuid) return;
        }
        const name = t("Unobserved.Name", { watcher: watcher.name, hidden: hiddenToken.name });
        // "Until the end of its turn": the turn it is in, when the damage was its own.
        const duration = rider.duration ?? { value: 0, unit: "rounds", expiry: "turn-end" };
        const [created] = await watcher.createEmbeddedDocuments("Item", [{
            type: "effect",
            name,
            img: context.item?.img ?? "icons/svg/blind.svg",
            system: {
                duration: { value: Number(duration.value) || 0, unit: duration.unit ?? "rounds", expiry: duration.expiry ?? "turn-end", sustained: false },
                tokenIcon: { show: true },
                rules: [],
            },
            flags: { [LIB_ID]: { [FLAG]: hiddenToken.uuid } },
        }]);
        if (created) context.created?.push(created.id);
        context.notes?.push(t("Unobserved.Note", { watcher: watcher.name, hidden: hiddenToken.name }));
    },

    register() {
        // An attack on a creature it cannot observe: the hidden creature's DC 11 flat check first.
        CheckPipeline.gate("an attack on a creature it can't observe", 20, async (_check, context) => {
            if (context?.type !== "attack-roll") return true;
            const attacker = (context.origin?.actor ?? context.actor);
            const target = context.target?.token;
            if (!cannotObserve(attacker, target?.uuid)) return true;
            const roll = await new Roll("1d20").evaluate();
            const passed = roll.total >= 11;
            await roll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor: attacker }),
                flavor: t(passed ? "Unobserved.FlatPassed" : "Unobserved.FlatFailed", { attacker: attacker.name, hidden: target.name }),
            });
            return passed;
        });
        // …and that creature's own attacks find it off-guard.
        CheckPipeline.before("off-guard to a creature it can't observe", 31, (_check, context) => {
            if (context?.type !== "attack-roll" || !context.dc?.value) return;
            const attackerToken = context.origin?.token ?? context.token;
            const defender = context.target?.actor;
            if (!cannotObserve(defender, attackerToken?.uuid)) return;
            const label = t("Unobserved.OffGuard", { name: defender.name });
            return { ...context, dc: { ...context.dc, value: context.dc.value - 2, ...(context.dc.label ? { label: `${context.dc.label} (–2 ${label})` } : {}) } };
        });
    },
};
