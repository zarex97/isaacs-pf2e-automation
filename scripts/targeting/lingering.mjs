import { key, t } from "../i18n.mjs";
import { flagOf } from "../lib/flags.mjs";
import { configOf } from "../lib/config-of.mjs";
import { targetingOptions, testPredicate } from "../lib/roll-options.mjs";
import { allianceOf, catches } from "./enemy-terrain.mjs";
import { growByStep, inflictPersistent, postNotes, postPrompts, runSave } from "../riders/apply.mjs";
import { LIB_ID } from "../id.mjs";
import { Inside, insidePayload } from "./inside.mjs";
import { Sustain } from "../riders/sustain.mjs";
import { Dismiss } from "../riders/dismiss.mjs";
import { RiderExtensions } from "../riders/extensions.mjs";
import { combatOf } from "../lib/combat.mjs";
import { Relay } from "../riders/relay.mjs";
import { Repels } from "./repels.mjs";
import { Barrier } from "./barrier.mjs";

export const FLAG = "lingering";

/** The module's enemies-only movement-cost behavior. Spelled here so this file imports nothing new. */
const TERRAIN_TYPE = `${LIB_ID}.enemyMovementCost`;

/** The behavior type this module contributes, namespaced the way Foundry requires of a module. */
export const BEHAVIOR_TYPE = `${LIB_ID}.lingering`;

const UNIT_SECONDS = { seconds: 1, rounds: 6, minutes: 60, hours: 3600, days: 86400 };

/**
 * An area that stays behind after the Technique that made it.
 *
 * Two of Gemini's Techniques do not stop when the damage does. *Galaxian Explosion* leaves folded space —
 * "the area becomes difficult terrain for 1 minute" — and *Mavros Eruption Clast* leaves the ground
 * burning: "entering or ending a turn there deals 4d6 persistent fire". Both were prose. Neither could be
 * a rule element, because a rule element lives on an actor and this belongs to a patch of ground.
 *
 * The board already has the right object for it. Area targeting places the Technique's area as a Scene
 * Region and then throws it away; a lingering area is the same Region kept, with behaviors attached and an
 * expiry written onto it. Difficult terrain then costs no code at all — `modifyMovementCost` is a Foundry
 * behavior, so pathfinding, the ruler and the movement history all understand it without being told.
 *
 * The burning half does need code, and takes the supported route: a module may declare its own
 * RegionBehavior subtype in `module.json` and register the data model here. That gets the real region
 * events — `tokenMoveIn`, `tokenTurnEnd` — rather than a hook on token updates that would have to
 * re-derive containment Foundry has already worked out.
 */
