import { configOf } from "../lib/config-of.mjs";
import { t } from "../i18n.mjs";
import { chooseHeldWeapon, heldWeapons, weaponDamageTypes } from "../riders/weapon.mjs";
import { VARIANT } from "../targeting/index.mjs";

/**
 * What a spell needs before it can be cast. *Weapon Storm*: "You swing a weapon you're holding" — with nothing in
 * hand there is nothing to swing, and the cast is refused before anything is aimed. `requires` on a table entry.
 */
export function unmetRequirement(spell) {
    const requires = configOf(spell, "requires");
    if (requires === "held-weapon" && heldWeapons(spell?.actor).length === 0) return t("Requires.HeldWeapon", { name: spell.name });
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

export function checkRequirements(spell) {
    const unmet = unmetRequirement(spell);
    if (!unmet) return true;
    ui.notifications.warn(unmet);
    return false;
}
