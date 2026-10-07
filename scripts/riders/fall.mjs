import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";

/**
 * Brought down, and kept down.
 *
 * *Earthbind*: "The target falls safely up to 120 feet. If the creature reaches the ground safely, it doesn't take
 * falling damage … If it hits the ground, it can't Fly, levitate, or otherwise leave the ground for 1 round" (a
 * minute on a critical failure). `fall` lowers the creature's token by up to `feet` — never below the ground, and with
 * no damage — and, when it lands and the rider names a `grounded` duration, leaves an effect that keeps it there: any
 * move that would lift its token is refused while the effect lasts.
 */

const FLAG = "grounded";

/** The elevation after a safe fall of up to `feet` from `elevation`. Pure. */
export function fallTo(elevation, feet) {
    return Math.max(0, (Number(elevation) || 0) - Math.max(0, Number(feet) || 0));
}

/** Is this actor kept on the ground? */
export function isGrounded(actor) {
    return (actor?.itemTypes?.effect ?? []).some((e) => e.flags?.[LIB_ID]?.[FLAG]);
}

export const Fall = {
    async apply(rider, context) {
        const token = context.target?.document ?? context.target;
        const actor = context.actor;
        if (!token || !actor) return;
        // The stored elevation: the live one trails it while a move is still animating.
        const from = Number(token._source?.elevation ?? token.elevation) || 0;
        const to = fallTo(from, rider.apply.feet ?? 120);
        if (to !== from) await token.update({ elevation: to }, { forcedMovement: true });
        context.notes.push(t(to === 0 ? "Fall.Landed" : "Fall.Fell", { actor: actor.name, feet: from - to, left: to }));
        if (to > 0 || !rider.apply.grounded) return;
        const duration = rider.apply.grounded;
        const [created] = await actor.createEmbeddedDocuments("Item", [{
            type: "effect",
            name: t("Fall.Grounded", { name: context.item?.name ?? "" }),
            img: context.item?.img ?? "icons/svg/downgrade.svg",
            system: {
                duration: { value: Number(duration.value) || 1, unit: duration.unit ?? "rounds", expiry: duration.expiry ?? "turn-end", sustained: false },
                tokenIcon: { show: true },
                rules: [],
            },
            flags: { [LIB_ID]: { [FLAG]: true } },
        }]);
        if (created) context.created?.push(created.id);
    },

    registerHooks() {
        // "It can't Fly, levitate, or otherwise leave the ground": a token kept down does not rise.
        Hooks.on("preUpdateToken", (token, changes) => {
            if (!("elevation" in (changes ?? {}))) return;
            if ((Number(changes.elevation) || 0) <= (Number(token._source?.elevation ?? token.elevation) || 0)) return;
            if (!isGrounded(token.actor)) return;
            ui.notifications?.warn(t("Fall.Refused", { actor: token.actor.name }));
            return false;
        });
    },
};
