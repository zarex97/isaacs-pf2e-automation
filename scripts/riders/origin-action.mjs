import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";
import { AreaTargeting } from "../targeting/index.mjs";
import { growByStep } from "./apply.mjs";

/**
 * An effect on a creature that gives its caster an action to spend it.
 *
 * *Blister*: "the target grows one blister. You can spend a single action, which has the concentrate trait, to pop a
 * blister. The target and each creature in a 15-foot cone originating from the target takes 7d6 acid damage … When no
 * blisters are left, the spell ends." The blisters are a counter badge on the target's effect; the caster holds *Pop a
 * Blister* for as long as the effect lasts. Using it takes one off — the last one ends the effect, and the effect
 * gone takes the action with it. What the action does is its own riders, aimed from the creature that carries the
 * effect (an origin resolver), with the spell's DC and heightening fixed when it was granted: an action has no rank.
 */

const FLAG = "originAction";

/** How long the action outlives its effect: the riders of the use that spent the last charge still read it. */
const LINGER_MS = 10000;

/** Riders fixed at the cast they came from: each `formula` grown by its `perStep`, each `area-damage` given the DC. */
export function bakeCast(value, { steps = 0, dc = null } = {}) {
    if (Array.isArray(value)) return value.map((entry) => bakeCast(entry, { steps, dc }));
    if (!value || typeof value !== "object") return value;
    const out = Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, bakeCast(entry, { steps, dc })]));
    if (typeof out.formula === "string" && out.perStep !== undefined) {
        out.formula = growByStep(out.formula, out.perStep, steps);
        delete out.perStep;
    }
    if (out.type === "area-damage" && out.dc === undefined && dc) out.dc = dc;
    return out;
}

/** The granted action, as a plain source object. */
export function originActionSource({ spec, item, effect, token, steps, dc }) {
    const name = game.i18n.localize(spec.name ?? "");
    return {
        type: "action",
        name,
        img: item?.img ?? "icons/svg/explosion.svg",
        system: {
            actionType: { value: "action" },
            actions: { value: Number(spec.actions) || 1 },
            description: { value: `<p>${t("OriginAction.Description", { name, target: token?.name ?? "", spell: item?.name ?? "" })}</p>` },
            traits: { value: spec.traits ?? ["concentrate"], rarity: "common" },
        },
        flags: {
            [LIB_ID]: {
                [FLAG]: { effectUuid: effect.uuid, tokenUuid: token?.uuid ?? null },
                ...(spec.areaTargeting ? { areaTargeting: spec.areaTargeting } : {}),
                // `spends: false`: an action that uses nothing up — *Levitate*'s Sustain to move it.
                riders: [...(spec.spends === false ? [] : [{ event: "action-used", self: true, apply: { type: "spend-charge" } }]), ...bakeCast(spec.riders ?? [], { steps, dc })],
            },
        },
    };
}

export const OriginAction = {
    /** Give the effect's caster its action. `steps` and `dc` are the cast's. */
    async grant(effect, spec, context, { item = null, steps = 0, dc = null } = {}) {
        const origin = context.originActor;
        if (!origin || !effect || !spec) return null;
        const token = context.target?.document ?? context.target ?? null;
        const [created] = await origin.createEmbeddedDocuments("Item", [originActionSource({ spec, item, effect, token, steps, dc })]);
        if (created) await effect.setFlag(LIB_ID, FLAG, { actionUuid: created.uuid });
        return created ?? null;
    },

    /** The action was used: one charge off its effect; the last one ends it. */
    async spend(_rider, context) {
        const action = context.item;
        const spec = action?.flags?.[LIB_ID]?.[FLAG];
        if (!spec) return;
        const effect = spec.effectUuid ? await fromUuid(spec.effectUuid) : null;
        if (!effect) return;
        const left = Math.max(0, (Number(effect.system?.badge?.value) || 1) - 1);
        if (left > 0) {
            await effect.update({ "system.badge.value": left });
            context.notes.push(t("OriginAction.Left", { name: effect.name, left }));
            return;
        }
        context.notes.push(t("OriginAction.Last", { name: effect.name }));
        await effect.delete();
    },

    register() {
        // Aimed from the creature that carries the effect — *Blister*'s "cone originating from the target".
        AreaTargeting.registerOriginResolver("an action spent from a creature", 40, (_actor, item) => {
            const uuid = item?.flags?.[LIB_ID]?.[FLAG]?.tokenUuid;
            return uuid ? (fromUuidSync(uuid)?.object ?? null) : null;
        });
    },

    /** An effect gone — spent, expired or removed — takes its action off the caster. Active GM only. */
    registerHooks() {
        Hooks.on("deleteItem", (item) => {
            if (game.users.activeGM?.id !== game.user.id) return;
            const actionUuid = item.flags?.[LIB_ID]?.[FLAG]?.actionUuid;
            if (!actionUuid) return;
            setTimeout(async () => {
                const action = await fromUuid(actionUuid).catch(() => null);
                if (action) await action.delete().catch(() => {});
            }, LINGER_MS);
        });
    },
};
