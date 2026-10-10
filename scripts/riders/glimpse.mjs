import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";

/**
 * A weakness shown to the whole party.
 *
 * *Glimpse Weakness*: "The first ally that hits the target with a successful Strike deals additional precision damage
 * equal to 1 + this spell's rank, and then the spell ends." An effect with `glimpse` marks the target. When one of its
 * caster's allies — or the caster — hits the marked creature with a Strike, that striker is given pf2e's *Glimpse
 * Weakness* effect at the spell's rank for its damage roll, the mark goes, and the striker's effect goes after its next
 * damage roll. Active GM only.
 */

const FLAG = "glimpse";
const EFFECT = "Compendium.pf2e.spell-effects.Item.VJpRUgSDtAO2TSRR";

/** May this striker cash the mark: the caster, or one of the caster's allies? */
export function cashes(striker, caster) {
    return !!striker && !!caster && (striker === caster || !!striker.isAllyOf?.(caster));
}

export const Glimpse = {
    registerHooks() {
        Hooks.on("createChatMessage", async (message) => {
            if (game.users?.activeGM?.id !== game.user?.id) return;
            const context = message.flags?.pf2e?.context;
            const striker = message.actor;
            // The striker's damage roll spends what the hit gave it.
            if (context?.type === "damage-roll" && striker) {
                const given = striker.itemTypes.effect.filter((e) => e.flags?.[LIB_ID]?.glimpseGiven).map((e) => e.id);
                if (given.length) await striker.deleteEmbeddedDocuments("Item", given).catch(() => null);
                return;
            }
            if (context?.type !== "attack-roll" || !["success", "criticalSuccess"].includes(context.outcome)) return;
            const target = context.target?.actor ? fromUuidSync(context.target.actor) : null;
            const mark = target?.itemTypes?.effect?.find((e) => e.flags?.[LIB_ID]?.[FLAG]);
            const caster = mark?.system?.context?.origin?.actor ? fromUuidSync(mark.system.context.origin.actor) : null;
            if (!mark || !cashes(striker, caster)) return;
            const source = (await fromUuid(EFFECT))?.toObject();
            if (!source) return;
            source.system.level = { value: Number(mark.flags[LIB_ID][FLAG].rank) || 1 };
            source.flags = foundry.utils.mergeObject(source.flags ?? {}, { [LIB_ID]: { glimpseGiven: true } });
            await striker.createEmbeddedDocuments("Item", [source]);
            await mark.delete();
            await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: striker }), content: `<p>${t("Glimpse.Cashed", { name: striker.name, target: target.name, bonus: 1 + (Number(mark.flags[LIB_ID][FLAG].rank) || 1) })}</p>` });
        });
    },
};
