import { LIB_ID } from "../id.mjs";
import { flagOf } from "../lib/flags.mjs";
import { t } from "../i18n.mjs";
import { MovementCost } from "../lib/movement-cost.mjs";

/**
 * An aura that keeps creatures off its caster.
 *
 * *Repulsion*: "A creature must attempt a Will save if it's within the area when you Cast the Spell or as soon as it
 * enters the area … Once a creature has attempted the save, it uses the same result for that casting … Any
 * restrictions on a creature's movement apply only if it voluntarily moves toward you … Success The creature
 * treats each square in the area as difficult terrain when moving closer to you. Failure The creature can't move
 * closer to you within the area."
 *
 * The area is a lingering emanation that follows its caster (`followsCaster`), marked `repels`; each creature's
 * result is kept on it (`repelled`). A failure is a move refused before it is made (`preMoveToken`, on the mover's
 * own client); a success is the area's terrain, which counts only for that creature and only while it is getting
 * closer (`enemy-terrain.mjs`). Forced movement is not voluntary: the module's own pushes and pulls say so
 * (`forcedMovement`) and pass.
 *
 * *Circle of Protection*: "Summoned creatures of the chosen alignment can't willingly enter the area without succeeding
 * at a Will save; repeated attempts use the first save result." `repels.entry` bars a failed creature from stepping in
 * from outside, rather than from closing in, and a success passes freely; `repels.traits` (any of them) and
 * `repels.castTrait` (the trait the cast chose, by its flag) say who must save at all.
 */

const LINGERING = "lingering";

/** A token's centre at a position its top-left corner names. */
export function centreAt(position, token, gridSize) {
    return { x: position.x + (token.width * gridSize) / 2, y: position.y + (token.height * gridSize) / 2 };
}

/** Does going from `from` to `to` bring a point closer to `caster`? */
export function movesCloser(from, to, caster) {
    return Math.hypot(to.x - caster.x, to.y - caster.y) < Math.hypot(from.x - caster.x, from.y - caster.y) - 0.5;
}

/** Is a result one that bars moving closer? A failure, or worse — the spell names no critical failure of its own. */
export function barsApproach(result) {
    return result === "failure" || result === "criticalFailure";
}

/** The repelling areas on this scene, with their caster's token. */
function repellers(scene) {
    return scene.regions.filter((region) => flagOf(region, LINGERING)?.repels).map((region) => {
        const payload = flagOf(region, LINGERING);
        const caster = payload.originTokenUuid ? fromUuidSync(payload.originTokenUuid) : null;
        return { region, payload, caster };
    }).filter((r) => r.caster);
}

/** Within the area's radius of its caster? */
function inside(point, { region, caster }, scene) {
    const shape = region.shapes?.[0];
    const radius = Number(shape?.radius) || 0;
    const centre = centreAt(caster, caster, scene.grid.size);
    return Math.hypot(point.x - centre.x, point.y - centre.y) <= radius + (caster.width * scene.grid.size) / 2;
}

/** Must this creature save at all? Only one with any of `traits` and the trait the cast chose, when those are named. */
export function mustSave(repels, actor, caster, item) {
    const traits = actor?.system?.traits?.value ?? [];
    if (Array.isArray(repels?.traits) && !repels.traits.some((trait) => traits.includes(trait))) return false;
    if (repels?.castTrait) {
        const chosen = caster?.flags?.[LIB_ID]?.castChoices?.[(item?.original ?? item)?.id]?.[repels.castTrait];
        if (!chosen || !traits.includes(chosen)) return false;
    }
    return true;
}

export const Repels = {
    registerHooks() {
        Hooks.on("preMoveToken", (token, movement, operation) => {
            if (operation?.forcedMovement) return;
            const scene = token.parent;
            if (!scene) return;
            for (const area of repellers(scene)) {
                // Entering for the first time: the Will save comes first, and the step waits for it.
                if (area.payload.repels.entry && area.caster !== token && !area.payload.repelled?.[token.id]) {
                    const grid0 = scene.grid.size;
                    const into = inside(centreAt(movement.destination ?? token, token, grid0), area, scene) && !inside(centreAt(movement.origin ?? token, token, grid0), area, scene);
                    const item = area.payload.itemUuid ? fromUuidSync(area.payload.itemUuid) : null;
                    const caster = area.payload.originUuid ? fromUuidSync(area.payload.originUuid) : null;
                    if (into && mustSave(area.payload.repels, token.actor, caster, item)) {
                        ui.notifications.warn(t("Repels.SaveFirst", { name: token.name, area: area.payload.name ?? area.region.name }));
                        if (game.users?.activeGM?.id === game.user?.id) void Repels.save(area.region, token);
                        return false;
                    }
                }
                if (area.caster === token || !barsApproach(area.payload.repelled?.[token.id])) continue;
                const grid = scene.grid.size;
                const caster = centreAt(area.caster, area.caster, grid);
                const from = centreAt(movement.origin ?? token, token, grid);
                const to = centreAt(movement.destination ?? token, token, grid);
                const barred = area.payload.repels.entry ? inside(to, area, scene) && !inside(from, area, scene) : inside(to, area, scene) && movesCloser(from, to, caster);
                if (barred) {
                    ui.notifications.warn(t("Repels.Barred", { name: token.name, caster: area.caster.name, area: area.payload.name ?? area.region.name }));
                    return false;
                }
            }
        });
    },

    /**
     * A success "treats each square in the area as difficult terrain when moving closer": a step into the area that
     * brings it nearer the caster costs double — the move's price, step by step, where the direction is known.
     */
    register() {
        MovementCost.after("Repulsion: closing in is difficult", 50, (token, { from, to, distance }, cost) => {
            const scene = token.document?.parent ?? canvas.scene;
            if (!scene || !Number.isFinite(cost)) return;
            for (const area of repellers(scene)) {
                if (area.caster === token.document || area.payload.repels.entry || area.payload.repelled?.[token.document?.id] !== "success") continue;
                const a = canvas.grid.getCenterPoint(from);
                const b = canvas.grid.getCenterPoint(to);
                const caster = centreAt(area.caster, area.caster, scene.grid.size);
                if (inside(b, area, scene) && movesCloser(a, b, caster)) return Math.max(cost, distance * 2);
            }
        });
    },

    /** The Will save, once per creature per casting; its result is kept on the area. Active GM only. */
    async save(region, token) {
        const payload = flagOf(region, LINGERING);
        if (!payload?.repels || !token?.actor) return;
        if (payload.repelled?.[token.id]) return;
        const caster = payload.originUuid ? fromUuidSync(payload.originUuid) : null;
        if (caster && token.actor === caster) return;
        const item = payload.itemUuid ? await fromUuid(payload.itemUuid) : null;
        if (!mustSave(payload.repels, token.actor, caster, item)) return;
        const dc = item?.spellcasting?.statistic?.dc?.value ?? null;
        const statistic = token.actor.getStatistic?.(payload.repels.statistic ?? "will");
        if (!statistic || !dc) return;
        const roll = await statistic.roll({ dc: { value: dc }, skipDialog: true, item, extraRollOptions: ["repelled"] });
        const outcome = ["criticalFailure", "failure", "success", "criticalSuccess"][roll?.degreeOfSuccess ?? 1];
        await region.setFlag(LIB_ID, `${LINGERING}.repelled.${token.id}`, outcome);
    },
};
