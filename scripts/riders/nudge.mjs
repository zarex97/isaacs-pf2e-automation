import { CheckPipeline } from "../lib/check-pipeline.mjs";
import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";

/**
 * A bonus granted after the die falls, when it would change the outcome.
 *
 * *Nudge Fate*: "When the target fails an attack roll, skill check, or saving throw and a +1 status bonus would turn
 * a critical failure into a failure, or failure into a success, you grant the target a +1 status bonus to the check
 * retroactively, changing the outcome appropriately. The spell then ends." An effect with `nudge: { types }` puts a
 * pf2e degree adjustment on its holder's checks of those types — one step up, predicated on the roll falling exactly
 * where one more point crosses a line (`check:total:delta:-1` or `-10`, with the natural 20 and 1 that would undo
 * it excluded) — so pf2e itself raises the outcome and shows why. A check that already carries a status bonus gets
 * nothing: a second +1 status bonus would not add. When the adjustment raises a posted check, the effect ends.
 */

const FLAG = "nudge";
const TYPES = ["attack-roll", "skill-check", "saving-throw"];

/** The predicate under which one more point raises a failed roll by a degree. */
export const NUDGE_PREDICATE = [{ or: [
    { and: ["check:total:delta:-1", { not: "check:total:natural:20" }] },
    { and: ["check:total:delta:-10", { not: "check:total:natural:1" }] },
] }];

/** The holder's nudge effect, or null. */
export function nudgeEffect(actor) {
    return (actor?.itemTypes?.effect ?? []).find((e) => e.flags?.[LIB_ID]?.[FLAG]) ?? null;
}

/** Would a +1 status bonus count on this check? Not when an enabled status bonus is already there. */
export function statusBonusCounts(modifiers = []) {
    return !modifiers.some((m) => m.enabled !== false && !m.ignored && m.type === "status" && Number(m.modifier) >= 1);
}

function labelOf(effect) {
    return t("Nudge.Label", { name: effect.name });
}

export const Nudge = {
    register() {
        CheckPipeline.before("a nudge after the die falls", 40, (check, context) => {
            const actor = context?.actor;
            const effect = nudgeEffect(actor);
            if (!effect || !context.dc) return;
            const types = effect.flags[LIB_ID][FLAG].types ?? TYPES;
            if (!types.includes(context.type)) return;
            if (!statusBonusCounts(check?.modifiers ?? [])) return;
            const Predicate = game.pf2e?.Predicate;
            if (!Predicate) return;
            context.dosAdjustments = [...(context.dosAdjustments ?? []), {
                adjustments: { all: { label: labelOf(effect), amount: 1 } },
                predicate: new Predicate(NUDGE_PREDICATE),
            }];
        });

        // "The spell then ends": a posted check this raised. Active GM only.
        Hooks.on("createChatMessage", async (message) => {
            if (game.users.activeGM?.id !== game.user.id) return;
            const context = message.flags?.pf2e?.context;
            if (!context?.outcome || context.outcome === context.unadjustedOutcome) return;
            const actor = message.actor;
            const effect = nudgeEffect(actor);
            if (!effect || context.dosAdjustments?.all?.label !== labelOf(effect)) return;
            await effect.delete();
            await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<p>${t("Nudge.Spent", { name: effect.name, actor: actor.name })}</p>` });
        });
    },
};
