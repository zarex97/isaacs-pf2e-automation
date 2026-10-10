import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";

/**
 * A chest kept on another plane.
 *
 * *Secret Chest*: "You banish a container and its contents to the Ethereal Plane, where you can retrieve it from later
 * … the container can't contain any creatures … You can Dismiss the spell to return the chest to your current location.
 * If the spell ends by any other means, the container is lost on the Ethereal Plane and you can no longer recall it with
 * this spell." `{ type: "stash", flag, bulk }` takes the container the cast named (10 Bulk or less, with what is in it)
 * off the caster and keeps it on a hidden loot actor, the Ethereal; the caster's effect lasts until their daily
 * preparations, with its Dismiss. Dismissed, the chest comes back to the caster's pack; ended any other way, it stays
 * where it is, marked lost.
 */

const FLAG = "secretChest";

/** The Bulk of a container with what is in it, in pf2e's light-as-a-tenth terms. */
export function bulkOf(container, items) {
    const inside = items.filter((item) => item.system?.containerId === container.id);
    const own = Number(container.system?.bulk?.value) || 0;
    return own + inside.reduce((sum, item) => sum + (Number(item.system?.bulk?.value) || 0) * (Number(item.system?.quantity) || 1), 0);
}

async function ethereal() {
    const plane = game.actors.find((a) => a.flags?.[LIB_ID]?.ethereal) ?? await Actor.create({ name: t("Chest.Ethereal"), type: "loot", flags: { [LIB_ID]: { ethereal: true } } });
    // Hidden from the players: pf2e gives a new loot actor limited ownership by default.
    if (plane && plane.ownership?.default !== 0) await plane.update({ "ownership.default": 0 });
    return plane;
}

/** Move a container and what is in it from one actor to another, keeping it a container. */
async function carry(from, to, container) {
    const inside = from.items.filter((item) => item.system?.containerId === container.id);
    const [moved] = await to.createEmbeddedDocuments("Item", [{ ...container.toObject(), _id: undefined }]);
    if (inside.length) await to.createEmbeddedDocuments("Item", inside.map((item) => ({ ...item.toObject(), _id: undefined, system: { ...item.toObject().system, containerId: moved.id } })));
    await from.deleteEmbeddedDocuments("Item", [container.id, ...inside.map((item) => item.id)]);
    return moved;
}

export async function stashChest(rider, context, chosen = {}) {
    const caster = context.originActor;
    const named = String(chosen[rider.apply.flag ?? "container"] ?? "").trim().toLowerCase();
    const container = caster?.items?.find((i) => i.name.toLowerCase() === named && i.type === "backpack");
    if (!container) {
        context.notes.push(t("Chest.NoContainer", { item: named }));
        return;
    }
    const bulk = bulkOf(container, [...caster.items]);
    if (bulk > (Number(rider.apply.bulk) || 10)) {
        context.notes.push(t("Chest.TooHeavy", { item: container.name, bulk }));
        return;
    }
    const plane = await ethereal();
    const moved = await carry(caster, plane, container);
    await caster.createEmbeddedDocuments("Item", [{
        type: "effect",
        name: `${context.item?.name ?? ""}: ${moved.name}`,
        img: moved.img,
        system: { duration: { value: 1, unit: "unlimited", expiry: null, sustained: false }, start: { value: game.time.worldTime }, rules: [] },
        flags: { [LIB_ID]: { [FLAG]: { chestId: moved.id }, untilPreparations: caster.uuid } },
    }]).then(async ([effect]) => {
        const { Dismiss } = await import("./dismiss.mjs");
        await Dismiss.grantForEffect(caster, context.item, effect);
    });
    context.notes.push(t("Chest.Banished", { item: moved.name }));
}

export const Chest = {
    registerHooks() {
        Hooks.on("deleteItem", async (item) => {
            if (game.users?.activeGM?.id !== game.user?.id || item.type !== "effect") return;
            const spec = item.flags?.[LIB_ID]?.[FLAG];
            if (!spec) return;
            const plane = game.actors.find((a) => a.flags?.[LIB_ID]?.ethereal);
            const chest = plane?.items.get(spec.chestId);
            if (!chest) return;
            // `dismissed` is written by the Dismiss itself, just before it ends the effect (`dismiss.mjs`).
            if (item.flags?.[LIB_ID]?.dismissed && item.actor) {
                await carry(plane, item.actor, chest);
                await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: item.actor }), content: `<p>${t("Chest.Returned", { item: chest.name, actor: item.actor.name })}</p>` });
            } else {
                await chest.update({ [`flags.${LIB_ID}.lost`]: true });
                await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: item.actor }), content: `<p>${t("Chest.Lost", { item: chest.name })}</p>` });
            }
        });
    },
};
