import { LIB_ID } from "../id.mjs";
import { t } from "../i18n.mjs";
import { FLAG } from "./config.mjs";

const TOOLBELT_ID = "pf2e-toolbelt";

/**
 * Put the Technique's area on the board and let the caster aim it.
 *
 * Foundry v14 already does the hard part: `canvas.regions.placeRegion` shows a preview that follows the
 * cursor, confirms on left-click, cancels on Esc, and turns on **Shift+wheel** (Ctrl for finer steps — a
 * plain wheel zooms the canvas, which is why the rotation is easy to miss and why the notification names
 * the keys). pf2e already overrides its snapping per area shape (`RegionLayerPF2e#placeRegion` keys off
 * `displayMeasurements` + coverage highlighting, both of which the data below sets).
 *
 * It is placed with `create: false`, which returns the preview document instead of saving it. That is not
 * an optimisation — the area is discarded a moment later either way, so nothing is lost, and it buys three
 * things: creating a Region needs the `REGION_CREATE` permission that an ordinary player may not have,
 * a non-GM cannot create one at all while the game is paused, and an unsaved document cannot be left
 * behind by an error. A document that was never written also never fires `createRegion`, so the toolbelt's
 * template popup stays out of the way without depending on it honouring a flag.
 *
 * Returns the aimed Region, or null if the caster backed out.
 */
export async function placeArea(config, originToken) {
    // A self-anchored area is built where the caster stands, not where the mouse happens to be. An
    // emanation carries its own base and never asked; a cylinder does not — *Rozan Shō Ryū Ha* is "a
    // 10-foot-radius, 30-foot-tall cylinder centred on you", and a circle built at `canvas.mousePosition`
    // and then never placed lands wherever the pointer was resting, which is usually nobody.
    const point = config.anchor === "self" ? (originToken?.center ?? canvas.mousePosition) : canvas.mousePosition;
    const shape = shapeFromArea(config.area, originToken, point);
    if (!shape) {
        if (config.area.type === "emanation") {
            ui.notifications.warn(t("Aim.NoToken", { name: config.item.name }));
        }
        return null;
    }

    // An emanation has nowhere to be placed: it is centred on the caster's own space, so asking for a
    // click that can only land in one place is a click for nothing.
    if (config.anchor === "self") {
        return [new CONFIG.Region.documentClass(regionData(config, shape), { parent: canvas.scene })];
    }

    // Several placements, one after another. *Lightning Crown* is three 5-foot squares and gains more per
    // heightening step, which is why it was excluded from area targeting until now: one Region cannot be
    // three areas, but `placeRegions` aims a list of them in turn.
    const count = Math.max(1, config.areas ?? 1);
    if (count > 1) {
        const data = Array.from({ length: count }, () => regionData(config, shape));
        const placed = await canvas.regions.placeRegions(data, { create: false });
        return placed?.length ? placed : null;
    }

    // "A bolt of lightning strikes outward from your hand": a line or a cone that starts at the caster, so
    // the pointer turns it rather than carrying it off. Foundry's placement moves the whole shape with the
    // cursor; `onMove` keeps it pinned to the edge of the caster's space and only aims it.
    //
    // Foundry's own `placeRegion`, not pf2e's: `RegionLayerPF2e#placeRegion` replaces any `onMove` it is
    // handed with its own two-click aim (place the apex, then turn it), so ours never ran and the line went
    // wherever the pointer was. pf2e's direction snapping is kept here instead — lines every 5°, cones every
    // 45°, Ctrl for none.
    if (pinnedToCaster(config) && originToken) {
        const start = fromCaster(originToken, canvas.mousePosition);
        const pinned = { ...shapeFromArea(config.area, originToken, start), ...start };
        const step = config.area.type === "cone" ? 45 : 5;
        const place = foundry.canvas.layers.RegionLayer.prototype.placeRegion;
        const region = await place.call(canvas.regions, regionData(config, pinned), {
            create: false,
            allowRotation: false,
            onMove: ({ event, shape: moving, position }) => {
                const aimed = fromCaster(originToken, position);
                const snapped = event?.ctrlKey || event?.metaKey ? aimed.rotation : Math.round(aimed.rotation / step) * step;
                moving.updateSource(fromCaster(originToken, position, snapped));
                return false;
            },
        });
        return region ? [region] : null;
    }

    const region = await canvas.regions.placeRegion(regionData(config, shape), { create: false });
    return region ? [region] : null;
}

/** A line or cone aimed from the caster rather than placed: `anchor: "caster"`. */
export function pinnedToCaster(config) {
    return config?.anchor === "caster" && ["line", "cone"].includes(config.area?.type);
}

/**
 * Where a caster-anchored line or cone starts, and which way it points: on the edge of the caster's space,
 * facing the pointer. The edge rather than the centre, because "outward from your hand" starts where the
 * caster ends — a 120-foot line measured from the centre would be short by half a square.
 */