export const Lingering = {
    register() {
        CONFIG.RegionBehavior.dataModels[BEHAVIOR_TYPE] = LingeringRegionBehaviorType;
        CONFIG.RegionBehavior.typeLabels[BEHAVIOR_TYPE] = key("Lingering.TypeLabel");
        CONFIG.RegionBehavior.typeIcons[BEHAVIOR_TYPE] = "fa-solid fa-fire";
        Sustain.onRegion = (region) => {
            const sustain = flagOf(region, FLAG)?.sustain;
            if (sustain?.move) return Lingering.fly(region);
            if (sustain?.bolt) return Lingering.bolt(region);
            return Lingering.grow(region);
        };
        Relay.register("lingeringBolt", (payload) => Lingering.strike(payload));
        Relay.register("lingeringCreate", (payload) => Lingering.createFor(payload));
    },

    registerHooks() {
        Hooks.on("updateWorldTime", () => Lingering.sweep());
        // An emanation goes where its caster goes — *Malediction* is "enemies in the area", and the area is
        // around the caster wherever they stand.
        Hooks.on("updateToken", (token, changes) => {
            if (game.users?.activeGM?.id !== game.user?.id) return;
            if (!("x" in changes || "y" in changes)) return;
            Lingering.follow(token);
        });
        Hooks.on("pf2e.startTurn", (combatant) => {
            Lingering.sweep();
            Lingering.endAtTurnOf(combatant?.actor);
            Lingering.drift(combatant?.actor);
        });
        Hooks.once("ready", () => Lingering.sweep());
        // An area deleted by hand — a Dismissed *Darkness* — takes its lights and walls with it. Only the
        // expiry sweep used to, so a dismissed darkness went on putting out every torch in the room.
        Hooks.on("deleteRegion", (region) => {
            if (game.users?.activeGM?.id !== game.user?.id) return;
            Lingering.clearScenery(region.parent, flagOf(region, FLAG));
        });
    },

    /** The lights and walls an area placed, whichever of them are still standing. */
    async clearScenery(scene, payload) {
        if (!scene || !payload) return;
        const lightIds = (payload.lightIds ?? []).filter((id) => scene.lights.has(id));
        const wallIds = (payload.wallIds ?? []).filter((id) => scene.walls.has(id));
        if (lightIds.length > 0) await scene.deleteEmbeddedDocuments("AmbientLight", lightIds);
        if (wallIds.length > 0) await scene.deleteEmbeddedDocuments("Wall", wallIds);
    },

    /**
     * Keep the area that was just aimed.
     *
     * Called from `AreaTargeting.run` beside `CrystalWall.build`, and for the same reason: both are
     * Techniques that leave something on the board, and both need the placement the caster actually
     * confirmed rather than a second one.
     */
    async create(config, regions, originToken) {
        const specs = Lingering.specsFor(config.item);
        const placed = [regions].flat().filter((region) => region);
        if (specs.length === 0 || placed.length === 0 || !canvas?.scene) return null;

        // Only a GM may create a Region that has behaviors. A player's cast hands the placement to the GM, who
        // builds the area from the same spell, rank and shapes (#58).
        if (!game.user?.isGM) {
            await Relay.request({
                action: "lingeringCreate",
                sceneId: canvas.scene.id,
                itemUuid: (config.item.original ?? config.item).uuid,
                rank: config.item.rank ?? null,
                steps: config.steps ?? 0,
                areaType: config.area?.type ?? "burst",
                areas: placed.map((region) => ({ shapes: region.toObject().shapes, color: region.color?.toString?.() ?? null })),
                originTokenUuid: originToken?.document?.uuid ?? originToken?.uuid ?? null,
                affected: [...(game.user?.targets ?? [])].map((t) => t.id),
            });
            return null;
        }

        // Every placement leaves its own patch behind, not just the first. Gemini and Cancer place one area
        // each, so this was a single region for two Cloths; *Lightning Crown* erupts three pillars and gains
        // more per heightening step, and each of them stands on its own square for its own round.
        // "If you cast this spell again, any previous scatter scree you've cast ends."
        if (specs.some((spec) => spec.replacesPrevious)) await Lingering.endPrevious(config.item);

        // A wall of sections — *Wall of Stone*, *Wall of Thorns* — is built along the placed runs (`barrier.mjs`); a
        // wall of squares gives each section its own patch of the spell's ground.
        const walled = specs.find((spec) => spec.barrier);
        if (walled) {
            const { barrier, ...ground } = walled;
            const seconds = walled.duration ? (Number(walled.duration.value) || 1) * (UNIT_SECONDS[walled.duration.unit ?? "minutes"] ?? 60) : null;
            return Barrier.build(barrier, config, placed, originToken, {
                expiresAt: seconds ? game.time.worldTime + seconds : null,
                makeRegion: (shapes, castId) => Lingering.createOne(ground, config, { shapes, color: placed[0].color, toObject: () => ({ shapes }) }, originToken, { castId, first: false }),
            });
        }

        // The areas of one cast know each other: *Lightning Storm*'s two clouds are one storm, with one Sustain.
        const castId = foundry.utils.randomID();
        const created = [];
        for (const [index, region] of placed.entries()) {
            for (const spec of specs) {
                const one = await Lingering.createOne(spec, config, region, originToken, { castId, first: index === 0 });
                if (one) created.push(one);
            }
        }
        // "Call down one lightning bolt within the spell's area" — the first bolt is part of the cast.
        if (created[0] && specs.some((spec) => spec.sustain?.bolt)) await Lingering.bolt(created[0]);
        return created.length > 0 ? created[0] : null;
    },

    /**
     * The patches this Technique leaves, after its predicates.
     *
     * **`lingering` may be a list**, and each entry may be predicated. Both halves were needed at once:
     * *Burner Finger Five* leaves difficult terrain always and, at Refined Release, ground that is also
     * *burning* for a round longer — two patches with different durations, which one spec cannot say.
     *
     * The predicate was already being authored before anything read it. `La Gota` and `Ennetsu Jigoku`
     * each gate their patch on `feature:refined-release`, and both laid it at every level, because
     * `create` took the flag whole and never looked at the field. It reads perfectly and did nothing —
     * which is the shape of nearly every defect this campaign has turned up.
     */
    specsFor(item) {
        const declared = configOf(item, FLAG);
        if (!declared) return [];
        const options = new Set([
            ...(item.actor?.getRollOptions?.() ?? []),
            ...(item.getRollOptions?.("item") ?? []),
        ]);
        return [declared].flat().filter((spec) => spec && testPredicate(spec.predicate, options));
    },

    /**
     * GM: a player's placement, built as their own cast would have built it. The spell is read back by uuid at the rank
     * it was cast at; the placed areas arrive as their shapes.
     */
    async createFor({ sceneId, itemUuid, rank, steps, areaType, areas, originTokenUuid, affected }) {
        if (canvas?.scene?.id !== sceneId) return null;
        const owned = itemUuid ? await fromUuid(itemUuid) : null;
        if (!owned || !Array.isArray(areas) || areas.length === 0) return null;
        const item = rank && rank !== owned.rank ? owned.clone({ "system.location.heightenedLevel": rank }, { keepId: true }) : owned;
        const originToken = originTokenUuid ? await fromUuid(originTokenUuid) : null;
        const regions = areas.map(({ shapes, color }) => ({ shapes, color, toObject: () => ({ shapes }) }));
        return Lingering.create({ item, steps, area: { type: areaType }, affected }, regions, originToken);
    },

    async createOne(spec, config, region, originToken, { castId = null, first = true } = {}) {
        const seconds = (Number(spec.duration?.value) || 1) * (UNIT_SECONDS[spec.duration?.unit ?? "minutes"] ?? 60);
        const behaviors = [];

        // Difficult terrain, in Foundry's own terms. The movement actions are read off the behavior's
        // *built* schema rather than enumerated, so a Foundry release that adds one gets it for free.
        //
        // `schema`, not `defineSchema()`: the latter is only safe during initialisation. It filters the
        // actions on `terrainAction`/`deriveTerrainDifficulty` being undefined, and by the time a Technique
        // is cast Foundry has filled both in on every action — so the list comes back empty and the
        // method's own `difficulties.at(-1).hint = …` throws on the empty array.
        if (spec.difficultTerrain) {
            const model = CONFIG.RegionBehavior.dataModels.modifyMovementCost;
            const actions = Object.keys(model?.schema?.fields?.difficulties?.fields ?? {});
            if (actions.length === 0) {
                console.warn("Isaac's PF2e Automation | no movement actions to make difficult; terrain skipped.");
            }
            const cost = Number(spec.difficultTerrain) || 2;
            if (actions.length > 0) {
                // `affects: "enemies"` swaps Foundry's own behavior for the module's subclass, which
                // filters on the moving token's alliance. Foundry's has no such field, so a petal storm
                // laid across a corridor used to slow the caster's own party too.
                const enemiesOnly = spec.affects === "enemies" && CONFIG.RegionBehavior.dataModels[TERRAIN_TYPE];
                behaviors.push({
                    type: enemiesOnly ? TERRAIN_TYPE : "modifyMovementCost",
                    name: t(enemiesOnly ? "Lingering.TerrainEnemies" : "Lingering.Terrain"),
                    system: { difficulties: Object.fromEntries(actions.map((action) => [action, cost])) },
                });
            }
        }

        if (spec.damage || spec.save) {
            behaviors.push({
                type: BEHAVIOR_TYPE,
                name: spec.name ?? config.item.name,
                // Leaving always counts: whatever the area left "until it leaves" — *Entangling Flora*'s
                // penalty, checked only at turn start — has to hear the creature go.
                system: { events: [...new Set([...(spec.events ?? ["tokenMoveIn", "tokenTurnEnd"]), "tokenExit"])] },
            });
        }
        // An area that changes whoever stands in it — *Mist*'s concealment — holds an effect on them while
        // they are inside, and `inside.mjs` puts it on and takes it off.
        if (spec.inside) {
            behaviors.push({
                type: BEHAVIOR_TYPE,
                name: spec.name ?? config.item.name,
                system: { role: "inside", events: ["tokenEnter", "tokenExit"] },
            });
        }
        // *Repulsion*: a Will save on entering, once; what the result does to moving closer is `repels.mjs`'s.
        if (spec.repels) {
            behaviors.push({ type: BEHAVIOR_TYPE, name: spec.name ?? config.item.name, system: { events: ["tokenEnter"] } });
        }
        // A patch of ground that only glows still needs somewhere to record when it stops. *Lightning
        // Crown*'s pillars carry no behavior at all — they shed light and block sight, which are a light
        // source and a set of walls rather than anything a Region does — so the Region here is the thing
        // that remembers to take them away again.
        const scenery = await Lingering.scenery(spec, region, config);
        // An area that does nothing on its own but move when Sustained — *Floating Flame* — is still kept.
        if (behaviors.length === 0 && scenery.lightIds.length === 0 && scenery.wallIds.length === 0 && !spec.sustain && !spec.drifts) return null;

        const [created] = await canvas.scene.createEmbeddedDocuments("Region", [
            {
                name: spec.name ?? `${config.item.name} — lingering`,
                shapes: region.toObject().shapes,
                color: region.color?.toString?.() ?? "#8a2be2",
                visibility: CONST.REGION_VISIBILITY.ALWAYS,
                behaviors,
                flags: {
                    [LIB_ID]: {
                        [FLAG]: {
                            expiresAt: game.time.worldTime + seconds,
                            name: spec.name ?? config.item.name,
                            itemUuid: config.item.uuid ?? null,
                            slug: config.item.slug ?? null,
                            until: spec.until ?? null,
                            followsCaster: spec.followsCaster === true,
                            drifts: spec.drifts ?? null,
                            castId,
                            repels: spec.repels ?? null,
                            repelled: {},
                            originTokenUuid: originToken?.document?.uuid ?? originToken?.uuid ?? null,
                            sustain: spec.sustain ? scaledSustain(spec.sustain, config.steps ?? 0) : null,
                            // Who the cast itself already reached: a Sustain's "not yet affected" leaves them be.
                            affected: config.affected ?? [...(game.user?.targets ?? [])].map((t) => t.id),
                            targetPredicate: spec.targetPredicate ?? null,
                            originUuid: config.item.actor?.uuid ?? null,
                            damage: spec.damage ? scaledDamage(spec.damage, config.steps ?? 0) : null,
                            save: spec.save ? scaledSave(spec.save, config.steps ?? 0) : null,
                            // Who the ground is *for*. `affects` was read for the movement cost and
                            // nowhere else, so a patch that dealt damage dealt it to everyone standing
                            // in it — the caster's own party, and the caster, who is at the centre of
                            // every emanation they cast. Driven live, an Arrogante ending their turn in
                            // their own Respira came away with persistent void damage, and so did the
                            // ally beside them.
                            affects: spec.affects ?? null,
                            inside: insidePayload(spec.inside, config.item),
                            ...scenery,
                        },
                    },
                    pf2e: { areaShape: config.area?.type ?? "burst" },
                },
            },
        ]);
        if (created && spec.sustain && first) await Sustain.grantForRegion(config.item?.actor, config.item, created, spec.sustain);
        if (created && spec.dismiss && first) await Dismiss.grantForRegion(config.item?.actor, config.item, created);
        // "Within the area when you Cast the Spell": everyone already inside saves now. Foundry works out who is
        // inside once the Region is saved.
        if (created && spec.repels) {
            await new Promise((resolve) => setTimeout(resolve, 250));
            for (const token of created.tokens ?? []) await Repels.save(created, token);
        }
        return created ?? null;
    },

    /**
     * The light and the walls, which are not Region behaviors and never will be.
     *
     * *"The pillars persist for 1 round, shedding bright light and blocking line of sight through their
     * squares."* Foundry has exactly the right documents for both halves — an `AmbientLight` and four
     * `Wall`s — and no Region behavior for either, so they are placed beside the Region and their ids are
     * written onto it. The sweep then takes all three away together, which is the only way a pillar cannot
     * leave an invisible barrier standing on the map for the rest of the session.
     *
     * The walls block sight and light and *not* movement: a pillar of lightning is something to walk
     * through and regret, not a wall to walk around.
     */
    async scenery(spec, region, config = {}) {
        const lightIds = [];
        const wallIds = [];
        const bounds = boundsOf(region);
        if (!bounds) return { lightIds, wallIds };

        // *Darkness*: "Light does not enter the area and any non-magical light sources … do not emanate any
        // light while inside the area … This also suppresses magical light of your darkness spell's rank or
        // lower." Foundry has that exact rule in a darkness source: it puts out every light whose priority is
        // not above its own. Ordinary lights sit at 0; the darkness takes the cast rank, so a magical light
        // given its rank as its priority outshines a darkness of lower rank and no other.
        if (spec.darkness) {
            const [darkness] = await canvas.scene.createEmbeddedDocuments("AmbientLight", [
                darknessSource(bounds, config.item?.rank, canvas.grid.size, canvas.scene.grid.distance),
            ]);
            if (darkness) lightIds.push(darkness.id);
        }

        if (spec.light) {
            const [light] = await canvas.scene.createEmbeddedDocuments("AmbientLight", [
                {
                    x: bounds.x + bounds.width / 2,
                    y: bounds.y + bounds.height / 2,
                    config: {
                        bright: Number(spec.light.bright) || 20,
                        dim: Number(spec.light.dim) || 40,
                        color: spec.light.color ?? null,
                        animation: { type: spec.light.animation ?? "pulse", speed: 5, intensity: 5 },
                    },
                    flags: { [LIB_ID]: { [FLAG]: true } },
                },
            ]);
            if (light) lightIds.push(light.id);
        }

        if (spec.blocksSight) {
            const corners = [
                [bounds.x, bounds.y, bounds.x + bounds.width, bounds.y],
                [bounds.x + bounds.width, bounds.y, bounds.x + bounds.width, bounds.y + bounds.height],
                [bounds.x + bounds.width, bounds.y + bounds.height, bounds.x, bounds.y + bounds.height],
                [bounds.x, bounds.y + bounds.height, bounds.x, bounds.y],
            ];
            const walls = await canvas.scene.createEmbeddedDocuments(
                "Wall",
                corners.map((c) => ({
                    c,
                    move: CONST.WALL_MOVEMENT_TYPES.NONE,
                    sight: CONST.WALL_SENSE_TYPES.NORMAL,
                    light: CONST.WALL_SENSE_TYPES.NORMAL,
                    sound: CONST.WALL_SENSE_TYPES.NONE,
                    flags: { [LIB_ID]: { [FLAG]: true } },
                })),
            );
            wallIds.push(...walls.map((wall) => wall.id));
        }

        return { lightIds, wallIds };
    },

    /**
     * The areas this caster left with this spell before, on every scene — ended because it was cast again.
     * Matched on the caster and the spell's slug, so a second copy of the spell on the same sheet counts.
     */
    async endPrevious(item) {
        const originUuid = item?.actor?.uuid;
        const slug = item?.slug ?? null;
        if (!originUuid || !slug) return;
        for (const scene of game.scenes) {
            const previous = scene.regions.filter((region) => {
                const payload = flagOf(region, FLAG);
                return payload?.originUuid === originUuid && payload?.slug === slug;
            });
            if (previous.length > 0) await scene.deleteEmbeddedDocuments("Region", previous.map((region) => region.id));
        }
    },

    /**
     * "Until the start of your next turn": *Gust of Wind* blows for the rest of the round and stops when
     * its caster's turn comes round again, which a clock in seconds cannot say. Active GM only.
     */
    async endAtTurnOf(actor) {
        if (game.users?.activeGM?.id !== game.user?.id || !actor?.uuid) return;
        for (const scene of game.scenes) {
            const ending = scene.regions.filter((region) => {
                const payload = flagOf(region, FLAG);
                return payload?.until === "originTurnStart" && payload.originUuid === actor.uuid;
            });
            if (ending.length > 0) await scene.deleteEmbeddedDocuments("Region", ending.map((region) => region.id));
        }
    },

    /**
     * *Toxic Cloud*: "the area moves 10 feet away from you each round." At the start of each of its caster's turns, a
     * drifting area moves its `drifts.feet` along the line from the caster through its centre. Active GM only.
     */
    async drift(actor) {
        if (game.users?.activeGM?.id !== game.user?.id || !actor?.uuid) return;
        for (const scene of game.scenes) {
            const caster = actor.getActiveTokens?.(true, true).find((token) => token.parent === scene);
            for (const region of scene.regions) {
                const payload = flagOf(region, FLAG);
                if (!payload?.drifts || payload.originUuid !== actor.uuid || !caster) continue;
                const shape = region.toObject().shapes[0];
                if (!shape || !Number.isFinite(shape.x)) continue;
                const step = ((Number(payload.drifts.feet) || 10) / (scene.grid.distance || 5)) * scene.grid.size;
                const to = drifted({ x: shape.x, y: shape.y }, tokenCentre(caster, scene), step, scene.grid.size);
                if (to.x !== shape.x || to.y !== shape.y) await region.update({ shapes: [{ ...shape, x: to.x, y: to.y }] });
            }
        }
    },

    /** Move the areas that follow this token so they stay centred on it. */
    async follow(token) {
        const scene = token?.parent;
        if (!scene) return;
        const centre = tokenCentre(token, scene);
        const at = { x: token._source?.x ?? token.x, y: token._source?.y ?? token.y };
        for (const region of scene.regions) {
            const payload = flagOf(region, FLAG);
            if (!payload?.followsCaster || payload.originTokenUuid !== token.uuid) continue;
            const shapes = region.toObject().shapes;
            const moved = shapes.map((s) => followed(s, centre, at));
            if (JSON.stringify(moved) !== JSON.stringify(shapes)) await region.update({ shapes: moved });
        }
    },

    /**
     * Sustained: the area widens, and the creatures it now reaches that it had not yet affected save.
     * *Malediction*: "increase the emanation's radius by 10 feet and force enemies in the area that weren't
     * yet affected to attempt a saving throw." Returns what the area now is, for the chat line.
     */
    async grow(region) {
        const payload = flagOf(region, FLAG);
        const scene = region.parent;
        const grow = payload?.sustain;
        if (!grow || !scene) return null;
        const perFoot = scene.grid.size / (scene.grid.distance || 5);
        const shapes = region.toObject().shapes.map((s) => (Number.isFinite(s.radius) ? { ...s, radius: s.radius + (Number(grow.radius) || 0) * perFoot } : s));
        await region.update({ shapes });
        const feet = Math.round((shapes[0]?.radius ?? 0) / perFoot);
        if (!grow.saveNewcomers || !payload.save) return `${feet} ft.`;

        // Foundry works out who is inside after the shape is saved; read it once it has.
        await new Promise((resolve) => setTimeout(resolve, 250));
        const originActor = payload.originUuid ? await fromUuid(payload.originUuid) : null;
        const item = payload.itemUuid ? await fromUuid(payload.itemUuid) : null;
        const affected = new Set(payload.affected ?? []);
        const newcomers = [...(region.tokens ?? [])].filter((token) => {
            if (affected.has(token.id) || token.actor === originActor || !token.actor) return false;
            if (payload.affects === "enemies" && !catches(allianceOf(originActor), allianceOf(token.actor))) return false;
            return !payload.targetPredicate || testPredicate(payload.targetPredicate, targetingOptions(originActor, token.actor, null));
        });
        for (const token of newcomers) {
            affected.add(token.id);
            const work = saveWork(token, originActor, item, region);
            await runSave(payload.save, work);
            if (work.notes.length > 0) await postNotes(work);
            if (work.prompts.length > 0) await postPrompts(work);
        }
        await region.setFlag(LIB_ID, `${FLAG}.affected`, [...affected]);
        return `${feet} ft.`;
    },

    /**
     * Sustained: the area moves, and whoever it passes over is hit. *Floating Flame*: "When you Sustain this spell,
     * you can levitate the flame up to 10 feet. It then deals damage to each creature whose space it shared at
     * any point during its flight. This uses the same damage and save, and you roll the damage once each time
     * you Sustain. A given creature can take damage from floating flame only once per round."
     *
     * The move is a compass direction and a distance in whole squares, so the path is the squares it visits.
     */
    async fly(region) {
        const payload = flagOf(region, FLAG);
        const scene = region.parent;
        const move = payload?.sustain;
        if (!move?.move || !scene) return null;
        const shape = region.toObject().shapes[0];
        if (!shape || !Number.isFinite(shape.x)) return null;
        const chosen = await chooseFlight(payload.name ?? region.name, Number(move.move) || 10, scene.grid.distance || 5);
        if (!chosen) return t("Lingering.Stayed");

        const size = scene.grid.size;
        const squares = chosen.feet / (scene.grid.distance || 5);
        const [dx, dy] = COMPASS[chosen.direction];
        const from = { x: shape.x, y: shape.y };
        const to = { x: shape.x + dx * squares * size, y: shape.y + dy * squares * size };
        const path = sweptPath(from, to, size);
        await region.update({ shapes: [{ ...shape, x: to.x, y: to.y }] });

        const originActor = payload.originUuid ? await fromUuid(payload.originUuid) : null;
        const round = combatOf(originActor)?.round ?? null;
        const burned = { ...(payload.burned ?? {}) };
        const side = Number(shape.width) || size;
        const caught = scene.tokens.filter((token) => token.actor
            && path.some((at) => overlaps(footprint(token, size), at, side))
            && !alreadyBurned(burned, token.id, round));
        if (caught.length > 0 && move.damage?.formula) {
            const item = payload.itemUuid ? await fromUuid(payload.itemUuid) : null;
            await burnAlong(caught, move.damage, item, originActor, payload.name ?? region.name);
            for (const token of caught) burned[token.id] = round;
        }
        await region.setFlag(LIB_ID, `${FLAG}.burned`, burned);
        return t("Lingering.Flew", { feet: chosen.feet, direction: t(`Move.Direction.${chosen.direction}`), count: caught.length });
    },

    /**
     * A bolt within the storm. *Lightning Storm*: "call down one lightning bolt within the spell's area. The bolt is a
     * vertical line from the top of the storm cloud to the ground below, dealing 4d12 electricity damage to
     * creatures in the line (basic Reflex save)." A vertical line on a flat map is one square, so the caster picks
     * the creature it falls on — any creature inside any cloud of the cast — or no one. Whoever picks, the GM
     * rolls it (`strike`): damage to another creature is not a player's to write.
     */
    async bolt(region) {
        const payload = flagOf(region, FLAG);
        const scene = region.parent;
        if (!payload?.sustain?.bolt || !scene) return null;
        const clouds = scene.regions.filter((r) => flagOf(r, FLAG)?.castId && flagOf(r, FLAG).castId === payload.castId);
        const inside = [...new Map([region, ...clouds].flatMap((r) => [...(r.tokens ?? [])]).filter((token) => token.actor).map((token) => [token.id, token])).values()];
        const tokenId = await chooseBoltTarget(payload.name ?? region.name, inside);
        if (!tokenId) return t("Lingering.NoBolt");
        const token = scene.tokens.get(tokenId);
        await Relay.request({ action: "lingeringBolt", regionUuid: region.uuid, tokenUuid: token?.uuid ?? null });
        return t("Lingering.Bolted", { name: token?.name ?? "" });
    },

    /** GM: the bolt falls on a creature that is inside a cloud of this storm. */
    async strike({ regionUuid, tokenUuid }) {
        const region = await fromUuid(regionUuid);
        const token = tokenUuid ? await fromUuid(tokenUuid) : null;
        const payload = flagOf(region, FLAG);
        const bolt = payload?.sustain?.bolt;
        if (!bolt || !token?.actor) return;
        const clouds = region.parent.regions.filter((r) => r === region || (payload.castId && flagOf(r, FLAG)?.castId === payload.castId));
        if (!clouds.some((r) => r.tokens?.has?.(token))) return;
        const originActor = payload.originUuid ? await fromUuid(payload.originUuid) : null;
        const item = payload.itemUuid ? await fromUuid(payload.itemUuid) : null;
        await burnAlong([token], bolt, item, originActor, payload.name ?? region.name, "Lingering.BoltFlavor");
    },

    /** Areas whose minute is up. Active GM only: this deletes documents. */
    async sweep() {
        if (game.users?.activeGM?.id !== game.user?.id) return;
        const now = game.time.worldTime;
        for (const scene of game.scenes) {
            const stale = scene.regions.filter((region) => {
                const expiry = flagOf(region, FLAG)?.expiresAt;
                return typeof expiry === "number" && expiry <= now;
            });
            if (stale.length === 0) continue;

            // Scenery first: a Region deleted while its walls are still standing leaves nothing behind to
            // say the walls were ever ours.
            for (const region of stale) await Lingering.clearScenery(scene, flagOf(region, FLAG));
            // One at a time, and quietly past one already gone: a wall's own sweep (`barrier.mjs`) may take a
            // section's Region on the same tick, and one failed id would otherwise keep every other one standing.
            for (const region of stale) {
                if (scene.regions.has(region.id)) await scene.deleteEmbeddedDocuments("Region", [region.id]).catch(() => null);
            }
        }
    },
};

