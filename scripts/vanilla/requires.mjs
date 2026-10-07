import { configOf } from "../lib/config-of.mjs";
import { t } from "../i18n.mjs";
import { heldWeapons } from "../riders/weapon.mjs";

/**
 * What a spell needs before it can be cast. *Weapon Storm*: "You swing a weapon you're holding" — with nothing in
 * hand there is nothing to swing, and the cast is refused before anything is aimed. `requires` on a table entry.
 */
export function unmetRequirement(spell) {
    const requires = configOf(spell, "requires");
    if (requires === "held-weapon" && heldWeapons(spell?.actor).length === 0) return t("Requires.HeldWeapon", { name: spell.name });
    return null;
}

export function checkRequirements(spell) {
    const unmet = unmetRequirement(spell);
    if (!unmet) return true;
    ui.notifications.warn(unmet);
    return false;
}
