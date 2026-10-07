import { DamageBus } from "../lib/damage-bus.mjs";
import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";

/**
 * A shield a spell makes.
 *
 * *Fire Shield*: "You can Raise a Shield with the fire shield as a normal shield to gain a +1 circumstance bonus to
 * AC. You can use the Shield Block reaction with the fire shield, which has Hardness 10, is immune to fire, and has
 * 40 HP (with no Broken Threshold), and its Hardness is halved against effects that have the water trait." pf2e's
 * effect writes the shield onto its holder, but always raised, never losing a Hit Point (it is no item to take the
 * damage), and halved against water only by a toggle. An effect with `shield` fixes the three:
 *
 *  - `raise`: the shield is down until pf2e's *Raise a Shield* effect is on its holder (the content grants the action
 *    that puts it there);
 *  - `hp` (+ `hpPerStep`): its Hit Points, kept on the effect and taken down by each block — `immune` damage types
 *    never reach them; at 0 the shield, and the effect, are gone;
 *  - `halvedAgainst`: traits that halve its Hardness for the one blow that has them.
 *
 * Every Shield Block — any shield, raised and whole — is also recorded on the damage call (`BLOCK`), so the
 * `damage-received` rider can be told the blow was blocked (`rider:damage:blocked`).
 */

const FLAG = "spellShield";
/** The damage call's record of a block, for the stages after it. */
export const BLOCK = Symbol.for(`${LIB_ID}.shieldBlock`);
/** pf2e's *Effect: Raise a Shield*. */
export const RAISE_A_SHIELD = "Compendium.pf2e.equipment-effects.Item.2YgXoHvJfrDHucMr";
/** After pf2e's own overrides (50), which write the whole shield. */
const RULE_PRIORITY = 52;
const PRIORITY = { record: 5, ledger: 86 };

/** The shield's Hit Points at this many heightening steps. */
export function shieldHp(spec, steps = 0) {
    return (Number(spec?.hp) || 0) + (Number(spec?.hpPerStep) || 0) * Math.max(0, steps);
}

/** The rules a spell shield adds to its effect: lowered until raised, and its own Hit Points. */
export function shieldRules(spec, hp) {
    const rules = [];
    if (spec.raise) {
        rules.push({ key: "ActiveEffectLike", mode: "override", path: "system.attributes.shield.raised", value: false,
            priority: RULE_PRIORITY, predicate: [{ not: "self:effect:raise-a-shield" }] });
    }
    if (Number.isFinite(hp) && hp > 0) {
        rules.push({ key: "ActiveEffectLike", mode: "override", path: "system.attributes.shield.hp.max", value: hp, priority: RULE_PRIORITY });
        rules.push({ key: "ActiveEffectLike", mode: "override", path: "system.attributes.shield.hp.value", value: hp, priority: RULE_PRIORITY });
    }
    return rules;
}

/** The effect's source, made a spell shield. */
export function spellShieldSource(source, spec, steps = 0) {
    const max = shieldHp(spec, steps);
    source.system.rules = [...(source.system?.rules ?? []), ...shieldRules(spec, max)];
    source.flags = foundry.utils.mergeObject(source.flags ?? {}, {
        [LIB_ID]: { [FLAG]: { max, hp: max, immune: spec.immune ?? [], halvedAgainst: spec.halvedAgainst ?? [] } },
    });
    return source;
}

/** The share of a blocked blow the shield takes: what got past its Hardness, less any it is immune to. */
export function shieldDamage({ landed = 0, instances = [], immune = [] } = {}) {
    const total = instances.reduce((sum, i) => sum + (Number(i.total) || 0), 0);
    const reaching = instances.filter((i) => !immune.includes(i.type)).reduce((sum, i) => sum + (Number(i.total) || 0), 0);
    if (total <= 0) return Math.max(0, landed);
    return Math.max(0, Math.min(landed, reaching));
}

/** Does this blow carry any of these traits? Its item's, or the roll's options. */
export function blowHas(params, traits) {
    if (!traits?.length) return false;
    const own = params?.item?.system?.traits?.value ?? [];
    const options = [...(params?.rollOptions ?? [])];
    return traits.some((trait) => own.includes(trait) || options.some((o) => o === `item:trait:${trait}` || o.endsWith(`:item:trait:${trait}`)));
}

function hpOf(actor) {
    const hp = actor?.hitPoints ?? actor?.system?.attributes?.hp;
    return (Number(hp?.value) || 0) + (Number(hp?.temp) || 0);
}

function liveActorFor(actor, params) {
    const passed = params?.token?.document ?? params?.token ?? null;
    return passed?.actor ?? actor.token?.actor ?? (actor.id ? game.actors?.get(actor.id) : null) ?? actor;
}

export const SpellShield = {
    register() {
        DamageBus.before("a shield block, recorded", PRIORITY.record, (actor, params) => {
            const shield = actor?.attributes?.shield;
            if (!params?.shieldBlockRequest || !shield?.raised || shield.broken || shield.destroyed) return;
            params[BLOCK] = { itemId: shield.itemId, hp: hpOf(actor) };
            const spec = actor.items?.get?.(shield.itemId)?.flags?.[LIB_ID]?.[FLAG];
            if (!spec || !blowHas(params, spec.halvedAgainst)) return;
            const was = shield.hardness;
            shield.hardness = Math.floor(was / 2);
            return () => { shield.hardness = was; };
        });

        DamageBus.after("a spell shield's Hit Points", PRIORITY.ledger, async (actor, params) => {
            const block = params?.[BLOCK];
            const live = liveActorFor(actor, params);
            const effect = block?.itemId ? live.items?.get?.(block.itemId) : null;
            const spec = effect?.flags?.[LIB_ID]?.[FLAG];
            if (!spec) return;
            const landed = Math.max(0, block.hp - hpOf(live));
            const taken = shieldDamage({ landed, instances: params.damage?.instances ?? [], immune: spec.immune });
            if (taken <= 0) return;
            const hp = Math.max(0, spec.hp - taken);
            const speaker = ChatMessage.getSpeaker({ actor: live });
            if (hp === 0) {
                await effect.delete();
                await ChatMessage.create({ speaker, content: `<p>${t("SpellShield.Destroyed", { name: effect.name, taken })}</p>` });
                return;
            }
            const rules = (effect._source.system.rules ?? []).map((rule) =>
                rule.path === "system.attributes.shield.hp.value" && rule.priority === RULE_PRIORITY ? { ...rule, value: hp } : rule);
            await effect.update({ "system.rules": rules, [`flags.${LIB_ID}.${FLAG}.hp`]: hp });
            await ChatMessage.create({ speaker, content: `<p>${t("SpellShield.Took", { name: effect.name, taken, hp, max: spec.max })}</p>` });
        });
    },
};