export function fromCaster(token, point, rotation = aimAngle(token.center, point)) {
    const center = token.center;
    const radians = (rotation * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    const halfW = (token.w ?? token.width ?? 0) / 2;
    const halfH = (token.h ?? token.height ?? 0) / 2;
    // The distance from the centre to the square's boundary along this direction.
    const reach = Math.min(Math.abs(cos) > 1e-9 ? halfW / Math.abs(cos) : Infinity, Math.abs(sin) > 1e-9 ? halfH / Math.abs(sin) : Infinity);
    const edge = Number.isFinite(reach) ? reach : 0;
    return { x: center.x + cos * edge, y: center.y + sin * edge, rotation };
}

/**
 * Where an aimed area actually landed, for the range check.
 *
 * The same three shapes `catch.mjs` reads an origin from, and for the same reason: a polygon keeps its
 * origin, an emanation keeps its base, and everything else is at its own coordinates.
 */
export function originOf(region) {
    const shape = region?.shapes?.at?.(0);
    if (!shape) return null;
    if (shape.origin) return shape.origin;
    if (shape.base) return { x: shape.base.x, y: shape.base.y };
    return Number.isFinite(shape.x) && Number.isFinite(shape.y) ? { x: shape.x, y: shape.y } : null;
}

function regionData(config, shape) {
    const { item } = config;
    const origin = typeof item.getOriginData === "function" ? item.getOriginData() : {};
    return {
        name: item.name,
        shapes: [shape],
        color: game.user.color.toString(),
        highlightMode: "coverage",
        displayMeasurements: true,
        visibility: CONST.REGION_VISIBILITY.ALWAYS,
        ownership: { [game.user.id]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER },
        flags: {
            // Belt and braces: nothing is created, so the toolbelt's `createRegion` hook cannot fire — but
            // if this ever does get saved, `targetHelper.skip` is its documented third-party opt-out and
            // stops it asking the same question a second time.
            [TOOLBELT_ID]: { targetHelper: { skip: true } },
            [LIB_ID]: { [FLAG]: { transient: true } },
            pf2e: {
                areaShape: config.area.type,
                origin: {
                    name: item.name,
                    slug: item.slug,
                    traits: foundry.utils.deepClone(item.system?.traits?.value ?? []),
                    ...origin,
                },
            },
        },
    };
}

/**
 * The same construction pf2e uses in `shapeDataFromEffectArea` (`src/module/canvas/helpers.ts`), repeated
 * here because a module cannot import the system's internals. Kept deliberately close to the original so
 * a synthetic area and a real one produce identical geometry.
 */
export function shapeFromArea(area, originToken, point) {
    const distance = (area.value / 5) * canvas.grid.size;
    const { x, y } = point ?? canvas.mousePosition;
    // A cone and a line open pointing away from the caster, toward wherever they were already looking,
    // rather than due east — which for a 60-foot line was the only direction it could be fired without
    // knowing about Shift+wheel. From here the wheel is a correction rather than the sole control.
    const rotation = aimAngle(originToken?.center, { x, y });
    switch (area.type) {
        case "burst":
        case "cylinder":
            return { type: "circle", radius: distance, x, y };
        case "cone":
            return { type: "cone", angle: 90, radius: distance, rotation, x, y };
        case "cube":
        case "square":
            return { type: "rectangle", width: distance, height: distance, x, y };
        case "emanation": {
            // An emanation normally spreads from the caster's own space, so it needs their token. An
            // *anchored* one — Senbonzakura Kageyoshi's second emanation — is centred on a remembered
            // point instead, and is simply a circle of the same radius around it.
            if (area.anchor) return { type: "circle", radius: distance, x, y };
            const source = originToken?.document?._source;
            if (!source) return null;
            const base = {
                type: "token",
                x: source.x,
                y: source.y,
                width: source.width,
                height: source.height,
                shape: source.shape,
            };
            return { type: "emanation", radius: distance, base, x: source.x, y: source.y };
        }
        case "line":
            return { type: "line", length: distance, width: canvas.dimensions.size, rotation, x, y };
        case "ring": {
            const width = Math.floor(canvas.dimensions.size * 0.5);
            return { type: "ring", radius: distance, innerWidth: width, outerWidth: width, x, y };
        }
        default:
            return null;
    }
}

/**
 * The direction from one point to another, in degrees, as a Region shape means it.
 *
 * Screen space, so y grows *downward*: 0° is east, 90° is south, 270° is north. That is the same convention
 * `RegionDocument` uses when it converts a MeasuredTemplate's `direction` into a shape rotation, and the
 * same one `wall.mjs` reads back when it lays the Crystal Wall along an aimed line — get the sign wrong here
 * and every line points at its own mirror image.
 *
 * Written without `Math.normalizeDegrees` so it can be tested outside Foundry.
 */
export function aimAngle(from, to) {
    if (!from || !to) return 0;
    if (!Number.isFinite(from.x) || !Number.isFinite(from.y)) return 0;
    if (!Number.isFinite(to.x) || !Number.isFinite(to.y)) return 0;

    const degrees = (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
    return ((degrees % 360) + 360) % 360;
}

/**
 * Remove a region this module put down.
 *
 * With `create: false` there is normally nothing to remove — the aimed area was never written to the
 * scene. This exists for the case where one somehow was, and it checks both that the document is really
 * embedded and that the flag says it is ours, so a region a GM placed by hand is never deleted.
 */
export async function discardArea(regions) {
    for (const region of [regions].flat().filter((r) => r)) {
        if (!region.id || !region.parent?.regions?.has(region.id)) continue;
        if (region.flags?.[LIB_ID]?.[FLAG]?.transient !== true) continue;
        await region.delete();
    }
}
