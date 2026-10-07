import { key, t } from "../i18n.mjs";
import { flagOf } from "../lib/flags.mjs";
import { configOf } from "../lib/config-of.mjs";
import { testPredicate } from "../lib/roll-options.mjs";
import { allianceOf, catches } from "./enemy-terrain.mjs";
import { growByStep, inflictPersistent, postNotes, postPrompts, runSave } from "../riders/apply.mjs";
import { LIB_ID } from "../id.mjs";
import { Inside, insidePayload } from "./inside.mjs";

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
    },

    registerHooks() {
        Hooks.on("updateWorldTime", () => Lingering.sweep());
        Hooks.on("pf2e.startTurn", () => Lingering.sweep());
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

        // Every placement leaves its own patch behind, not just the first. Gemini and Cancer place one area
        // each, so this was a single region for two Cloths; *Lightning Crown* erupts three pillars and gains
        // more per heightening step, and each of them stands on its own square for its own round.
        const created = [];
        for (const region of placed) {
            for (const spec of specs) {
                const one = await Lingering.createOne(spec, config, region, originToken);
                if (one) created.push(one);
            }
        }
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

    async createOne(spec, config, region, originToken) {
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
        // A patch of ground that only glows still needs somewhere to record when it stops. *Lightning
        // Crown*'s pillars carry no behavior at all — they shed light and block sight, which are a light
        // source and a set of walls rather than anything a Region does — so the Region here is the thing
        // that remembers to take them away again.
        const scenery = await Lingering.scenery(spec, region, config);
        if (behaviors.length === 0 && scenery.lightIds.length === 0 && scenery.wallIds.length === 0) return null;

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
            await scene.deleteEmbeddedDocuments("Region", stale.map((region) => region.id));
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
        // Out of the area, out of what it does while you are in it — *Web*'s penalty to Speeds.
        if (event.name === CONST.REGION_EVENTS.TOKEN_EXIT) return Inside.leave(region, event.data?.token);
        const payload = flagOf(region, FLAG);
        const damage = payload?.damage;
        const actor = event.data?.token?.actor;
        if (!actor || (!damage?.formula && !payload?.save)) return;

        // One move action is one check, however many times Foundry reports it: a long drag into *Web* comes
        // as "moved in" and then "moved within", and both used to roll Athletics.
        if (!firstForMovement(region?.uuid, event)) {
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
            const work = {
                actor,
                originActor,
                originToken: originActor.getActiveTokens(true, true).at(0) ?? null,
                region: region.uuid,
                item,
                target: event.data.token,
                eventTarget: event.data.token,
                adjustments: [],
                notes: [],
                prompts: [],
                choices: [],
                moves: [],
            };
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