const seenMovements = new Map();
const MOVEMENT_MEMORY_MS = 60_000;

/**
 * Is this the first event of its move action for this area and token? A movement continued from an earlier
 * one carries the ids before it in `chain`, so the first of those names the whole move. Events with no
 * movement — a turn starting — always count.
 */
export function firstForMovement(regionUuid, event, now = Date.now()) {
    const movement = event?.data?.movement;
    if (!movement?.id) return true;
    for (const [key, at] of seenMovements) if (now - at > MOVEMENT_MEMORY_MS) seenMovements.delete(key);
    const key = `${regionUuid}|${event.data.token?.id}|${movement.chain?.[0] ?? movement.id}`;
    if (seenMovements.has(key)) return false;
    seenMovements.set(key, now);
    return true;
}

/**
 * A shape moved to stay on its token. Foundry's emanation names the token's square it grows from (`base`, by its
 * top-left corner); a circle names its centre.
 */
export function followed(shape, centre, at) {
    if (shape.base && Number.isFinite(shape.base.x)) return { ...shape, base: { ...shape.base, x: at.x, y: at.y } };
    if (Number.isFinite(shape.x) && Number.isFinite(shape.y) && Number.isFinite(shape.radius)) return { ...shape, x: centre.x, y: centre.y };
    return shape;
}

