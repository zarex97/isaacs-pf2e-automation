import { CastPipeline } from "../cast-pipeline.mjs";
import { t } from "../i18n.mjs";
import { Extensions } from "./extensions.mjs";

/**
 * A spell that moves its caster to a chosen space.
 *
 * *Translocate*: "you instantly transport yourself … to an unoccupied space within range you can see." The
 * space is aimed like an area — a 5-foot square — and nobody is targeted: the placement is about a place.
 * Two things are checked where it lands, each the usual "cast anyway?" question:
 *
 *  - **unoccupied** — no other creature's space overlaps it;
 *  - **you can see** it — nothing blocks sight from the caster, unless the cast rank waives that
 *    (`moveCaster.seeBelowRank`: Translocate heightened to 5th needs only to have been there).
 *
 * The caster is moved only once the cast has gone through (a cast pipeline `after` stage), so a cast that
 * is refused after aiming — a spent use, a frequency — leaves them where they stood.
 */

const pending = new Map();

/** The other tokens whose space overlaps a rectangle. */
export function occupants(rect, tokens, self) {
    return tokens.filter((token) => {
        if (token === self) return false;
        // The document's position: a placeable that hasn't been drawn reports 0, 0.
        const doc = token.document;
        const grid = doc ? (doc.parent?.grid?.size ?? globalThis.canvas?.grid?.size ?? 100) : 0;
        const { x, y, w, h } = doc ? { x: doc.x, y: doc.y, w: doc.width * grid, h: doc.height * grid } : token;
        return x < rect.x + rect.width && x + w > rect.x && y < rect.y + rect.height && y + h > rect.y;
    });
}

/** Does this cast need to see where it goes? */
export function needsSight(spec, castRank) {
    const waivedFrom = Number(spec?.seeBelowRank);
    return !(waivedFrom > 0 && Number(castRank) >= waivedFrom);
}

export const MoveCaster = {
    register() {
        Extensions.registerAimed("the caster moves", 50, (config, regions, originToken) => MoveCaster.aimed(config, regions, originToken));
        CastPipeline.after("the caster moves", 60, (cast, spell) => MoveCaster.move(spell ?? cast));
    },

    async aimed(config, regions, originToken) {
        if (!config.moveCaster || !originToken) return undefined;
        const shape = regions.at(-1)?.shapes?.[0];
        if (!shape) return false;
        const rect = { x: shape.x, y: shape.y, width: shape.width ?? originToken.w, height: shape.height ?? originToken.h };
        const centre = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };

        const problems = [];
        const there = occupants(rect, canvas.tokens.placeables, originToken);
        if (there.length > 0) problems.push(t("Move.Occupied", { names: there.map((token) => token.document.name).join(", ") }));
        if (needsSight(config.moveCaster, config.item?.rank) && CONFIG.Canvas.polygonBackends.sight.testCollision(originToken.center, centre, { type: "sight", mode: "any" })) {
            problems.push(t("Move.Unseen"));
        }
        if (problems.length > 0) {
            const anyway = await foundry.applications.api.DialogV2.confirm({
                window: { title: config.item.name },
                content: `<p>${problems.join("; ")}.</p><p>${t("Aim.CastAnyway")}</p>`,
                rejectClose: false,
            });
            if (!anyway) return false;
        }

        // The token's own top-left, so a Large caster lands with its corner where the square was put.
        pending.set((config.item.original ?? config.item).uuid, { token: originToken.document.uuid, x: rect.x, y: rect.y });
        canvas.tokens.setTargets([]);
        return true;
    },

    async move(spell) {
        const key = (spell?.original ?? spell)?.uuid;
        const destination = key ? pending.get(key) : null;
        if (!destination) return;
        pending.delete(key);
        const token = await fromUuid(destination.token);
        // *Planar Tether*: "any teleportation effect that would move the target" — the caster's own *Translocate* too.
        const { PlanarTether } = await import("../riders/tether.mjs");
        if (token?.actor && await PlanarTether.holds({ actor: token.actor }, "teleport", { item: spell, dc: spell.spellcasting?.statistic?.dc?.value ?? null, rank: spell.rank })) return;
        await token?.update({ x: destination.x, y: destination.y }, { teleport: true, animate: false, forcedMovement: true });
    },
};
