import { t } from "../i18n.mjs";

/**
 * The weapon a spell borrows.
 *
 * *Weapon Storm*: "You swing a weapon you're holding … This damage has the same type as the weapon and uses the same
 * die size. Determine the die size as if you were attacking with the weapon; for instance, if you were wielding a
 * two-hand weapon in both hands, you'd use its two-hand damage die … Critical Failure The target takes double damage
 * and is subject to the weapon's critical specialization effect."
 */

/** The weapons a creature is holding. */
export function heldWeapons(actor) {
    return (actor?.itemTypes?.weapon ?? []).filter((w) => w.system?.equipped?.carryType === "held" && (w.system.equipped.handsHeld ?? 0) > 0);
}

/** The die a weapon deals as it is held: its two-hand die when it has one and is held in both hands. */
export function dieAsHeld(weapon) {
    const traits = weapon?.system?.traits?.value ?? [];
    const twoHand = traits.find((trait) => /^two-hand-d\d+$/.test(trait));
    if (twoHand && (weapon.system?.equipped?.handsHeld ?? 0) >= 2) return twoHand.replace("two-hand-", "");
    return weapon?.system?.damage?.die ?? "d4";
}

/** The weapon to borrow: the only one held, or the one the caster picks. */
export async function chooseHeldWeapon(actor, title) {
    const held = heldWeapons(actor);
    if (held.length <= 1) return held[0] ?? null;
    const id = await foundry.applications.api.DialogV2.wait({
        window: { title },
        content: `<p>${t("Weapon.Choose")}</p>`,
        buttons: held.map((w) => ({ action: w.id, label: w.name })),
        rejectClose: false,
    });
    return held.find((w) => w.id === id) ?? held[0];
}

/**
 * A weapon group's critical specialization, as riders where it is a plain effect on the creature struck — the rest is
 * pf2e's own text, said aloud. Durations "until the start of your next turn" end on the caster's turn.
 */
const UNTIL_YOUR_TURN = { value: 1, unit: "rounds", expiry: "turn-start" };
const condition = (slug, value, duration) => ({ ...(duration ? { duration } : {}), apply: { type: "condition", slug, ...(value ? { value } : {}) } });
/** "Unless they succeed at a … save against your class DC": the save's own DC is the caster's class DC, else spell DC. */
const unlessSaved = (statistic, inner) => ({ apply: { type: "save", statistic, riders: [{ outcomes: ["failure", "criticalFailure"], ...inner }] } });

export const CRITICAL_SPECIALIZATIONS = {
    sword: [condition("off-guard", null, UNTIL_YOUR_TURN)],
    spear: [condition("clumsy", 1, UNTIL_YOUR_TURN)],
    cryo: [condition("clumsy", 1, UNTIL_YOUR_TURN)],
    hammer: [unlessSaved("fortitude", condition("prone"))],
    flail: [unlessSaved("reflex", condition("prone"))],
    brawling: [unlessSaved("fortitude", condition("slowed", 1, { value: 1, unit: "rounds", expiry: "turn-end" }))],
    firearm: [unlessSaved("fortitude", condition("stunned", 1))],
    sling: [unlessSaved("fortitude", condition("stunned", 1))],
    shock: [unlessSaved("fortitude", condition("stunned", 1, UNTIL_YOUR_TURN))],
    laser: [unlessSaved("fortitude", condition("dazzled", null, UNTIL_YOUR_TURN))],
    mental: [unlessSaved("will", condition("stupefied", 1, UNTIL_YOUR_TURN))],
    poison: [unlessSaved("fortitude", condition("sickened", 1, UNTIL_YOUR_TURN))],
    projectile: [unlessSaved("fortitude", condition("slowed", 1, UNTIL_YOUR_TURN))],
    sonic: [unlessSaved("fortitude", condition("deafened", null, { value: 1, unit: "minutes" }))],
    club: [{ apply: { type: "teleport", distance: 10, stopsAtWalls: true } }],
    shield: [{ apply: { type: "teleport", distance: 5, stopsAtWalls: true } }],
    polearm: [{ apply: { type: "teleport", distance: 5, stopsAtWalls: true, direction: "choose" } }],
};

/** pf2e's own words for a weapon group's critical specialization. */
export function criticalSpecializationText(group) {
    const key = `PF2E.Item.Weapon.CriticalSpecialization.${group}`;
    const text = game.i18n?.localize?.(key);
    return text && text !== key ? text : null;
}