/**
 * Where a drifting area's centre goes: `step` pixels further from `from` along the line through it, snapped to
 * the nearest grid intersection, as a burst's centre is. An area right on top of its caster has no "away" and stays.
 */
export function drifted(centre, from, step, gridSize) {
    const dx = centre.x - from.x;
    const dy = centre.y - from.y;
    const length = Math.hypot(dx, dy);
    if (!length) return { ...centre };
    const snap = (v) => Math.round(v / gridSize) * gridSize;
    return { x: snap(centre.x + (dx / length) * step), y: snap(centre.y + (dy / length) * step) };
}

/** A compass point as a step in squares (y grows downward). */
export const COMPASS = { n: [0, -1], ne: [1, -1], e: [1, 0], se: [1, 1], s: [0, 1], sw: [-1, 1], w: [-1, 0], nw: [-1, -1] };

/** Every position a square passes through moving straight from `from` to `to`, one grid step at a time, both ends included. */
export function sweptPath(from, to, gridSize) {
    const steps = Math.round(Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y)) / gridSize);
    if (!steps) return [{ ...from }];
    return Array.from({ length: steps + 1 }, (_, i) => ({
        x: from.x + ((to.x - from.x) * i) / steps,
        y: from.y + ((to.y - from.y) * i) / steps,
    }));
}

