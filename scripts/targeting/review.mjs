import { LIB_ID } from "../id.mjs";
import { t } from "../i18n.mjs";
import { describe } from "./config.mjs";

// Looked up at call time rather than destructured at import, so this module can be loaded — and the
// sentinel below tested — outside Foundry, where `foundry` does not exist.
const DialogV2 = () => foundry.applications.api.DialogV2;

/**
 * "Put it somewhere else."
 *
 * A third outcome, and it has to be its own value: an empty array is already a legitimate confirmation —
 * the area caught nothing targetable and the caster is casting anyway — and null already means they called
 * the whole thing off. Folding re-aim into either would either spend the cast or eat it.
 */
export const REAIM = Symbol("re-aim");

/**
 * The last look before the Technique goes off.
 *
 * The area has already decided who is in it; this is only about who the caster *means*. It matters
 * because the alliance rules are guesses about intent — a charmed ally standing with the enemy is still
 * flagged `party` — and because a Technique like *Aiolos's Wings* catches more allies than it may take.
 * Everything the area rejected is listed too, with its reason, so a target going missing is never a
 * mystery the caster has to debug mid-turn.
 *
 * Returns the chosen token ids, `REAIM` to aim again, or null if the caster called the whole thing off.
 */
export async function reviewTargets({ caught, rejected }, config, { canReaim = false } = {}) {
    if (caught.length === 0 && rejected.length === 0) {
        // An area that caught nothing is the strongest reason to want another go, so this is the one case
        // where the empty result still asks rather than simply reporting.
        if (canReaim) {
            const again = await DialogV2().confirm({
                window: { title: config.item.name },
                content: `<p>${t("Review.Nothing")}</p><p>${t("Review.AimAgain")}</p>`,
                rejectClose: false,
            });
            if (again) return REAIM;
        } else {
            ui.notifications.info(t("Review.NothingInfo", { name: config.item.name }));
        }
        return [];
    }

    if (!game.settings.get(LIB_ID, "areaTargetingReview")) {
        return caught.filter((entry) => entry.checked).map((entry) => entry.token.id);
    }

    const content = await foundry.applications.handlebars.renderTemplate(
        `modules/${LIB_ID}/templates/area-targets.hbs`,
        {
            name: config.item.name,
            img: config.item.img,
            rule: describe(config),
            caught: caught.map(({ token, checked, note }) => ({
                id: token.id,
                name: token.document.name,
                img: token.document.texture?.src ?? token.actor?.img,
                checked,
                note,
            })),
            rejected: rejected.map(({ token, reason }) => ({
                id: token.id,
                name: token.document.name,
                img: token.document.texture?.src ?? token.actor?.img,
                reason,
            })),
            canReaim,
        },
    );

    const buttons = [
        {
            action: "confirm",
            label: t("Review.Confirm"),
            icon: "fa-solid fa-crosshairs",
            default: true,
            callback: (_event, _button, dialog) =>
                Array.from(
                    dialog.element.querySelectorAll(`input[name="target"]:checked`),
                    (input) => input.value,
                ),
        },
    ];
    if (canReaim) {
        buttons.push({
            action: "reaim",
            label: t("Review.Reaim"),
            icon: "fa-solid fa-rotate",
            callback: () => REAIM,
        });
    }
    buttons.push({ action: "cancel", label: t("Review.Cancel"), icon: "fa-solid fa-ban", callback: () => null });

    return DialogV2().wait({
        window: { title: t("Review.Title"), icon: "fa-solid fa-crosshairs" },
        classes: [LIB_ID, "area-targets"],
        position: { width: 420 },
        content,
        buttons,
        render: (_event, dialog) => highlightOnHover(dialog.element),
        rejectClose: false,
    }).then((result) => result ?? null);
}

/** Hovering a row lights the token up on the canvas, so a name in the list is never ambiguous. */
function highlightOnHover(html) {
    for (const row of html.querySelectorAll("li[data-token-id]")) {
        const token = canvas.tokens.get(row.dataset.tokenId);
        if (!token) continue;
        row.addEventListener("mouseenter", () => {
            try {
                token._onHoverIn(new PointerEvent("pointerenter"), { hoverOutOthers: true });
            } catch {
                /* hover is a nicety; never let it break the dialog */
            }
        });
        row.addEventListener("mouseleave", () => {
            try {
                token._onHoverOut(new PointerEvent("pointerleave"));
            } catch {
                /* as above */
            }
        });
    }
}
