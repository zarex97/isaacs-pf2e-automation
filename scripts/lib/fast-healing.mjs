import { LIB_ID } from "../id.mjs";
import { DamageBus } from "./damage-bus.mjs";
import { t } from "../i18n.mjs";

/**
 * Fast healing and regeneration, applied.
 *
 * pf2e rolls them at the start of a creature's turn — *Regenerate*'s "restores 15 Hit Points to it at the
 * start of each of its turns" — and posts the roll for someone to apply. Nothing marks that message but its
 * own words, "Received regeneration", so it is recognised by pf2e's own string in the current language and
 * applied to the creature that received it. Once: the message is stamped when applied. Active GM only.
 */

const KINDS = ["fast-healing", "regeneration"];

/** pf2e's "Received …" line for each kind, as the current language says it. */
export function receivedLines(localize) {
    return KINDS.map((kind) => localize(`PF2E.Encounter.Broadcast.FastHealing.${kind}.ReceivedMessage`)).filter((s) => s && !s.startsWith("PF2E."));
}

/**
 * Does this damage switch the creature's regeneration off? *Regenerate*: "If the target takes acid or fire damage,
 * its regeneration deactivates until after the end of its next turn" — the types are the rule's own
 * `deactivatedBy`, which pf2e prints as a reminder and does not act on.
 */
export function deactivates(damageTypes, regenerationRules) {
    const off = new Set(regenerationRules.flatMap((rule) => rule.deactivatedBy ?? []));
    return damageTypes.some((type) => off.has(type));
}

/** Is this pf2e's fast healing or regeneration message? */
export function isTurnHealing(flavor, lines) {
    const text = String(flavor ?? "").replace(/<[^>]+>/g, " ");
    return lines.some((line) => text.includes(line));
}

/** Does an effect on the creature take away its fast healing and regeneration? Returns that effect. */
export function healingWithheldBy(actor) {
    return actor?.items?.find?.((item) => item.flags?.[LIB_ID]?.noTurnHealing) ?? null;
}

export const FastHealing = {
    registerHooks() {
        // Acid or fire switches regeneration off for the next turn start that comes.
        DamageBus.after("regeneration switched off", 86, async (actor, params) => {
            if (game.users?.activeGM?.id !== game.user?.id) return;
            const rules = (actor?.rules ?? []).filter((rule) => rule.key === "FastHealing" && rule.type === "regeneration" && !rule.ignored);
            if (rules.length === 0) return;
            const types = [...(params?.damage?.instances ?? [])].map((instance) => instance.type).filter(Boolean);
            if (deactivates(types, rules)) await actor.setFlag(LIB_ID, "regenerationOff", true);
        });
        Hooks.on("createChatMessage", async (message) => {
            if (game.users?.activeGM?.id !== game.user?.id) return;
            if (message.flags?.[LIB_ID]?.healingApplied) return;
            if (!isTurnHealing(message.flavor, receivedLines((key) => game.i18n.localize(key)))) return;
            const roll = message.rolls?.find((r) => r.kinds?.has?.("healing")) ?? message.rolls?.[0];
            const actor = message.actor;
            const total = Number(roll?.total) || 0;
            if (!actor || total <= 0) return;
            await message.setFlag(LIB_ID, "healingApplied", true);
            const withheld = healingWithheldBy(actor);
            if (withheld) {
                await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<p>${t("FastHealing.Withheld", { actor: actor.name, name: withheld.name })}</p>` });
                return;
            }
            // The turn start after acid or fire: no regeneration this time.
            if (actor.getFlag(LIB_ID, "regenerationOff") && isTurnHealing(message.flavor, receivedLines((key) => game.i18n.localize(key)).slice(1))) {
                await actor.unsetFlag(LIB_ID, "regenerationOff");
                await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<p>${t("FastHealing.Off", { actor: actor.name })}</p>` });
                return;
            }
            await actor.applyDamage({ damage: -total, token: message.token ?? actor.getActiveTokens(true, true).at(0) ?? null, skipIWR: true });
        });
    },
};