/** Does a footprint `{ x, y, w, h }` share any space with a square of side `side` whose corner is `at`? Touching edges don't count. */
export function overlaps(rect, at, side) {
    return rect.x < at.x + side && at.x < rect.x + rect.w && rect.y < at.y + side && at.y < rect.y + rect.h;
}

/** Has this creature already been hit by the area this round? Out of combat, every Sustain is a new round. */
export function alreadyBurned(burned, tokenId, round) {
    if (round === null || round === undefined) return false;
    return burned?.[tokenId] === round;
}

/** A Sustain's damage grows with the cast's heightening, as the ground's does. */
function scaledSustain(sustain, steps) {
    return {
        ...sustain,
        ...(sustain.damage ? { damage: scaledDamage(sustain.damage, steps) } : {}),
        ...(sustain.bolt ? { bolt: scaledDamage(sustain.bolt, steps) } : {}),
    };
}

function footprint(token, gridSize) {
    return { x: token._source?.x ?? token.x, y: token._source?.y ?? token.y, w: token.width * gridSize, h: token.height * gridSize };
}

/** Which way, and how far in whole squares, an area moves when Sustained. */
async function chooseFlight(name, maxFeet, step) {
    const options = Array.from({ length: Math.floor(maxFeet / step) }, (_, i) => (i + 1) * step);
    const select = `<select name="feet">${options.map((f) => `<option value="${f}" ${f === maxFeet ? "selected" : ""}>${f} ft.</option>`).join("")}</select>`;
    const points = ["nw", "n", "ne", "w", "e", "sw", "s", "se"];
    const result = await foundry.applications.api.DialogV2.wait({
        window: { title: t("Lingering.FlyTitle", { name }) },
        content: `<p>${t("Lingering.FlyHint", { name, feet: maxFeet })}</p><p>${select}</p>`,
        buttons: [
            ...points.map((p) => ({ action: p, label: t(`Move.Direction.${p}`), callback: (_event, button) => ({ direction: p, feet: Number(button.form?.elements?.feet?.value) || maxFeet }) })),
            { action: "stay", label: t("Move.Direction.stay"), callback: () => null },
        ],
        rejectClose: false,
    });
    return result?.direction ? result : null;
}

