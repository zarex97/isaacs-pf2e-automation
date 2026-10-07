import { DamageBus } from "../lib/damage-bus.mjs";
import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";

/**
 * Damage shared between two creatures.
 *
 * *Share Life*: "The target takes half damage from all effects that deal Hit Point damage, and you take the remainder
 * of the damage. When you take damage through this link, you don't apply any resistances, weaknesses, or other
 * abilities you have to that damage … The spell ends if the target is ever more than 30 feet away from you. If either
 * you or the target is reduced to 0 Hit Points, any damage from this spell is resolved and then the spell ends."
 *
 * An effect on the target with `shareDamage: { share, range }` names its caster (`with`). Damage to the target is
 * altered before it lands — pf2e's own `DamageRoll#alter`, what its "half damage" button does — so the target's
 * resistances and weaknesses still apply to its share; the rest goes to the caster as it is, `final`. Either of them
 * at 0 Hit Points after a blow, or the two moved more than `range` feet apart, ends the effect.
 */

const FLAG = "shareDamage";
const SHARE = Symbol.for(`${LIB_ID}.shareDamage`);
const PRIORITY = { split: 2, rest: 88 };

/** The share-damage effect this actor holds, or null. */
export function sharingEffect(actor) {
    return (actor?.itemTypes?.effect ?? []).find((e) => e.flags?.[LIB_ID]?.[FLAG]?.with) ?? null;
}

/** The target's part and the caster's remainder of a blow of `total`, the target's altered to `part`. */
export function splitDamage(total, part) {
    const own = Math.max(0, Math.min(total, part));
    return { own, rest: Math.max(0, total - own) };
}

/** Is this damage call one to split: a rolled blow of damage, not a final number or healing? */
export function splittable(params) {
    const damage = params?.damage;
    if (!damage || typeof damage === "number" || params.final || params.skipIWR) return false;
    return typeof damage.alter === "function" && (Number(damage.total) || 0) > 0;
}

function tokenOf(actor) {
    return actor?.getActiveTokens?.(true, false)?.at(0) ?? null;
}

/** Every share-damage effect on the scene, with its holder and caster. */
function links() {
    const out = [];
    for (const token of canvas?.tokens?.placeables ?? []) {
        for (const effect of token.actor?.itemTypes?.effect ?? []) {
            const spec = effect.flags?.[LIB_ID]?.[FLAG];
            if (spec?.with) out.push({ effect, holder: token.actor, spec });
        }
    }
    return out;
}

async function end(effect, reason) {
    if (!effect?.actor?.items?.get(effect.id)) return;
    const speaker = ChatMessage.getSpeaker({ actor: effect.actor });
    await effect.delete();
    await ChatMessage.create({ speaker, content: `<p>${t(reason, { name: effect.name })}</p>` });
}

function hpZero(actor) {
    return (actor?.hitPoints?.value ?? 1) <= 0;
}

export const ShareDamage = {
    register() {
        DamageBus.before("damage shared with a caster", PRIORITY.split, (actor, params) => {
            const effect = sharingEffect(actor);
            if (!effect || !splittable(params)) return;
            const spec = effect.flags[LIB_ID][FLAG];
            const total = params.damage.total;
            const altered = params.damage.alter(Number(spec.share) || 0.5, 0);
            const { rest } = splitDamage(total, altered.total);
            params.damage = altered;
            params[SHARE] = { rest, effectUuid: effect.uuid, with: spec.with };
        });

        DamageBus.after("damage shared with a caster", PRIORITY.rest, async (actor, params) => {
            const split = params?.[SHARE];
            if (split) {
                const caster = await fromUuid(split.with);
                if (caster && split.rest > 0) {
                    await ChatMessage.create({
                        speaker: ChatMessage.getSpeaker({ actor: caster }),
                        content: `<p>${t("ShareDamage.Took", { actor: caster.name, damage: split.rest, target: actor.name })}</p>`,
                    });
                    await caster.applyDamage({ damage: split.rest, token: tokenOf(caster)?.document ?? null, final: true });
                }
            }
            // "If either you or the target is reduced to 0 Hit Points … the spell ends."
            if (game.users.activeGM?.id !== game.user.id) return;
            for (const { effect, holder, spec } of links()) {
                const caster = fromUuidSync(spec.with);
                if (hpZero(holder) || hpZero(caster)) await end(effect, "ShareDamage.Zero");
            }
        });
    },

    /** "The spell ends if the target is ever more than 30 feet away from you." Active GM only. */
    registerHooks() {
        Hooks.on("updateToken", (token, changes) => {
            if (game.users.activeGM?.id !== game.user.id) return;
            if (!("x" in changes) && !("y" in changes) && !("elevation" in changes)) return;
            setTimeout(() => {
                for (const { effect, holder, spec } of links()) {
                    if (!Number(spec.range)) continue;
                    if (token.actor !== holder && token.actor?.uuid !== spec.with) continue;
                    const a = tokenOf(holder);
                    const b = tokenOf(fromUuidSync(spec.with));
                    if (a && b && a.distanceTo(b) > Number(spec.range)) void end(effect, "ShareDamage.Apart");
                }
            }, 250);
        });
    },
};
