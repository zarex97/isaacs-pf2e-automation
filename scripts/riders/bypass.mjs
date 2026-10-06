import { testPredicate } from "../../automation.mjs";
import { LIB_ID } from "../id.mjs";

export const FLAG = "bypass";

/**
 * Getting past a target's immunities, resistances and Hardness.
 *
 * The backlog said this needed "a damage-application hook that recomputes IWR with our overrides, since
 * `DamageAlteration` has no property for ignore-the-target's-resistance". The rule element indeed has no
 * such property — but the damage *roll* does. `roll.options.bypass` is a `DamageIRBypassData`
 * (`system/damage/types.ts`) that `applyIWR` reads on every application, and property runes are the only
 * thing populating it today. Merging into it rather than recomputing IWR ourselves means weaknesses,
 * immunity redirects, critical-hit immunity and the breakdown printed in chat all keep working.
 *
 * Two things it cannot do, and which are handled by shadowing the target instead:
 *
 *  - **Partial resistance reduction.** `IgnoredResistance` has a `max`, and its doc comment promises
 *    "ignore up to a maximum" — but `applyIWR` only ever reads it as a display value: an ignored
 *    resistance is dropped whole (`iwr.ts:210` filters on the boolean). *Atomic Dissolution*'s "treat
 *    resistance as 5 lower" therefore cannot go through `bypass` at all.
 *  - **Hardness**, which `applyDamage` reads straight off `actor.hardness` and which `bypass` says
 *    nothing about.
 */
/**
 * Every bypass the origin is carrying, plus the one the damage came from.
 *
 * `dealtBy` is not a convenience. A Severing Art **ends Severance**, and Severance is what granted it, so
 * by the time the damage is applied the Art has been taken back off the sheet — and a scan of the
 * origin's live items finds nothing. Mugetsu says it "ignores all resistances and immunities to spirit
 * damage" and was being stopped dead by a target immune to spirit: 70 damage, 0 taken. Every one of the
 * fifteen Arts had the same hole, because ending Severance is the one thing they all do.
 *
 * The item that dealt the damage is the authority on what that damage gets past, whether or not the
 * sheet still lists it. Deduplicated by id so an item that *is* still equipped is not counted twice.
 */
/** Where a Severing Art's bypass is kept once the Art itself has been taken back off the sheet. */
export const MEMORY = "severingBypass";

/**
 * The bypass of the Severing Art this creature has just spent, if any.
 *
 * Using an Art **ends Severance**, and Severance is what granted it, so the Art is off the sheet before
 * its damage is ever rolled — let alone applied. By then the chat card cannot resolve its own item
 * either, so `applyDamage` is handed `item: null` and there is nothing left to read a bypass from.
 * Mugetsu promises to ignore "all resistances and immunities to spirit damage" and was being stopped
 * dead by a target immune to spirit: 78 rolled, 0 taken. All fifteen Arts had it, because ending
 * Severance is the one thing every one of them does.
 *
 * So the Art's bypass is copied onto the creature as it goes, and pinned to that Art by slug — the
 * predicate machinery already tests `item:slug:`, so nothing else this creature does for the rest of the
 * encounter picks it up. It is cleared the next time Severance begins.
 */
export function rememberedEntries(actor) {
    const kept = actor?.getFlag?.(LIB_ID, MEMORY);
    if (!kept?.slug || !Array.isArray(kept.entries)) return [];
    const item = { id: `remembered-${kept.slug}`, name: kept.name ?? kept.slug };
    return kept.entries.map((entry) => ({
        item,
        entry: {
            ...entry,
            // Two spellings of the same pin. `item:slug:` is what an item's own roll options say; a chat
            // message describes the same item from the outside, as `origin:item:slug:`. The bypass is
            // read from both places, so it has to answer to both names.
            predicate: [
                ...(entry.predicate ?? []),
                { or: [`item:slug:${kept.slug}`, `origin:item:slug:${kept.slug}`] },
            ],
        },
    }));
}

/**
 * A bypass written on a Technique belongs to that Technique's damage, and to nothing else.
 *
 * Every entry was being collected off every item the origin carries and tested against the damage in
 * front of it, which is right for a **state** — Higashi's "your Strikes ignore all resistances" is a
 * property of the creature while the aspect is up — and wrong for a **Technique**. Ryūjin Jakka's Kita
 * says *"this damage cannot be reduced by resistance to fire"* about a 60-foot line, and because the
 * spell sat in the repertoire, every ordinary Strike that Soul Reaper made ignored fire resistance too.
 * Driven live, with no aspect selected at all: `resistance.ignore: fire, physical` on a plain Strike.
 *
 * So a spell's entry is pinned to that spell. Effects and feats stay broad, because a state is exactly
 * what they are. Both spellings of the pin are accepted — an item describes itself as `item:slug:`, and
 * a chat message describes it from outside as `origin:item:slug:`.
 */