/** One damage roll for everyone the area passed over, each with its basic save against the spell's DC. */
async function burnAlong(tokens, damage, item, originActor, name, flavor = "Lingering.FlewFlavor") {
    const DamageRoll = CONFIG.Dice.rolls.find((cls) => cls.name === "DamageRoll");
    if (!DamageRoll) return;
    const roll = await new DamageRoll(`(${damage.formula})[${damage.type ?? "fire"}]`).evaluate();
    await roll.toMessage({ flavor: t(flavor, { name }), speaker: ChatMessage.getSpeaker({ actor: originActor }) });
    const dc = item?.spellcasting?.statistic?.dc?.value ?? RiderExtensions.statistic(originActor, "spellcasting")?.dc?.value ?? null;
    for (const token of tokens) {
        const statistic = token.actor.getStatistic?.(damage.save ?? "reflex");
        const save = statistic && dc ? await statistic.roll({ dc: { value: dc }, skipDialog: true, item, extraRollOptions: ["damaging-effect"] }) : null;
        const multiplier = BASIC_MULTIPLIER[save?.degreeOfSuccess ?? 1];
        if (multiplier > 0) await token.actor.applyDamage({ damage: multiplier === 1 ? roll : roll.alter(multiplier, 0), token, item });
    }
}

/** Which creature inside the storm a bolt falls on, or none. */
async function chooseBoltTarget(name, tokens) {
    const choice = await foundry.applications.api.DialogV2.wait({
        window: { title: t("Lingering.BoltTitle", { name }) },
        content: `<p>${t("Lingering.BoltHint", { name })}</p>`,
        buttons: [
            ...tokens.map((token) => ({ action: token.id, label: token.name })),
            { action: "none", label: t("Lingering.BoltNone") },
        ],
        rejectClose: false,
    });
    return choice && choice !== "none" ? choice : null;
}

