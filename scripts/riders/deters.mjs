import { CheckPipeline } from "../lib/check-pipeline.mjs";
import { combatOf } from "../lib/combat.mjs";
import { LIB_ID } from "../id.mjs";
import { t } from "../i18n.mjs";
import { Relay } from "./relay.mjs";

/**
 * A ward that makes its attackers save first.
 *
 * *Sanctuary*: "Creatures attempting to attack the target must attempt a Will save each time." pf2e has
 * nowhere to ask that — the attack is rolled the moment it is clicked — so the check pipeline's gate asks it:
 * an attack roll (or any check with the attack trait) against a creature holding a `deters` effect first
 * rolls the attacker's save against the DC frozen on the effect when it was cast, and the attack goes ahead
 * or does not by the result:
 *
 *  - critical success: the ward ends, and the attack goes ahead;
 *  - success: this attack and the rest against the target this turn go ahead;
 *  - failure: this one is wasted, and so is every other against the target this turn;
 *  - critical failure: wasted, and no attack on the target while the ward lasts.
 *
 * "This turn" is the combat's round and turn when the save was rolled; out of combat every attack saves.
 * What each attacker earned is kept on the effect by the GM, who reads the outcome off the save's own
 * message rather than taking anyone's word for it.
 */

const PRIORITY = 50;

/** The ward on this creature, if any. */
export function deterrentOn(actor) {
    return actor?.items?.find?.((item) => item.flags?.[LIB_ID]?.deters) ?? null;
}

/** Is this check an attack? An attack roll, or a check whose action has the attack trait (a Trip, a Shove). */
export function isAttack(context) {
    if (!context || context.isReroll) return false;
    if (context.type === "attack-roll") return true;
    const traits = [...(context.traits ?? [])].map((trait) => trait?.name ?? trait);
    return traits.includes("attack") || (context.options?.has?.("trait:attack") ?? false);
}

/** The round and turn this happens in, as one key — or null outside a combat. */
export function turnKey(combat) {
    return combat?.started ? `${combat.id}:${combat.round}:${combat.turn}` : null;
}

/**
 * What the ward says to this attacker without a new save: "allow", "refuse", or "save".
 * `memo` is what the attacker earned before: `{ until: "spell" }` or `{ key, allowed }`.
 */
export function deterVerdict(memo, key) {
    if (memo?.until === "spell") return "refuse";
    if (key && memo?.key === key) return memo.allowed ? "allow" : "refuse";
    return "save";
}

/** What a save earns: what to remember, whether the attack goes ahead, and whether the ward ends. */
export function afterDeterSave(outcome, key) {
    switch (outcome) {
        case "criticalSuccess":
            return { memo: null, allowed: true, ends: true };
        case "success":
            return { memo: key ? { key, allowed: true } : null, allowed: true, ends: false };
        case "failure":
            return { memo: key ? { key, allowed: false } : null, allowed: false, ends: false };
        case "criticalFailure":
            return { memo: { until: "spell" }, allowed: false, ends: false };
        default:
            return { memo: null, allowed: true, ends: false };
    }
}

const OUTCOMES = ["criticalFailure", "failure", "success", "criticalSuccess"];

async function gate(_check, context) {
    if (!isAttack(context)) return true;
    const target = context.target?.actor;
    const ward = deterrentOn(target);
    if (!ward) return true;
    const attacker = context.origin?.actor ?? context.actor;
    // pf2e hands a check contextual clones of both creatures: compare them by uuid, never by identity.
    if (!attacker || attacker.uuid === target.uuid) return true;
    const { statistic = "will", dc, attackers = {} } = ward.flags[LIB_ID].deters;
    const key = turnKey(combatOf(attacker));
    const verdict = deterVerdict(attackers[attacker.uuid.replaceAll(".", "_")], key);
    if (verdict === "allow") return true;
    if (verdict === "refuse") {
        await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: attacker }), content: `<p>${t("Deters.Barred", { attacker: attacker.name, target: target.name, ward: ward.name })}</p>` });
        return false;
    }
    const roll = await attacker.getStatistic?.(statistic)?.roll({ dc: { value: Number(dc) || 0 }, skipDialog: true, extraRollOptions: ["deterred"], traits: [] });
    if (!roll) return true;
    const outcome = OUTCOMES[roll.degreeOfSuccess] ?? null;
    const result = afterDeterSave(outcome, key);
    const messageId = game.messages.contents.findLast((m) => m.actor?.uuid === attacker.uuid && m.flags?.pf2e?.context?.type === "saving-throw")?.id ?? null;
    await Relay.request({ action: "deterRecord", wardUuid: ward.uuid, attackerUuid: attacker.uuid, messageId, key });
    const words = result.ends ? "Deters.Ends" : result.allowed ? "Deters.Allowed" : outcome === "criticalFailure" ? "Deters.BarredForGood" : "Deters.Wasted";
    await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: attacker }), content: `<p>${t(words, { attacker: attacker.name, target: target.name, ward: ward.name })}</p>` });
    return result.allowed;
}

/** GM: remember what the save earned, read off the save's own message. */
async function deterRecord({ wardUuid, attackerUuid, messageId, key }) {
    const ward = await fromUuid(wardUuid);
    const message = game.messages.get(messageId);
    if (!ward?.flags?.[LIB_ID]?.deters || !message) return;
    if (message.actor?.uuid !== attackerUuid) return;
    const outcome = message.flags?.pf2e?.context?.outcome ?? null;
    const result = afterDeterSave(outcome, key);
    if (result.ends) {
        await ward.delete();
        return;
    }
    if (result.memo) await ward.update({ [`flags.${LIB_ID}.deters.attackers.${attackerUuid.replaceAll(".", "_")}`]: result.memo });
}

export const Deters = {
    register() {
        CheckPipeline.gate("an attacker saves against a ward", PRIORITY, gate);
        Relay.register("deterRecord", deterRecord);
    },
};
