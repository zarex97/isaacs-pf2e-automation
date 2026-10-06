/**
 * Where other code plugs into the rider engine.
 *
 * The engine — events, targets, the twenty-odd apply types, receipts — is generic. The classes built on it
 * are not: Libra summons Arms, a Soulbound spends charges and Reiatsu, a Quincy's counteract refunds a point
 * and leaves the target off-guard, a Stargazer's Long Now stretches a minute to ten. Those used to be
 * branches inside `apply.mjs`, which tied the engine to every class that ever needed a word in it.
 *
 * Each of them is now a registration. Ordered lists run in ascending priority; a name is taken once.
 */

const applyTypes = new Map();
const strikeSelectors = new Map();
const originValues = [];
const dcResolvers = [];
const statisticResolvers = [];
const defaultStatistics = [];
const counteractRankBonuses = [];
const afterCounteract = [];
const saveModifiers = [];
const durationModifiers = [];
const teleportRefusals = [];
const effectFollowUps = [];
const areaAnchors = [];
const suppressibleTraits = new Set(["stance", "polymorph"]);
let suppressor = null;

function named(list, what, name, priority, fn) {
    if (typeof fn !== "function") throw new Error(`Isaac's Homebrew | rider ${what} "${name}" is not a function.`);
    if (list.some((entry) => entry.name === name)) {
        throw new Error(`Isaac's Homebrew | the rider engine already has a ${what} called "${name}".`);
    }
    list.push({ name, priority, fn });
    list.sort((a, b) => a.priority - b.priority);
}

const listed = (list) => list.map(({ name, priority }) => ({ name, priority }));

