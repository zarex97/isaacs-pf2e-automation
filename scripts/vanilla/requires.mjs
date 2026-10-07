import { configOf } from "../lib/config-of.mjs";
import { t } from "../i18n.mjs";
import { chooseHeldWeapon, heldWeapons, weaponDamageTypes } from "../riders/weapon.mjs";
import { VARIANT } from "../targeting/index.mjs";
import { LIB_ID } from "../id.mjs";

/** The flag on the caster that carries the multiple attack penalty chosen for a cast's attacks to its riders. */
export const ATTACK_NUMBER = "attackNumber";

/**
 * Which action counts can be spent: every one the spell offers, and — when each action buys a target
 * (`targetsPerAction`) — only those that pay for every creature targeted. *Blazing Bolt*: "For each additional
 * action you use when Casting the Spell, you can fire an additional ray at a different target". Fewer targets than
 * actions is a ray not fired, never refused. Empty: more targets than the most actions can pay for.
 */
export function actionChoices(counts, targets, perAction) {
    const sorted = [...counts].map(Number).filter((n) => n > 0).sort((a, b) => a - b);
    return perAction ? sorted.filter((n) => n >= targets) : sorted;
}

/**
 * What a spell needs before it can be cast. *Weapon Storm*: "You swing a weapon you're holding" — with nothing in
 * hand there is nothing to swing, and the cast is refused before anything is aimed. `requires` on a table entry.
 */
export function unmetRequirement(spell) {
    const requires = configOf(spell, "requires");
    if (requires === "held-weapon" && heldWeapons(spell?.actor).length === 0) return t("Requires.HeldWeapon", { name: spell.name });
    // *Earthbind*: "you hamper a target's flight" — every creature targeted is off the ground.
    if (requires === "flying-target") {
        const targets = [...(globalThis.game?.user?.targets ?? [])];
        if (targets.length === 0 || targets.some((token) => !((Number(token.document?._source?.elevation ?? token.document?.elevation ?? token.elevation) || 0) > 0))) return t("Requires.FlyingTarget", { name: spell.name });
    }
    return null;
}

/**
 * *Spiritual Armament*: "The damage type is the same as the chosen weapon (or any of its types for a versatile weapon).
 * The attack deals spirit damage instead if that would be more detrimental to the creature (as determined by the
 * GM)." pf2e ships the spell as one variant per damage type; the caster picks a weapon in hand and one of its types —
 * or spirit — and that variant is cast. `variantFromWeapon`: `{ <damage type>: <overlay id> }`.
 */
export async function weaponVariant(spell, options) {
    const overlays = configOf(spell, "variantFromWeapon");
    if (!overlays || typeof spell?.loadVariant !== "function" || options?.[VARIANT]) return true;
    const weapon = await chooseHeldWeapon(spell.actor, spell.name);
    if (!weapon) return true;
    const types = [...weaponDamageTypes(weapon), "spirit"].filter((type) => overlays[type]);
    if (types.length === 0) return true;
    const label = (type) => game.i18n.localize(CONFIG.PF2E?.damageTypes?.[type] ?? type);
    const type = types.length === 1 ? types[0] : await foundry.applications.api.DialogV2.wait({
        window: { title: spell.name },
        content: `<p>${t("Weapon.ChooseType", { weapon: weapon.name })}</p>`,
        buttons: types.map((ty) => ({ action: ty, label: label(ty) })),
        rejectClose: false,
    });
    if (!type) return false;
    const variant = spell.loadVariant({ overlayIds: [overlays[type]], castRank: spell.rank });
    if (variant && options) options[VARIANT] = variant;
    return true;
}

/**
 * A spell cast with a variable number of actions, pf2e's variants keyed by the count. *Blazing Bolt*: one action
 * for 2d6, "If you spend 2 or more actions Casting the Spell, the damage increases to 4d6". `actionVariants`:
 * `{ "1": <overlay id>, "2": <overlay id>, "3": <overlay id> }`; `targetsPerAction`: one creature per action, "to a
 * maximum of three rays targeting three different targets for 3 actions". With `sameAttackPenalty` the cast also
 * asks the penalty every attack of the cast rolls at — "you don't increase your multiple attack penalty until after
 * you make all the spell attack rolls" — and leaves it on the caster for the riders (`ATTACK_NUMBER`).
 */