/** A basic save's share of the damage, by degree of success (critical failure first). */
const BASIC_MULTIPLIER = [2, 1, 0.5, 0];

/** Where a token's centre is, from its stored position rather than its animation. */
function tokenCentre(token, scene) {
    const size = scene.grid.size;
    return { x: (token._source?.x ?? token.x) + (token.width * size) / 2, y: (token._source?.y ?? token.y) + (token.height * size) / 2 };
}

/** What a lingering area's check runs with — the creature, the caster, the spell, the area. */
function saveWork(token, originActor, item, region) {
    return {
        actor: token.actor,
        originActor,
        originToken: originActor?.getActiveTokens?.(true, true).at(0) ?? null,
        region: region.uuid,
        item,
        target: token,
        eventTarget: token,
        adjustments: [],
        notes: [],
        prompts: [],
        choices: [],
        moves: [],
    };
}

/** A darkness source filling the area, outranking light up to the cast rank. */
export function darknessSource(bounds, rank, gridSize, gridDistance) {
    const radius = (Math.min(bounds.width, bounds.height) / 2 / gridSize) * gridDistance;
    return {
        x: bounds.x + bounds.width / 2,
        y: bounds.y + bounds.height / 2,
        config: { negative: true, bright: radius, dim: radius, priority: Math.max(0, Number(rank) || 0) },
        flags: { [LIB_ID]: { [FLAG]: true } },
    };
}

