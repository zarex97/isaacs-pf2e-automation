import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";

/**
 * Effects a hostile act between two particular creatures ends.
 *
 * *Bind Undead*: "If you or an ally uses any hostile actions against the target, the spell ends." An effect with
 * `endsOnHostileFrom` ends when its caster, or one of the caster's allies, uses a hostile action against its holder.
 * *Fated Healing*: "If a target uses a hostile action against the other target, the spell ends for the target that
 * used the hostile action." One with `endsOnHostileTo` ends when its holder uses one against the creature it is linked
 * to (`link`). A hostile action: an attack or a damage roll at the creature, or an action or spell that targets it and
 * carries a save, an attack or damage.
 */

const FROM = "endsOnHostileFrom";
const TO = "endsOnHostileTo";

/** Is this message a hostile act? Its kind, and whether it was an item aimed with a save, an attack or damage. */
export function hostileKind(type, item) {
    if (type === "attack-roll" || type === "damage-roll") return true;
    if (!item) return false;
    const traits = item.system?.traits?.value ?? [];
    return !!item.system?.defense?.save || !!item.system?.defense?.passive || traits.includes("attack") || Object.keys(item.system?.damage ?? {}).length > 0;
}

/** The creatures a message acted on: its own target, else what its user had targeted. */
function victims(message) {
    const own = message.flags?.pf2e?.context?.target?.actor;
    const actor = own ? fromUuidSync(own) : null;
    return actor ? [actor] : [...(game.user?.targets ?? [])].map((token) => token.actor).filter(Boolean);
}

async function end(actor, effects, reason) {
    if (effects.length === 0) return;
    await actor.deleteEmbeddedDocuments("Item", effects.map((e) => e.id)).catch(() => null);
    await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<p>${t("Hostile.Ended", { actor: actor.name, what: `${effects.map((e) => e.name).join(", ")}${reason}` })}</p>` });
}

export const Hostility = {
    registerHooks() {
        Hooks.on("createChatMessage", async (message, _options, userId) => {
            if (userId !== game.user?.id) return;
            const attacker = message.actor;
            if (!attacker || !hostileKind(message.flags?.pf2e?.context?.type ?? null, message.flags?.pf2e?.context?.type ? null : message.item)) return;
            for (const victim of victims(message)) {
                if (!victim || victim === attacker) continue;
                // The caster's side turning on what it bound.
                const bound = (victim.itemTypes?.effect ?? []).filter((effect) => {
                    const origin = effect.flags?.[LIB_ID]?.[FROM] ? effect.system?.context?.origin?.actor : null;
                    const caster = origin ? fromUuidSync(origin) : null;
                    return caster && (caster === attacker || caster.isAllyOf?.(attacker));
                });
                if (victim.isOwner || game.user.isGM) await end(victim, bound, "");
                // The holder turning on the one it is linked to.
                const linked = (attacker.itemTypes?.effect ?? []).filter((effect) => effect.flags?.[LIB_ID]?.[TO] && effect.flags?.[LIB_ID]?.linkedTo === victim.uuid);
                await end(attacker, linked, "");
            }
        });
    },
};
