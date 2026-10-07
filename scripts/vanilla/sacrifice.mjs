import { CastPipeline } from "../cast-pipeline.mjs";
import { t } from "../i18n.mjs";
import { configOf } from "../lib/config-of.mjs";
import { AreaTargeting, VARIANT } from "../targeting/index.mjs";
import { summonedBy } from "../targeting/summon.mjs";

/**
 * A minion spent.
 *
 * *Final Sacrifice*: "Target 1 creature with the minion trait that you summoned … The target is immediately slain, and
 * the explosion deals 6d6 fire damage to creatures within 20 feet of it with a basic Reflex save. If the target has the
 * cold or water trait, the spell deals cold damage and has the cold trait instead of the fire trait." `sacrifice:
 * { element: { <trait>: <damage type> } }`: the cast needs one target, a creature its caster summoned; the spell's area
 * is measured from that creature; a creature with a trait named in `element` makes the spell's fire that type; and as
 * the spell resolves the creature is slain and goes.
 */

const pending = new Map();
/** The retyped spell of a cast, by the spell's uuid, for its card: pf2e rebuilds a card's spell from the actor's. */
const retypedCards = new Map();

/** The damage type a minion's traits turn the spell to, or null. */
export function elementFor(traits, element = {}) {
    for (const [trait, type] of Object.entries(element ?? {})) if ((traits ?? []).includes(trait)) return type;
    return null;
}

/** The spell's source with its fire damage and trait made `type`. */
export function retyped(source, from, to) {
    const damage = Object.fromEntries(Object.entries(source.system.damage ?? {}).map(([k, d]) => [k, d.type === from ? { ...d, type: to } : d]));
    const traits = (source.system.traits?.value ?? []).map((tr) => (tr === from ? to : tr));
    return { ...source, system: { ...source.system, damage, traits: { ...source.system.traits, value: [...new Set(traits)] } } };
}

function keyOf(spell) {
    return (spell?.original ?? spell)?.uuid ?? null;
}

/** The cast stage (`cast-pipeline.mjs`, "a minion sacrificed"): the one target a minion of the caster's; its element. */
export function sacrificeBefore(spell, options) {
    const spec = configOf(spell, "sacrifice");
    if (!spec) return true;
    const targets = [...(game.user?.targets ?? [])];
    const minion = targets.length === 1 ? targets[0] : null;
    if (!minion || !summonedBy(minion, spell.actor)) {
        ui.notifications.warn(t("Sacrifice.NotMinion", { name: spell.name }));
        return false;
    }
    pending.set(keyOf(spell), minion.document.uuid);
    retypedCards.delete(keyOf(spell));
    const type = elementFor(minion.actor?.system?.traits?.value, spec.element);
    if (type && options) {
        const source = retyped(spell.toObject(), "fire", type);
        source.system.location.heightenedLevel = spell.rank;
        const variant = new spell.constructor(source, { parent: spell.parent });
        variant.original = spell.original ?? spell;
        variant.appliedOverlays = new Map();
        options[VARIANT] = variant;
        retypedCards.set(keyOf(spell), source);
    }
    return true;
}

export const Sacrifice = {
    register() {
        // The card keeps the retyped spell, so its damage rolls the minion's element: pf2e reads a card's spell back
        // from `casting.embeddedSpell` when there is one, and from the caster's own item otherwise.
        Hooks.on("preCreateChatMessage", (message) => {
            const key = message.flags?.pf2e?.origin?.uuid;
            const source = key ? retypedCards.get(key) : null;
            if (!source || !message.flags?.pf2e?.casting) return;
            retypedCards.delete(key);
            message.updateSource({ "flags.pf2e.casting.embeddedSpell": source });
        });
        // Its area is measured from the minion.
        AreaTargeting.registerOriginResolver("a minion sacrificed", 30, (_actor, item) => {
            const uuid = pending.get(keyOf(item));
            return uuid ? (fromUuidSync(uuid)?.object ?? null) : null;
        });
        // "The target is immediately slain": as the spell resolves.
        CastPipeline.after("a minion sacrificed", 62, async (cast, spell) => {
            const key = keyOf(spell ?? cast);
            const uuid = pending.get(key);
            if (!uuid) return;
            pending.delete(key);
            const token = fromUuidSync(uuid);
            if (!token?.actor) return;
            await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: (spell ?? cast).actor }), content: `<p>${t("Sacrifice.Slain", { name: token.name })}</p>` });
            if (game.user.isGM) await token.delete();
            else await token.actor.update({ "system.attributes.hp.value": 0 });
        });
    },
};
