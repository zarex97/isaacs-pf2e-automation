import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";

/**
 * Seeing through another creature's eyes.
 *
 * *Animal Vision*: "You tap into the target's senses, allowing you to sense whatever it senses for the spell's
 * duration … While tapping into the target's senses, you can't use your own body's senses, but you can change back and
 * forth from your body's senses to the target's senses using a Sustain action." An effect on the caster carries
 * `sharesSenses: { tokenUuid, using }`. While `using`, the caster's players observe the creature — Foundry then shows
 * them what its token sees — and the caster's own token sees nothing. The holder's *Sustain* action switches between
 * the two. When the effect ends, both are put back as they were. Active GM only.
 */

const FLAG = "sharesSenses";
const ACTION = "switchSenses";

const isGM = () => game.users?.activeGM?.id === game.user?.id;
const playersOf = (actor) => Object.entries(actor?.ownership ?? {}).filter(([id, level]) => id !== "default" && level >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER && !game.users.get(id)?.isGM).map(([id]) => id);

/** The ownership an actor gets while these players borrow its senses, and what to put back after. */
export function lent(ownership, players, level) {
    const next = { ...ownership };
    for (const id of players) next[id] = Math.max(Number(ownership?.[id]) || 0, level);
    return next;
}

async function apply(effect, using, { record = true } = {}) {
    const spec = effect.flags[LIB_ID][FLAG];
    const animal = (await fromUuid(spec.tokenUuid))?.actor;
    const own = effect.actor?.getActiveTokens?.(true, true) ?? [];
    if (!animal) return;
    const players = playersOf(effect.actor);
    if (using) {
        await animal.update({ ownership: lent(animal.ownership, players, CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER) });
        for (const token of own) await token.update({ "sight.enabled": false });
    } else {
        await animal.update({ ownership: spec.ownership ?? animal.ownership }, { diff: false, recursive: false });
        for (const token of own) await token.update({ "sight.enabled": spec.sight?.[token.id] ?? true });
    }
    if (record) await effect.update({ [`flags.${LIB_ID}.${FLAG}.using`]: using });
}

export const SensesLink = {
    registerHooks() {
        Hooks.on("createItem", async (item) => {
            if (!isGM() || item.type !== "effect" || !item.flags?.[LIB_ID]?.[FLAG]) return;
            const spec = item.flags[LIB_ID][FLAG];
            const animal = (await fromUuid(spec.tokenUuid))?.actor;
            const own = item.actor?.getActiveTokens?.(true, true) ?? [];
            await item.update({ [`flags.${LIB_ID}.${FLAG}`]: { ...spec, ownership: foundry.utils.deepClone(animal?.ownership ?? {}), sight: Object.fromEntries(own.map((token) => [token.id, token.sight?.enabled ?? true])) } });
            await item.actor.createEmbeddedDocuments("Item", [{
                type: "action",
                name: t("SensesLink.Switch"),
                img: "icons/magic/perception/eye-ringed-green.webp",
                system: { actionType: { value: "action" }, actions: { value: 1 }, traits: { value: ["concentrate"] }, description: { value: `<p>${t("SensesLink.SwitchHint")}</p>` } },
                flags: { [LIB_ID]: { [ACTION]: item.uuid, withEffect: item.uuid } },
            }]);
            await apply(item, true);
        });
        Hooks.on("preDeleteItem", (item) => {
            if (!isGM() || item.type !== "effect" || !item.flags?.[LIB_ID]?.[FLAG]?.using) return;
            apply(item, false, { record: false }).catch(() => null);
        });
        // Sustain: the other set of senses.
        Hooks.on("createChatMessage", async (message) => {
            if (!isGM()) return;
            const effectUuid = message.item?.flags?.[LIB_ID]?.[ACTION];
            const effect = effectUuid ? await fromUuid(effectUuid) : null;
            if (!effect) return;
            const using = !effect.flags[LIB_ID][FLAG].using;
            await apply(effect, using);
            await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: effect.actor }), content: `<p>${t(using ? "SensesLink.Theirs" : "SensesLink.Own", { actor: effect.actor.name })}</p>` });
        });
    },
};