/** The rectangle an aimed shape occupies, which is what a light is centred in and what walls are laid on. */
function boundsOf(region) {
    const shape = region?.shapes?.at?.(0);
    if (!shape) return null;
    if (shape.type === "rectangle") {
        return { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
    }
    const radius = Number(shape.radius);
    if (Number.isFinite(radius) && Number.isFinite(shape.x)) {
        return { x: shape.x - radius, y: shape.y - radius, width: radius * 2, height: radius * 2 };
    }
    return null;
}

/**
 * "+1d6 persistent per heightening step" has to be paid here.
 *
 * The Technique's own `system.damage` is heightened by pf2e; a formula that lives on a patch of ground is
 * not, so the growth is applied at the moment the ground is set alight. `config.steps` is the count area
 * targeting already worked out, sky included.
 */
export function scaledDamage(damage, steps) {
    const grown = { ...damage };
    // `perStepInterval: 2` is "+1d6 at every *other* increment", which two Techniques say out loud —
    // Ennetsu Jigoku's persistent fire, where the rider machinery already honoured it, and Respira's
    // miasma, where this did not. A rank-5 Respira grew its 1d6 tick to 5d6 instead of 3d6.
    const interval = Math.max(1, Number(damage.perStepInterval) || 1);
    const earned = Math.floor(steps / interval);
    if (damage.perStep && earned > 0) {
        const base = /^(\d*)d(\d+)$/.exec(String(damage.formula).trim());
        const per = /^(\d*)d(\d+)$/.exec(String(damage.perStep).trim());
        if (base && per && base[2] === per[2]) {
            grown.formula = `${(Number(base[1]) || 1) + (Number(per[1]) || 1) * earned}d${base[2]}`;
        } else if (/^\d+$/.test(String(damage.formula).trim()) && /^\d+$/.test(String(damage.perStep).trim())) {
            // A flat tick that grows by a flat amount — Ice Storm's "increases by 1".
            grown.formula = String(Number(damage.formula) + Number(damage.perStep) * earned);
        }
    }
    delete grown.perStep;
    delete grown.perStepInterval;
    return grown;
}

/**
 * "+1d8 per heightening step" has to be paid here too, for the one nested rider that names it that way.
 *
 * A save's nested `damage` rider almost always carries a literal formula — the two condition riders next to
 * it in *Royal Demon Rose* never grow at all. Only the damage does, so this walks the list once at cast
 * time and grows only what asks to, the same way `scaledDamage` does for a flat persistent tick.
 */
function scaledSave(save, steps) {
    const grown = foundry.utils.deepClone(save);
    for (const rider of grown.riders ?? []) {
        const formula = rider.apply?.formula;
        if (rider.apply?.type === "damage" && formula && typeof formula === "object") {
            rider.apply.formula = formula.perStep ? growByStep(formula.base, formula.perStep, steps) : formula.base;
        }
    }
    return grown;
}

/**
 * The behavior itself: burn whoever is standing here.
 *
 * `_handleRegionEvent` runs on every client that can see the event, so the guard is not optional — without
 * it a five-player table sets the same creature on fire five times. The payload is read off the Region
 * rather than held in this model's schema because it is written once, at cast time, by the caster's client:
 * a data model would have to declare every field, and the formula is not knowable until the Technique's
 * heightening has been counted.
 */
// Foundry's base is there whenever a module loads in a world; offline (the tests) there is no `foundry`, and
// the module must still load, so a plain class stands in. Nothing offline ever instantiates the behavior.
const RegionBehaviorBase = globalThis.foundry?.data?.regionBehaviors?.RegionBehaviorType ?? class {};

class LingeringRegionBehaviorType extends RegionBehaviorBase {
    static LOCALIZATION_PREFIXES = ["BEHAVIOR.TYPES.base"];

    static defineSchema() {
        return {
            events: this._createEventsField({
                events: [
                    CONST.REGION_EVENTS.TOKEN_ENTER,
                    CONST.REGION_EVENTS.TOKEN_MOVE_IN,
                    CONST.REGION_EVENTS.TOKEN_TURN_START,
                    CONST.REGION_EVENTS.TOKEN_TURN_END,
                    CONST.REGION_EVENTS.TOKEN_ROUND_END,
                    CONST.REGION_EVENTS.TOKEN_EXIT,
                    // "Begins to use a move action in the web": a move that starts inside leaves it or stays.
                    CONST.REGION_EVENTS.TOKEN_MOVE_OUT,
                    CONST.REGION_EVENTS.TOKEN_MOVE_WITHIN,
                ],
                initial: [CONST.REGION_EVENTS.TOKEN_MOVE_IN, CONST.REGION_EVENTS.TOKEN_TURN_END],
            }),
            // What this behavior does: burn or test whoever is on the ground, or hold an effect on whoever is
            // inside (`inside.mjs`). One declared type for both, so a new kind of area needs no new subtype —
            // and no world restart for Foundry to learn one.
            role: new foundry.data.fields.StringField({ required: true, choices: ["ground", "inside"], initial: "ground" }),
        };
    }

    async _handleRegionEvent(event) {
        if (game.users?.activeGM?.id !== game.user?.id) return;

        const region = this.parent?.region ?? this.parent?.parent;
        if (this.role === "inside") return Inside.handle(event, region);
        if (flagOf(region, FLAG)?.repels) {
            if (event.name === CONST.REGION_EVENTS.TOKEN_ENTER) await Repels.save(region, event.data?.token);
            return;
        }
        // Out of the area, out of what it does while you are in it — *Web*'s penalty to Speeds.
        if (event.name === CONST.REGION_EVENTS.TOKEN_EXIT) return Inside.leave(region, event.data?.token);
        const payload = flagOf(region, FLAG);
        const damage = payload?.damage;
        const actor = event.data?.token?.actor;
        if (!actor || (!damage?.formula && !payload?.save)) return;

        // One move action is one check, however many times Foundry reports it: a long drag into *Web* comes
        // as "moved in" and then "moved within", and both used to roll Athletics.
        // A wall of squares is one wall however many sections a move crosses: "for every move action a creature uses
        // to enter at least one of the wall's spaces".
        if (!firstForMovement(payload.castId ?? region?.uuid, event)) {
            if (event.name === CONST.REGION_EVENTS.TOKEN_MOVE_OUT) await Inside.leave(region, event.data.token);
            return;
        }

        // `originUuid` is the caster's *actor* — see `createOne` — not a token, so no `.actor` step here.
        const originActor = payload.originUuid ? await fromUuid(payload.originUuid) : null;

        // "An **enemy** that enters or ends its turn in the area." Terrain has honoured `affects` since
        // Senbonzakura's petals; damage and saves never did, and the content that says `enemies` was
        // catching the caster's own side. Declared-only, so a patch of ground that names no side keeps
        // catching everybody, which is what the three Techniques written that way mean.
        if (payload.affects === "enemies" && !catches(allianceOf(originActor), allianceOf(actor))) return;
        // Who the ground can touch at all — *Gust of Wind* does nothing to a creature larger than Large.
        if (payload.targetPredicate && !testPredicate(payload.targetPredicate, targetingOptions(originActor, actor, null))) return;

        // *Royal Demon Rose* is "any creature that starts its turn in the area must attempt a Fortitude
        // save" — a save with its own outcome ladder, not a flat tick, so it goes through the same
        // `runSave` a `save` rider would use rather than the flat persistent-damage path below.
        if (payload?.save) {
            if (!originActor) return;
            // The Technique that cast this ground, still on the caster's own sheet — `statistic.roll` wants
            // a real Item or nothing at all here, and a name-and-uuid stand-in tripped over the first pf2e
            // internal that expected `item.isOfType` to exist. `payload.itemUuid` is the owned item's own
            // uuid (`config.item.uuid` in `createOne`), so this is the genuine article, not a lookalike.
            const item = payload.itemUuid ? await fromUuid(payload.itemUuid) : null;
            const work = saveWork(event.data.token, originActor, item, region);
            await runSave(payload.save, work);
            // What the save's outcome left to the table is said, as it is after any other save. These lists
            // were handed in and never read back, so Grease's "fails to Balance" reached nobody.
            if (work.notes.length > 0) await postNotes(work);
            if (work.prompts.length > 0) await postPrompts(work);
            // A move that started inside and ended outside was checked on its way out; whatever that check
            // left for "while in the area" ends now that it is not. Asked of the token, not of the event:
            // Foundry reports such a move as "within", then "exit", then "out", all at once, and the exit's
            // own clean-up has already run by the time a check's roll comes back.
            if (!event.data.token?.regions?.has?.(region)) await Inside.leave(region, event.data.token);
            return;
        }

        const flags = {
            [LIB_ID]: {
                rider: { messageId: null, outcome: null, source: payload.itemUuid ?? null, note: payload.name ?? "" },
            },
        };

        // Persistent damage is a condition that already ticks itself, so re-applying it each turn refreshes
        // the burn rather than stacking a second one — which is what "entering *or* ending a turn there"
        // means when a creature does both.
        if (damage.persistent !== false) {
            await inflictPersistent(actor, {
                formula: damage.formula,
                damageType: damage.type ?? "fire",
                dc: Number(damage.dc) || 15,
                flags,
            });
            return;
        }

        const DamageRoll = CONFIG.Dice.rolls.find((cls) => cls.name === "DamageRoll");
        if (!DamageRoll) return;
        const roll = await new DamageRoll(`(${damage.formula})[${damage.type ?? "fire"}]`).evaluate();
        await roll.toMessage(
            { flavor: t("Lingering.Flavor", { name: payload.name ?? t("Lingering.TypeLabel"), actor: actor.name }) },
            { rollMode: game.settings.get("core", "rollMode") },
        );
        await actor.applyDamage({ damage: roll, token: event.data.token });
    }
}