function pinToSource(entry, item) {
    if (item?.type !== "spell") return entry;
    const slug = item.slug ?? item.system?.slug;
    if (!slug) return entry;
    return {
        ...entry,
        predicate: [
            ...(entry.predicate ?? []),
            { or: [`item:slug:${slug}`, `origin:item:slug:${slug}`] },
        ],
    };
}

export function bypassEntriesOn(actor, dealtBy = null) {
    const entries = [];
    const seen = new Set();
    const consider = (item) => {
        if (!item || seen.has(item.id)) return;
        seen.add(item.id);
        const flagged = item.flags?.[LIB_ID]?.[FLAG];
        if (!Array.isArray(flagged)) return;
        entries.push(...flagged.map((entry) => ({ entry: pinToSource(entry, item), item })));
    };
    for (const item of actor?.items ?? []) consider(item);
    consider(dealtBy);
    entries.push(...rememberedEntries(actor));
    return entries;
}

/** The entries whose predicate matches this damage. */
export function selectEntries(entries, options) {
    return entries.filter(({ entry }) => testPredicate(entry.predicate, options));
}

/**
 * Fold matching entries into a `DamageIRBypassData`.
 *
 * Pure, so the merge can be tested without a damage roll. `types: "all"` is expanded by the caller rather
 * than here, because "all" should mean the types this damage actually deals — emitting eighty ignore
 * entries for a single cold instance would be correct and useless.
 */
export function mergeBypass(existing, entries, damageTypes) {
    const bypass = {
        immunity: {
            ignore: [...(existing?.immunity?.ignore ?? [])],
            downgrade: [...(existing?.immunity?.downgrade ?? [])],
            redirect: [...(existing?.immunity?.redirect ?? [])],
        },
        resistance: {
            ignore: [...(existing?.resistance?.ignore ?? [])],
            redirect: [...(existing?.resistance?.redirect ?? [])],
        },
    };

    for (const { entry } of entries) {
        const resistance = entry.resistance;
        // Only a total ignore goes through `bypass`; a partial reduction is applied to the target instead.
        if (resistance && resistance.max == null) {
            for (const type of expand(resistance.types, damageTypes)) {
                if (!bypass.resistance.ignore.some((r) => r.type === type)) {
                    bypass.resistance.ignore.push({ type, max: Infinity });
                }
            }
        }

        const immunity = entry.immunity;
        if (immunity?.mode === "ignore") {
            for (const type of expand(immunity.types, damageTypes)) {
                if (!bypass.immunity.ignore.includes(type)) bypass.immunity.ignore.push(type);
            }
        } else if (immunity?.mode === "downgrade") {
            for (const type of expand(immunity.types, damageTypes)) {
                if (bypass.immunity.downgrade.some((d) => d.type === type)) continue;
                // `resistence` is pf2e's spelling in DowngradedImmunity, and the field it actually reads.
                bypass.immunity.downgrade.push({ type, resistence: Number(immunity.resistance) || 0 });
            }
        }
    }

    return bypass;
}

function expand(types, damageTypes) {
    if (types === "all") return damageTypes;
    return Array.isArray(types) ? types : [];
}

/** The largest partial reduction any matching entry asks for. Zero means none of them do. */
export function resistanceReduction(entries) {
    return entries.reduce((most, { entry }) => {
        const max = entry.resistance?.max;
        return typeof max === "number" && max > most ? max : most;
    }, 0);
}

/**
 * The damage types whose *immunity* these entries ignore.
 *
 * `bypass.immunity.ignore` is a field pf2e defines and never reads. `applyIWR` consults exactly three
 * things on the bypass — `resistance.ignore`, `resistance.redirect` and `immunity.redirect` — and decides
 * immunity separately, by asking the target `isAffectedBy(type)`. So an Art that "ignores all immunities"
 * was filling in a field nobody opens, and a creature immune to spirit took nothing from Mugetsu.
 *
 * Immunity therefore has to be got past the same way partial resistance and Hardness are: by shadowing
 * the target for the length of one application.
 */
export function ignoredImmunities(entries, damageTypes) {
    const types = new Set();
    for (const { entry } of entries) {
        if (entry.immunity?.mode !== "ignore") continue;
        for (const type of expand(entry.immunity.types, damageTypes)) types.add(type);
    }
    return [...types];
}

export function ignoresHardness(entries) {
    return entries.some(({ entry }) => entry.hardness === "ignore");
}

/**
 * Shadow the parts of the target that `bypass` cannot reach, for the length of one application.
 *
 * `hardness` is a prototype getter, so an own property shadows it and deleting restores it. Resistances
 * are prepared data that is rebuilt on every `prepareData`, so lowering their values in place and putting
 * them back is safe for the duration of a single call — and is the only way to express "treat resistance
 * as 5 lower", since pf2e's own `max` is not honoured.
 *
 * Returns a function that undoes everything it did.
 */
