import { LIB_ID } from "../id.mjs";

/**
 * Which shape the caster chose, carried onto the spell's chat card.
 *
 * *Grease* is "an area or a target": four squares that make whoever stands on them fall prone, or one
 * object that is hard to hold. The choice is made as the spell is cast (`areaTargetingShapes`), and the
 * riders read later — when a save is rolled from the card — have to know which one it was, or the area's
 * prone lands on the wielder of a greased sword. So the choice is stamped on the card the cast posts, and a
 * rider can ask `rider:cast:shape:<type>`.
 */

/** A choice waits this long for its card. pf2e posts it within the same cast. */
const WINDOW_MS = 60_000;

let pending = null;

export const CastShape = {
    registerHooks() {
        Hooks.on("preCreateChatMessage", (message) => {
            if (!pending) return;
            if (Date.now() - pending.at > WINDOW_MS) {
                pending = null;
                return;
            }
            const uuid = message.flags?.pf2e?.origin?.uuid;
            if (!uuid || uuid !== pending.uuid) return;
            message.updateSource({ [`flags.${LIB_ID}.castShape`]: pending.shape });
            // A save rolled from pf2e's own button lands on a message of its own, which names the spell but
            // not the card — so the spell remembers how it was last cast, too.
            pending.item?.setFlag?.(LIB_ID, LAST, pending.shape)?.catch?.(() => {});
            pending = null;
        });
    },

    /** The caster chose this shape for this item; its next card says so. */
    expect(item, shape, now = Date.now()) {
        pending = { uuid: item.uuid, item: item.original ?? item, shape: { type: shape.type, value: shape.value ?? null }, at: now };
    },

    /** For the tests. */
    pending() {
        return pending;
    },
};

/** Where the spell keeps the shape it was last cast with. */
const LAST = "lastCastShape";

/**
 * The roll options a cast's chosen shape gives its riders: the card's own stamp, else — for a save on a
 * message of its own — the shape the spell was last cast with.
 */
export function shapeOptions(message, item) {
    const type = message?.flags?.[LIB_ID]?.castShape?.type ?? (item?.original ?? item)?.flags?.[LIB_ID]?.[LAST]?.type;
    return type ? [`rider:cast:shape:${type}`] : [];
}
