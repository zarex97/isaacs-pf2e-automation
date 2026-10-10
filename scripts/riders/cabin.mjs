import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";
import { flagOf } from "../lib/flags.mjs";

/**
 * A cabin raised for the night.
 *
 * *Cozy Cabin*: "You shape a cabin 20 feet on each side … The interior is lit with a small magical light that you can
 * light or extinguish at will using a Sustain action … Other creatures can freely enter and exit the hut without
 * damaging it, but if you exit the hut, the spell ends. You can Dismiss the spell." A lingering area marked `cabin`
 * gets a light at its middle, kept with the area (its `lightIds`), and its caster a *Sustain* action that turns the
 * light off and on. When the caster's token leaves the area, the area goes, and the light and the action with it. Active
 * GM only.
 */

const ACTION = "cabinLight";

/** Is a point inside a square area's box? */
export function within(point, box) {
    return point.x >= box.x && point.x <= box.x + box.width && point.y >= box.y && point.y <= box.y + box.height;
}

const isGM = () => game.users?.activeGM?.id === game.user?.id;

function boxOf(region) {
    const s = region.shapes?.[0];
    return s ? { x: s.x, y: s.y, width: s.width ?? 0, height: s.height ?? 0 } : null;
}

export const Cabin = {
    registerHooks() {
        Hooks.on("createRegion", async (region) => {
            const spec = flagOf(region, "lingering");
            if (!isGM() || !spec?.cabin) return;
            const box = boxOf(region);
            const caster = spec.originUuid ? fromUuidSync(spec.originUuid) : null;
            if (!box || !caster) return;
            const [light] = await region.parent.createEmbeddedDocuments("AmbientLight", [{ x: box.x + box.width / 2, y: box.y + box.height / 2, config: { bright: 10, dim: 20, color: "#ffd9a0", alpha: 0.4 } }]);
            await region.update({ [`flags.${LIB_ID}.lingering.lightIds`]: [...(spec.lightIds ?? []), light.id] });
            await caster.createEmbeddedDocuments("Item", [{
                type: "action",
                name: t("Cabin.Light"),
                img: "icons/sundries/lights/lantern-iron-lit-yellow.webp",
                system: { actionType: { value: "action" }, actions: { value: 1 }, traits: { value: ["concentrate"] }, description: { value: `<p>${t("Cabin.LightHint")}</p>` } },
                flags: { [LIB_ID]: { [ACTION]: { regionUuid: region.uuid, lightId: light.id } } },
            }]);
        });
        // The Sustain: the light on or off.
        Hooks.on("createChatMessage", async (message) => {
            if (!isGM()) return;
            const spec = message.item?.flags?.[LIB_ID]?.[ACTION];
            const region = spec ? fromUuidSync(spec.regionUuid) : null;
            const light = region?.parent?.lights.get(spec?.lightId);
            if (!light) return;
            await light.update({ hidden: !light.hidden });
            await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: message.actor }), content: `<p>${t(light.hidden ? "Cabin.Dark" : "Cabin.Lit")}</p>` });
        });
        // The caster stepping out ends it.
        Hooks.on("updateToken", async (token, change) => {
            if (!isGM() || !("x" in change || "y" in change)) return;
            const grid = token.parent.grid.size;
            const centre = { x: token._source.x + (token.width * grid) / 2, y: token._source.y + (token.height * grid) / 2 };
            for (const region of token.parent.regions) {
                const spec = flagOf(region, "lingering");
                if (!spec?.cabin || spec.originUuid !== token.actor?.uuid) continue;
                const box = boxOf(region);
                if (box && !within(centre, box)) {
                    await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ token }), content: `<p>${t("Cabin.Left", { name: token.name })}</p>` });
                    await region.delete();
                }
            }
        });
        // The cabin gone: its light action goes too.
        Hooks.on("deleteRegion", async (region) => {
            if (!isGM() || !flagOf(region, "lingering")?.cabin) return;
            const caster = fromUuidSync(flagOf(region, "lingering").originUuid);
            const ids = caster?.items?.filter((i) => i.flags?.[LIB_ID]?.[ACTION]?.regionUuid === region.uuid).map((i) => i.id) ?? [];
            if (ids.length) await caster.deleteEmbeddedDocuments("Item", ids).catch(() => null);
        });
    },
};
