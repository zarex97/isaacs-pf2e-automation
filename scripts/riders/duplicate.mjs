import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";

/**
 * A copy shaped from blood.
 *
 * *Blood Duplicate*: "you shape a magical duplicate of the target from your blood … This spell can't duplicate an item
 * made of precious materials, or materials with a rarity of uncommon or higher. If you're ever more than 5 feet from
 * the duplicate, the spell's duration immediately ends. The Perception DC to recognize the duplicate as false using any
 * sense except touch is equal to 10 + your spellcasting ability modifier + your Crafting proficiency bonus … When the
 * spell ends, the item collapses into a puddle of blood". An effect with `duplicates: { flag }` copies the caster's
 * item the cast named — non-magical, 1 Bulk or less, of no precious or uncommon material — into the caster's hands,
 * says the DC to see through it, and ends when whoever holds the copy stands more than 5 feet from the caster. When the
 * effect ends, every copy goes, wherever it is. Active GM only.
 */

const FLAG = "bloodDuplicate";
const PRECIOUS = ["adamantine", "cold-iron", "silver", "mithral", "orichalcum", "darkwood", "dragonhide", "djezet", "inubrix", "noqual", "peachwood", "siccatite", "sisterstone", "sovereign-steel", "abysium", "dawnsilver", "duskwood"];

/** May this item be copied: physical, non-magical, 1 Bulk or less, of a common, non-precious material? */
export function copyable(item) {
    if (!item?.isOfType?.("physical") || item.isMagical) return false;
    if ((Number(item.system?.bulk?.value) || 0) > 1) return false;
    const material = item.system?.material?.type ?? null;
    return !material || !PRECIOUS.includes(material);
}

/** The DC to tell it false: 10, the casting attribute's modifier, and the Crafting proficiency bonus. */
export function fakeDc(attributeMod, craftingProficiency) {
    return 10 + (Number(attributeMod) || 0) + (Number(craftingProficiency) || 0);
}

function holders() {
    return [...game.actors, ...[...game.scenes].flatMap((scene) => scene.tokens.filter((token) => !token.actorLink && token.actor).map((token) => token.actor))];
}

export const Duplicate = {
    /** Put the copy in the caster's hands, for the effect that keeps it. */
    async make(effect, named, castItem) {
        const caster = effect.actor;
        const original = caster?.items?.find((i) => i.name.toLowerCase() === String(named ?? "").trim().toLowerCase());
        if (!original || !copyable(original)) {
            await effect.delete();
            return { note: t("Duplicate.Refused", { item: named }) };
        }
        const source = original.toObject();
        delete source._id;
        source.system.equipped = { carryType: "held", handsHeld: 1 };
        source.flags = foundry.utils.mergeObject(source.flags ?? {}, { [LIB_ID]: { [FLAG]: { effectUuid: effect.uuid, casterUuid: caster.uuid } } });
        await caster.createEmbeddedDocuments("Item", [source]);
        const attribute = castItem?.spellcasting?.attribute ?? "int";
        const proficiency = caster.skills?.crafting?.modifiers?.find((m) => m.type === "proficiency")?.modifier ?? 0;
        return { note: t("Duplicate.Made", { item: original.name, dc: fakeDc(caster.abilities?.[attribute]?.mod, proficiency) }) };
    },

    async check() {
        if (game.users?.activeGM?.id !== game.user?.id) return;
        for (const holder of holders()) {
            for (const copy of holder.items.filter((item) => item.flags?.[LIB_ID]?.[FLAG])) {
                const spec = copy.flags[LIB_ID][FLAG];
                const effect = fromUuidSync(spec.effectUuid);
                const caster = fromUuidSync(spec.casterUuid);
                if (!effect) {
                    await copy.delete();
                    continue;
                }
                const a = caster?.getActiveTokens?.(true, true).find((token) => token.parent === canvas.scene);
                const b = holder.token ?? holder.getActiveTokens?.(true, true).find((token) => token.parent === canvas.scene);
                if (!a || !b || holder === caster) continue;
                const feet = canvas.grid.measurePath([a.object?.center ?? a, b.object?.center ?? b]).distance;
                if (feet > 5) await effect.delete();
            }
        }
    },

    registerHooks() {
        Hooks.on("updateToken", (_token, change) => { if ("x" in change || "y" in change) void Duplicate.check(); });
        Hooks.on("createItem", (item) => { if (item.flags?.[LIB_ID]?.[FLAG]) void Duplicate.check(); });
        // The spell over: every copy is a puddle, wherever it went.
        Hooks.on("deleteItem", async (item) => {
            if (game.users?.activeGM?.id !== game.user?.id || item.type !== "effect") return;
            for (const holder of holders()) {
                const ids = holder.items.filter((owned) => owned.flags?.[LIB_ID]?.[FLAG]?.effectUuid === item.uuid).map((owned) => owned.id);
                if (ids.length) {
                    await holder.deleteEmbeddedDocuments("Item", ids).catch(() => null);
                    await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: holder }), content: `<p>${t("Duplicate.Puddle")}</p>` });
                }
            }
        });
    },
};
