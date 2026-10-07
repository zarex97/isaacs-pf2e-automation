import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";

/**
 * An effect set aside for a while and put back with its clock stopped.
 *
 * *Sound Body*: "If you didn't counteract the effect, but you would have if its counteract rank were 2 lower, instead
 * suppress the effect until the beginning of your next turn. The effect's duration doesn't elapse while it's
 * suppressed." pf2e has no switch to turn an effect off, so the effect is taken off — its source kept on the
 * suppressor — and, as the suppressor's next turn begins, put back on its holder with its start moved on by the time
 * it was away. Whatever it granted goes with it and comes back with it.
 */

const FLAG = "setAside";

/** Take the effect off its holder until the suppressor's next turn. */
export async function setAside(effect, suppressor) {
    const owner = effect?.actor;
    if (!owner || !suppressor) return;
    const source = effect.toObject();
    const aside = [...(suppressor.getFlag(LIB_ID, FLAG) ?? []), { ownerUuid: owner.uuid, source, at: game.time.worldTime }];
    await effect.delete();
    await suppressor.setFlag(LIB_ID, FLAG, aside);
}

/** The start of an effect set aside at `at` and put back at `now`: moved on by the time it was away. Pure. */
export function resumedStart(start, at, now) {
    return (Number(start) || 0) + Math.max(0, (Number(now) || 0) - (Number(at) || Number(now) || 0));
}

/** The suppressor's turn begins: everything it set aside comes back. Active GM only. */
export async function restoreSetAside(actor) {
    const aside = actor?.getFlag?.(LIB_ID, FLAG);
    if (!Array.isArray(aside) || aside.length === 0) return;
    await actor.unsetFlag(LIB_ID, FLAG);
    for (const { ownerUuid, source, at } of aside) {
        const owner = await fromUuid(ownerUuid).catch(() => null);
        const holder = owner?.actor ?? owner;
        if (!holder) continue;
        if (source.system?.start) source.system.start.value = resumedStart(source.system.start.value, at, game.time.worldTime);
        delete source._id;
        await holder.createEmbeddedDocuments("Item", [source]);
        await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<p>${t("Counteract.Back", { effect: source.name, actor: holder.name })}</p>` });
    }
}

export const SetAside = {
    registerHooks() {
        Hooks.on("pf2e.startTurn", async (combatant) => {
            if (game.users.activeGM?.id !== game.user.id) return;
            await restoreSetAside(combatant?.actor);
        });
    },
};
