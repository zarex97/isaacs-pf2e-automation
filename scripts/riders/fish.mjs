import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";

/**
 * A fish from another plane.
 *
 * *Fishing Spot*: "you catch a magical fish; roll 1d8 to see which fish you caught and the effects gained from eating
 * it once it's cooked. The fish must be cooked and eaten … within 1 hour of being caught, and the listed effect lasts
 * for 1 hour after consumption. Each fish can feed only a single creature." `{ type: "fish" }` rolls the d8 and puts
 * that fish in the caster's pack, a consumable of one use. Whoever eats it — uses it — gets pf2e's *Fishing Spot*
 * effect for that fish, for an hour. Not eaten within the hour of the world clock, it is gone. Active GM only.
 */

const FLAG = "fish";
export const FISH = ["musical-trout", "primordial-bass", "ghoulfish", "burbling-barbel", "dashing-dace", "vigocarp", "aggressive-perch", "scholar-salmon"];
const EFFECT = "Compendium.pf2e.spell-effects.Item.3G6hnH5hnOchH66Z";
const NAMES = { "musical-trout": "Fish.MusicalTrout", "primordial-bass": "Fish.PrimordialBass", ghoulfish: "Fish.Ghoulfish", "burbling-barbel": "Fish.BurblingBarbel", "dashing-dace": "Fish.DashingDace", vigocarp: "Fish.Vigocarp", "aggressive-perch": "Fish.AggressivePerch", "scholar-salmon": "Fish.ScholarSalmon" };

/** The fish a d8 names. */
export function fishFor(d8) {
    return FISH[Math.min(8, Math.max(1, Number(d8) || 1)) - 1];
}

export async function catchFish(_rider, context) {
    const caster = context.originActor;
    if (!caster) return;
    const roll = await new Roll("1d8").evaluate();
    await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: caster }), flavor: context.item?.name ?? "" });
    const fish = fishFor(roll.total);
    await caster.createEmbeddedDocuments("Item", [{
        type: "consumable",
        name: t(NAMES[fish]),
        img: "icons/consumables/meat/fish-whole-blue.webp",
        system: { category: "food", quantity: 1, uses: { value: 1, max: 1, autoDestroy: false }, description: { value: `<p>${t("Fish.Hint")}</p>` } },
        flags: { [LIB_ID]: { [FLAG]: { fish, until: game.time.worldTime + 3600 } } },
    }]);
    context.notes.push(t("Fish.Caught", { fish: t(NAMES[fish]) }));
}

export const Fish = {
    registerHooks() {
        // Eaten — its one use spent, while still fresh: the eater's hour of the fish. (Handing it over moves it, which
        // spends nothing.)
        Hooks.on("updateItem", async (item, change) => {
            if (game.users?.activeGM?.id !== game.user?.id) return;
            const spec = item.flags?.[LIB_ID]?.[FLAG];
            const uses = foundry.utils.getProperty(change, "system.uses.value");
            const eater = item.actor;
            if (!spec?.fish || !eater || uses === undefined || Number(uses) > 0 || game.time.worldTime >= Number(spec.until)) return;
            const source = (await fromUuid(EFFECT))?.toObject();
            if (!source) return;
            source.system.rules = source.system.rules.map((rule) => (rule.key === "ChoiceSet" ? { ...rule, selection: spec.fish } : rule));
            source.system.duration = { value: 1, unit: "hours", expiry: "turn-start", sustained: false };
            await eater.createEmbeddedDocuments("Item", [source]);
            await item.delete();
        });
        // Not eaten within the hour: gone.
        Hooks.on("updateWorldTime", async () => {
            if (game.users?.activeGM?.id !== game.user?.id) return;
            for (const actor of game.actors) {
                const stale = actor.items.filter((i) => Number(i.flags?.[LIB_ID]?.[FLAG]?.until) <= game.time.worldTime).map((i) => i.id);
                if (stale.length) await actor.deleteEmbeddedDocuments("Item", stale).catch(() => null);
            }
        });
    },
};