export const RiderExtensions = {
    /**
     * A rider apply type of another module's own: `{ apply: { type } }` dispatches to `fn(rider, context)`.
     * The built-in types cannot be replaced.
     */
    registerApplyType(type, fn, { builtIn = [] } = {}) {
        if (typeof fn !== "function") throw new Error(`Isaac's Homebrew | apply type "${type}" is not a function.`);
        if (applyTypes.has(type) || builtIn.includes(type)) {
            throw new Error(`Isaac's Homebrew | the rider engine already has an apply type "${type}".`);
        }
        applyTypes.set(type, fn);
    },
    applyType(type) {
        return applyTypes.get(type) ?? null;
    },

    /** A Strike a volley may name (`strikes.apply.strike`): `fn(actor, { exact })` → a strike action, or null. */
    registerStrikeSelector(name, fn) {
        if (strikeSelectors.has(name)) throw new Error(`Isaac's Homebrew | the rider engine already has a strike selector "${name}".`);
        strikeSelectors.set(name, fn);
    },
    strikeSelector(name) {
        return strikeSelectors.get(name) ?? null;
    },

    /**
     * A value a rider may ask the origin for: `match` is an exact expression (`"origin.libra.dice"`) or a
     * RegExp over it; `fn(context, match)` answers, or `undefined` to let the next one try.
     */
    registerOriginValue(name, match, fn) {
        named(originValues, "origin value", name, 0, fn);
        originValues.find((entry) => entry.name === name).match = match;
    },
    originValue(expression, context) {
        for (const { match, fn } of originValues) {
            const found = match instanceof RegExp ? match.exec(String(expression)) : expression === match ? [expression] : null;
            if (!found) continue;
            const value = fn(context, found);
            if (value !== undefined) return value;
        }
        return undefined;
    },

    /** A DC a rider may name (`dc: "<word>"`): `fn(dc, context)` → a number, or `undefined` to pass. */
    registerDcResolver(name, priority, fn) {
        named(dcResolvers, "DC resolver", name, priority, fn);
    },
    resolveDC(dc, context) {
        if (typeof dc === "number") return dc;
        for (const { fn } of dcResolvers) {
            const value = fn(dc, context);
            if (value !== undefined) return value;
        }
        return null;
    },

    /** A statistic by slug for an actor: `fn(actor, slug)` → a statistic, or `undefined` to pass. */
    registerStatisticResolver(name, priority, fn) {
        named(statisticResolvers, "statistic resolver", name, priority, fn);
    },
    statistic(actor, slug) {
        for (const { fn } of statisticResolvers) {
            const found = fn(actor, slug);
            if (found !== undefined) return found;
        }
        return actor?.getStatistic?.(slug) ?? null;
    },

    /** The statistic a counteract uses when the rider names none: `fn(actor)` → a slug, or `undefined`. */
    registerDefaultStatistic(name, priority, fn) {
        named(defaultStatistics, "default statistic", name, priority, fn);
    },
    defaultStatistic(actor) {
        for (const { fn } of defaultStatistics) {
            const slug = fn(actor);
            if (slug !== undefined) return slug;
        }
        return null;
    },

    /** Ranks added to a counteract: `fn(actor, item)` → a number. */
    registerCounteractRankBonus(name, priority, fn) {
        named(counteractRankBonuses, "counteract rank bonus", name, priority, fn);
    },
    counteractRankBonus(actor, item) {
        return counteractRankBonuses.reduce((total, { fn }) => total + (Number(fn(actor, item)) || 0), 0);
    },

    /**
     * After a counteract is rolled and its effect dealt with: `fn({ actor, effect, item, outcome,
     * counteracted, suppressed, suppressible })`, awaited in order.
     */
    registerAfterCounteract(name, priority, fn) {
        named(afterCounteract, "after-counteract step", name, priority, fn);
    },
    async afterCounteract(result) {
        for (const { fn } of afterCounteract) await fn(result);
    },

    /** Traits that mark an effect as a state to suppress rather than end. */
    registerSuppressibleTrait(trait) {
        suppressibleTraits.add(trait);
    },
    isSuppressible(effect) {
        return (effect?.system?.traits?.value ?? []).some((trait) => suppressibleTraits.has(trait));
    },

    /**
     * How a counteracted state is suppressed: `fn(effect, { actor, outcome })` → `{ suppressed, until }`,
     * where `until` is the phrase the card prints. One per world; without one, a suppressible effect that
     * is counteracted is ended like any other.
     */
    registerSuppressor(fn) {
        if (suppressor) throw new Error("Isaac's Homebrew | the rider engine already has a suppressor.");
        suppressor = fn;
    },
    async suppress(effect, details) {
        return suppressor ? suppressor(effect, details) : null;
    },

    /**
     * A change to a save the engine rolls: `fn({ statistic, context })` → `{ statistic?, modifiers? }`.
     * A later step sees the statistic an earlier one chose.
     */
    registerSaveModifier(name, priority, fn) {
        named(saveModifiers, "save modifier", name, priority, fn);
    },
    modifySave(statistic, context) {
        let slug = statistic;
        const modifiers = [];
        for (const { fn } of saveModifiers) {
            const change = fn({ statistic: slug, context }) ?? {};
            if (change.statistic) slug = change.statistic;
            if (Array.isArray(change.modifiers)) modifiers.push(...change.modifiers);
        }
        return { statistic: slug, modifiers };
    },

    /** A rider effect's duration, adjusted: `fn(duration, rider, context)` → a duration. */
    registerDurationModifier(name, priority, fn) {
        named(durationModifiers, "duration modifier", name, priority, fn);
    },
    duration(rider, context) {
        return durationModifiers.reduce((duration, { fn }) => fn(duration, rider, context) ?? duration, rider.duration);
    },

    /** A creature that refuses forced movement: `fn(token, context)` → the reason, or null. */
    registerTeleportRefusal(name, priority, fn) {
        named(teleportRefusals, "teleport refusal", name, priority, fn);
    },
    teleportRefusal(token, context) {
        for (const { fn } of teleportRefusals) {
            const reason = fn(token, context);
            if (reason) return reason;
        }
        return null;
    },

    /** After a rider's effect is created: `fn(rider, context, created)`, awaited in order. */
    registerEffectFollowUp(name, priority, fn) {
        named(effectFollowUps, "effect follow-up", name, priority, fn);
    },
    async afterEffect(rider, context, created) {
        for (const { fn } of effectFollowUps) await fn(rider, context, created);
    },

    /** Named points an area rider may be centred on (`area.anchor`): `fn(actor)` → `{ [name]: {x, y} }`. */
    registerAreaAnchors(name, fn) {
        named(areaAnchors, "area anchor source", name, 0, fn);
    },
    anchorsFor(actor) {
        return Object.assign({}, ...areaAnchors.map(({ fn }) => fn(actor) ?? {}));
    },

    /** Everything registered, for the console and the tests. */
    registered() {
        return {
            applyTypes: [...applyTypes.keys()],
            strikeSelectors: [...strikeSelectors.keys()],
            originValues: listed(originValues),
            dcResolvers: listed(dcResolvers),
            statisticResolvers: listed(statisticResolvers),
            defaultStatistics: listed(defaultStatistics),
            counteractRankBonuses: listed(counteractRankBonuses),
            afterCounteract: listed(afterCounteract),
            saveModifiers: listed(saveModifiers),
            durationModifiers: listed(durationModifiers),
            teleportRefusals: listed(teleportRefusals),
            effectFollowUps: listed(effectFollowUps),
            areaAnchors: listed(areaAnchors),
            suppressibleTraits: [...suppressibleTraits],
            suppressor: !!suppressor,
        };
    },
};