export function shadowTarget(actor, { reduction = 0, hardness = false, immunities = [], types = null } = {}) {
    const undo = [];

    // Taken out of the live array rather than filtered into a new one: `attributes.immunities` is read
    // by reference inside `applyIWR`, so a replacement array would be ignored.
    if (immunities.length > 0) {
        const held = actor.attributes?.immunities;
        if (Array.isArray(held)) {
            const removed = [];
            for (let index = held.length - 1; index >= 0; index -= 1) {
                if (!immunities.includes(held[index]?.type)) continue;
                removed.push({ index, immunity: held[index] });
                held.splice(index, 1);
            }
            if (removed.length > 0) {
                undo.push(() => {
                    for (const { index, immunity } of removed.reverse()) held.splice(index, 0, immunity);
                });
            }
        }
    }

    // `true` ignores Hardness; a number ignores that much of it ("ignore an object's Hardness up to 10").
    if (hardness && actor.hardness > 0) {
        const left = hardness === true ? 0 : Math.max(0, actor.hardness - Number(hardness));
        Object.defineProperty(actor, "hardness", { value: left, configurable: true, writable: true });
        undo.push(() => delete actor.hardness);
    }

    if (reduction > 0) {
        for (const resistance of actor.attributes?.resistances ?? []) {
            const was = resistance.value;
            if (typeof was !== "number") continue;
            // `types` narrows the reduction to those resistances: "use whichever resistance is lower" lowers fire's alone.
            if (Array.isArray(types) && !types.includes(resistance.type)) continue;
            resistance.value = Math.max(0, was - reduction);
            undo.push(() => {
                resistance.value = was;
            });
        }
    }

    return () => {
        for (const restore of undo.reverse()) {
            try {
                restore();
            } catch (error) {
                console.error("Isaac's Homebrew | could not restore a shadowed target", error);
            }
        }
    };
}

/**
 * Put the bypass on the damage roll, where it survives the item that granted it.
 *
 * `applyDamage` is handed `{damage, token, item, rollOptions, …}` and nothing else — no message, no
 * origin actor. When `item` is null, as it is for every Severing Art, there is no thread back to whoever
 * dealt the damage and `applyBypass` can only stand down.
 *
 * A damage roll on its way to chat still knows all of it. `flags.pf2e.origin` names the actor and the
 * item and carries sixty-odd roll options describing both, and `roll.options.bypass` is the field
 * `applyIWR` reads at application time regardless of what still exists by then. So the merge is done
 * here as well as at application: this one is what makes an Art's damage keep its promise, and the
 * application-time pass stays because it is the one that can also shadow Hardness.
 *
 * Rolls are rewritten through `updateSource` on the message's own serialized copies. Mutating the live
 * `message.rolls` getter would be lost — it deserializes a fresh object every read.
 */
export function registerRollBypass() {
    Hooks.on("preCreateChatMessage", (message) => {
        try {
            const sources = message._source?.rolls ?? [];
            if (sources.length === 0) return;
            const originFlag = message.flags?.pf2e?.origin;
            const origin = originFlag?.actor ? fromUuidSync(originFlag.actor) : null;
            if (!origin) return;

            const item = originFlag.uuid ? fromUuidSync(originFlag.uuid) : null;
            const entries = bypassEntriesOn(origin, item);
            if (entries.length === 0) return;

            let changed = false;
            const rewritten = sources.map((json, index) => {
                const data = typeof json === "string" ? JSON.parse(json) : foundry.utils.deepClone(json);
                if (data?.class !== "DamageRoll") return json;

                const types = (message.rolls?.[index]?.instances ?? [])
                    .map((instance) => instance.type)
                    .filter(Boolean);
                if (types.length === 0) return json;

                const options = new Set([
                    ...(originFlag.rollOptions ?? []),
                    ...(origin.getRollOptions?.() ?? []),
                    ...(item?.getRollOptions?.("item") ?? []),
                    ...types.map((type) => `damage:type:${type}`),
                ]);
                const matching = selectEntries(entries, options);
                if (matching.length === 0) return json;

                data.options = { ...(data.options ?? {}) };
                data.options.bypass = mergeBypass(data.options.bypass, matching, types);
                // Kept beside the bypass for the half pf2e will not read: immunity and Hardness are
                // decided off the target, so the application has to shadow it — and by then `item` is
                // null and the predicates cannot be tested again. These are the ones that already matched.
                data.options.soulboundBypass = { entries: matching.map(({ entry }) => entry), types };
                changed = true;
                return JSON.stringify(data);
            });

            if (changed) message.updateSource({ rolls: rewritten });
        } catch (error) {
            console.error("Isaac's Homebrew | could not put a bypass on a damage roll", error);
        }
    });
}