export async function actionVariant(spell, options) {
    const variants = configOf(spell, "actionVariants");
    // No variants, one creature per action — *Infuse Vitality*: "The number of targets is equal to the number of actions
    // you spent casting this spell." The targets say how many were spent; more than the spell's most is refused.
    if (!variants && configOf(spell, "targetsPerAction") === true && !options?.[VARIANT]) {
        const max = mostActions(spell);
        const targets = [...(game.user?.targets ?? [])].filter((token) => token.actor).length;
        if (max && targets > max) {
            ui.notifications.warn(t("Actions.TooManyTargets", { name: spell.name, max, targets }));
            return false;
        }
        return true;
    }
    if (!variants || typeof spell?.loadVariant !== "function" || options?.[VARIANT]) return true;
    const perAction = configOf(spell, "targetsPerAction") === true;
    const targets = [...(game.user?.targets ?? [])].filter((token) => token.actor && token.actor !== spell.actor).length;
    const counts = actionChoices(Object.keys(variants), targets, perAction);
    if (counts.length === 0) {
        ui.notifications.warn(t("Actions.TooManyTargets", { name: spell.name, max: Math.max(...Object.keys(variants).map(Number)), targets }));
        return false;
    }
    const penalty = configOf(spell, "sameAttackPenalty") === true;
    const select = penalty
        ? `<label>${t("Actions.Penalty")} <select name="attackNumber">${[[1, t("Actions.MapFirst")], [2, t("Actions.MapSecond")], [3, t("Actions.MapThird")]].map(([n, label]) => `<option value="${n}">${label}</option>`).join("")}</select></label>`
        : "";
    const chosen = await foundry.applications.api.DialogV2.wait({
        window: { title: spell.name },
        content: `<p>${t(perAction ? "Actions.ChoosePerTarget" : "Actions.Choose", { targets })}</p>${select}`,
        buttons: counts.map((n) => ({
            action: String(n),
            label: t(n === 1 ? "Actions.One" : "Actions.Many", { n }),
            callback: (_event, button) => ({ count: n, attackNumber: Number(button.form?.elements?.attackNumber?.value) || 1 }),
        })),
        rejectClose: false,
    });
    if (!chosen?.count) return false;
    if (penalty) await spell.actor?.setFlag(LIB_ID, ATTACK_NUMBER, { item: (spell.original ?? spell).id, value: chosen.attackNumber });
    const variant = spell.loadVariant({ overlayIds: [variants[String(chosen.count)]], castRank: spell.rank });
    if (variant && options) options[VARIANT] = variant;
    return true;
}

/** The most actions a spell can be cast with: "1 to 3" is 3. */
export function mostActions(spell) {
    const value = String(spell?.system?.time?.value ?? "");
    const numbers = value.match(/\d+/g)?.map(Number) ?? [];
    return numbers.length ? Math.max(...numbers) : null;
}

/** The flag on the caster that keeps what was chosen as a spell was cast, by spell: `{ [spellId]: { [flag]: value } }`. */
export const CAST_CHOICES = "castChoices";

/**
 * A choice the caster makes as the spell is cast, for its riders to read. *Seal Fate*: "Choose one type of damage from
 * the following list: acid, bludgeoning, cold, electricity, fire, piercing, slashing, sonic, or void." `castChoice`:
 * `{ flag, prompt, choices }` — damage types are labelled as pf2e labels them. Kept on the caster (`CAST_CHOICES`),
 * and read back by a rider's `"$cast"` (`preselect`) or `"$cast:<flag>"` (`carries`).
 */
export async function castChoice(spell, _options) {
    const spec = configOf(spell, "castChoice");
    if (!spec?.flag || !Array.isArray(spec.choices) || spec.choices.length === 0) return true;
    const key = `${CAST_CHOICES}.${(spell.original ?? spell).id}`;
    // A choice only some ranks ask — *Enlarge*: "Heightened (6th) Choose either the 2nd-rank or 4th-rank version". Below
    // `fromRank` nothing is asked, and nothing an earlier cast chose is left to be read.
    if (Number(spec.fromRank) > 0 && (Number(spell.rank) || 0) < Number(spec.fromRank)) {
        if (spell.actor?.getFlag(LIB_ID, key)) await spell.actor.unsetFlag(LIB_ID, key);
        return true;
    }
    // Sizes by their names, as pf2e's own choices spell them ("large"); its labels are keyed by the short form ("lg").
    const SIZES = { tiny: "tiny", small: "sm", medium: "med", large: "lg", huge: "huge", gargantuan: "grg" };
    const label = (value) => game.i18n.localize(spec.labels?.[value] ?? CONFIG.PF2E?.damageTypes?.[value] ?? CONFIG.PF2E?.actorSizes?.[SIZES[value] ?? value] ?? value);
    const chosen = spec.choices.length === 1 ? spec.choices[0] : await foundry.applications.api.DialogV2.wait({
        window: { title: spell.name },
        content: `<p>${game.i18n.localize(spec.prompt ?? "")}</p>`,
        buttons: spec.choices.map((value) => ({ action: value, label: label(value) })),
        rejectClose: false,
    });
    if (!chosen) return false;
    await spell.actor?.setFlag(LIB_ID, key, { [spec.flag]: chosen });
    return true;
}

export function checkRequirements(spell) {
    const unmet = unmetRequirement(spell);
    if (!unmet) return true;
    ui.notifications.warn(unmet);
    return false;
}
