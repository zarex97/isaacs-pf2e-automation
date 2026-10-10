import { flagOf } from "../lib/flags.mjs";
import { conditionUuidOf } from "../riders/apply.mjs";
import { allianceOf, catches } from "./enemy-terrain.mjs";
import { LIB_ID } from "../id.mjs";

/**
 * An area that changes whoever is standing in it, for as long as they stand there.
 *
 * *Mist*: "All creatures within the mist become Concealed, and all creatures outside the mist become
 * concealed to creatures within it." Nothing is rolled and nothing is dealt; the state belongs to the place,
 * and walking out of the cloud is walking out of the condition. That is a Region behavior on entering and
 * leaving, and an effect the behavior puts on and takes off again. The behavior is the lingering type with
 * `role: "inside"`, so a world learns nothing new to hold one.
 *
 * The effect carries the area's rule elements. A condition the area gives is a `GrantItem` held in memory
 * only, so it is pf2e's own condition — a flat-check helper reading `concealed` sees it — and it goes when
 * the effect goes, without touching a *concealed* the creature had from somewhere else.
 *
 * Who holds the effect is decided on the active GM, who can write to every actor: on entering, on leaving,
 * when the area is created over creatures already standing there, and when it is deleted (dismissed, or its
 * minute up) with creatures still inside.
 */

/** The behavior type this rides on (`lingering.mjs`'s, spelled here so the two files do not import each other). */
const LINGERING_TYPE = `${LIB_ID}.lingering`;

/** The flag on an effect naming the Region it came from. */
export const INSIDE_FLAG = "inside";

/** The lingering flag the area's payload is written under. */
const LINGERING = "lingering";

/** The effect a creature inside the area holds. */
export function insideEffectSource({ name, img, regionUuid, conditions = [], rules = [], description = "" }) {
    return {
        type: "effect",
        name,
        img: img ?? "icons/svg/aura.svg",
        system: {
            description: { value: description },
            duration: { value: -1, unit: "unlimited", expiry: null, sustained: false },
            tokenIcon: { show: true },
            rules: [...conditions.map((uuid) => ({ key: "GrantItem", uuid, inMemoryOnly: true })), ...rules],
        },
        flags: { [LIB_ID]: { [INSIDE_FLAG]: regionUuid } },
    };
}

/** The effects on an actor that a Region gave. */
export function heldFrom(actor, regionUuid) {
    return (actor?.itemTypes?.effect ?? []).filter((effect) => effect.flags?.[LIB_ID]?.[INSIDE_FLAG] === regionUuid);
}

/** What `inside` becomes on the Region: conditions as uuids, and the words already read. */
export function insidePayload(spec, item) {
    if (!spec) return null;
    const conditions = (spec.conditions ?? [])
        .map((slug) => conditionUuidOf(game.pf2e?.ConditionManager?.getCondition?.(slug)))
        .filter(Boolean);
    // `"$cast:<flag>"` in a rule is what the caster chose as it was cast — *Circle of Protection*'s alignment.
    const chosen = item?.actor?.flags?.[LIB_ID]?.castChoices?.[(item.original ?? item).id] ?? {};
    const rules = JSON.parse(JSON.stringify(spec.rules ?? []).replace(/\$cast:([A-Za-z]+)/g, (_m, flag) => String(chosen[flag] ?? "")));
    return {
        conditions,
        rules,
        description: spec.description ?? item?.system?.description?.value ?? "",
        img: item?.img ?? null,
    };
}

const isActiveGM = () => game.users?.activeGM?.id === game.user?.id;

export const Inside = {
    registerHooks() {
        // Creatures already standing where the area appears are inside it from the start.
        Hooks.on("createRegion", (region) => {
            if (!isActiveGM() || !Inside.has(region)) return;
            for (const token of region.tokens ?? []) Inside.enter(region, token);
        });
        // A dismissed cloud, or one whose minute is up, lets go of everyone in it — and so does any lingering
        // area that left an effect "while in it" (*Web*'s penalty), whichever role its behavior has.
        Hooks.on("deleteRegion", (region) => {
            if (!isActiveGM() || !flagOf(region, LINGERING)) return;
            for (const token of region.parent?.tokens ?? []) Inside.leave(region, token);
            // What lasts as long as the area does (`withArea`), on anyone, inside it or not.
            for (const token of region.parent?.tokens ?? []) {
                const ids = token.actor?.items?.filter((i) => i.flags?.[LIB_ID]?.withArea === region.uuid).map((i) => i.id) ?? [];
                if (ids.length > 0) token.actor.deleteEmbeddedDocuments("Item", ids).catch(() => null);
            }
        });
    },

    has(region) {
        return region?.behaviors?.some?.((behavior) => behavior.type === LINGERING_TYPE && behavior.system?.role === "inside") ?? false;
    },

    /** A Region event on an `inside` behavior, on the active GM. */
    async handle(event, region) {
        if (!isActiveGM()) return;
        const token = event.data?.token;
        if (event.name === CONST.REGION_EVENTS.TOKEN_ENTER) await Inside.enter(region, token);
        else if (event.name === CONST.REGION_EVENTS.TOKEN_EXIT) await Inside.leave(region, token);
    },

    async enter(region, token) {
        const actor = token?.actor;
        const payload = flagOf(region, LINGERING);
        const inside = payload?.inside;
        if (!actor || !inside || heldFrom(actor, region.uuid).length > 0) return;
        const originActor = payload.originUuid ? await fromUuid(payload.originUuid) : null;
        if (payload.affects === "enemies" && !catches(allianceOf(originActor), allianceOf(actor))) return;
        if (payload.affects === "allies" && catches(allianceOf(originActor), allianceOf(actor))) return;
        await actor.createEmbeddedDocuments("Item", [
            insideEffectSource({ name: payload.name ?? region.name, img: inside.img, regionUuid: region.uuid, ...inside }),
        ]);
    },

    async leave(region, token) {
        const actor = token?.actor;
        const held = heldFrom(actor, region.uuid).map((effect) => effect.id);
        if (held.length > 0) await actor.deleteEmbeddedDocuments("Item", held);
    },
};
