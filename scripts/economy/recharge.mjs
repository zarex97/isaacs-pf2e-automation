import { flagOf } from "../lib/flags.mjs";
import { LIB_ID } from "../id.mjs";

export const FLAG = "recharge";

/**
 * The intervals pf2e writes down but never refills.
 *
 * `system.frequency.per` accepts `PT1M`, `PT10M`, `PT1H` and the rest, and the sheet shows them — but
 * `Actor#recharge` only takes `"turn" | "round" | "day"` (`actor/base.ts:2085`), so an ISO interval waits
 * for a full night's rest, where `Duration.fromISO(per) <= PT8H` sweeps it up with everything else. That is
 * the whole of backlog §4's "longer periods are on the honour system": not a missing concept, an
 * unimplemented interval.
 *
 * Foundry's `updateWorldTime` is the missing half, and it is a *core* hook — it fires whenever world time
 * moves, whoever moved it. pf2e's own World Clock drives it, and so does any calendar module, so nothing
 * here depends on one being installed.
 */
export const Recharge = {
    registerHooks() {
        Hooks.on("updateWorldTime", () => Recharge.onWorldTime());
        Hooks.on("updateItem", (item, changed) => Recharge.onItemUpdate(item, changed));
    },

    /**
     * Note when an allowance was spent.
     *
     * pf2e decrements `frequency.value` itself when an action is posted, and records nothing about when.
     * Stamping the world time here is what lets the refill be "an hour after you used it" rather than "on
     * the hour", which is what the Cloths actually say.
     */
    async onItemUpdate(item, changed) {
        if (!isTimekeeper()) return;
        const value = changed?.system?.frequency?.value;
        if (typeof value !== "number") return;
        if (!intervalSeconds(item.system?.frequency?.per)) return;

        if (value >= (item.system.frequency.max ?? 0)) {
            await item.unsetFlag(LIB_ID, `${FLAG}.spentAt`);
        } else {
            await item.setFlag(LIB_ID, `${FLAG}.spentAt`, game.time.worldTime);
        }
    },

    async onWorldTime() {
        if (!isTimekeeper()) return;
        const now = game.time.worldTime;

        for (const actor of game.actors) {
            const updates = [];
            for (const item of actor.items) {
                const frequency = item.system?.frequency;
                const seconds = intervalSeconds(frequency?.per);
                if (!seconds || frequency.value >= frequency.max) continue;

                // No stamp means the allowance was spent before this module was watching. Start the clock
                // now rather than refilling immediately, so a fresh world does not hand back every use.
                const spentAt = item.flags?.[LIB_ID]?.[FLAG]?.spentAt;
                if (typeof spentAt !== "number") {
                    await item.setFlag(LIB_ID, `${FLAG}.spentAt`, now);
                    continue;
                }
                if (now - spentAt < seconds) continue;

                updates.push({
                    _id: item.id,
                    "system.frequency.value": frequency.max,
                    [`flags.${LIB_ID}.${FLAG}.-=spentAt`]: null,
                });
            }
            if (updates.length > 0) await actor.updateEmbeddedDocuments("Item", updates);
        }
    },

    /**
     * Refill every allowance that recharges on a named period of its own.
     *
     * Some periods are not time at all. "Once per Zenith day" is close to pf2e's `per: "day"` but must not
     * reset on a rest — a Zenith is a property of the sky rather than of sleep — so the item names its
     * period in the `recharge` flag (`{ per: "zenith-day" }`) and whatever knows when that period turns
     * over calls this. `system.frequency.per` would have to be one of pf2e's own choices, and these are not.
     *
     * @param {string} per  The period that just turned over.
     */
    async refillPeriod(per) {
        if (!isTimekeeper()) return;

        for (const actor of game.actors) {
            const updates = actor.items
                .filter(
                    (item) =>
                        flagOf(item, FLAG)?.per === per &&
                        (item.system?.frequency?.value ?? 0) < (item.system?.frequency?.max ?? 0),
                )
                .map((item) => ({ _id: item.id, "system.frequency.value": item.system.frequency.max }));
            if (updates.length > 0) await actor.updateEmbeddedDocuments("Item", updates);
        }
    },
};

/**
 * Seconds in one of pf2e's ISO frequency intervals, or zero for one it already handles itself.
 *
 * `turn`, `round` and `day` are deliberately excluded: the system recharges those on its own, and refilling
 * them here would hand back a use pf2e had every intention of taking.
 */
export function intervalSeconds(per) {
    const match = /^PT(\d+)([MH])$/.exec(String(per ?? ""));
    if (!match) return 0;
    return Number(match[1]) * (match[2] === "H" ? 3600 : 60);
}

/** One client does the refilling, or five players refill the same item five times. */
function isTimekeeper() {
    return game.users.activeGM?.id === game.user.id;
}
