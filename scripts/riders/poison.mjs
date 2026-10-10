import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";
import { DEGREES } from "../lib/degree.mjs";
import { RiderExtensions } from "./extensions.mjs";
import { playersOf } from "./message.mjs";
import { counteracts } from "./tether.mjs";

/**
 * Poison, found and taken out.
 *
 * *Detect Poison*: "You detect whether a creature is venomous or poisonous, or if an object is poison or has been
 * poisoned. You do not ascertain whether the target is poisonous in multiple ways, nor do you learn the type or types of
 * poison … Heightened (2nd) You learn the number and types of poison." `{ type: "detect-poison" }` whispers the caster
 * whether the target holds poison: a creature's own poison-trait actions and attacks, and attacks that deal poison
 * damage; an object's — an unattended loot pile on the board — every poison-trait item in it, since pf2e records no
 * poison put into a thing. From 2nd rank, how many and their names and kinds.
 *
 * *Enhance Victuals*: "Prior to the transformation, the spell attempts to counteract any poisons in the food or water.
 * The food turns back to normal if not consumed before the duration expires, though any poisons that were
 * counteracted are still gone." `{ type: "victuals", flag }` on the targeted pile (or the caster's own pack): each
 * poison in the pile is counteracted at the cast's rank against its level's DC, and gone on a success; the food or
 * drink the cast named — every food in it, if it named none — is renamed a fine version of itself until the hour is
 * up, then back, if it is still there.
 *
 * *Cleanse Cuisine*: "You transform all food and beverages in the area into delicious fare … You can also choose to
 * remove all toxins and contaminations from the food." `cleanse: "<flag>"` names the cast's yes-or-no field: on a yes the
 * pile's poisons are simply removed, no check; `lasting: true` keeps the fine food fine.
 */

const FLAG = "victuals";
const KINDS = ["contact", "ingested", "inhaled", "injury"];
const ONE_HOUR = 3600;

const traitsOf = (item) => item?.system?.traits?.value ?? [];
const isObject = (actor) => ["loot", "vehicle", "party"].includes(actor?.type);

/** Does an attack deal poison damage? An NPC's attack lists its rolls by id. */
function dealsPoison(item) {
    return Object.values(item?.system?.damageRolls ?? {}).some((roll) => roll?.damageType === "poison");
}

/** The poisons a creature or an object holds, by name, with their kinds. */
export function poisonsOf(actor) {
    const items = [...(actor?.items ?? [])];
    const found = isObject(actor)
        ? items.filter((item) => traitsOf(item).includes("poison"))
        : items.filter((item) => ["action", "melee", "feat"].includes(item.type) && (traitsOf(item).includes("poison") || (item.type === "melee" && dealsPoison(item))));
    const seen = new Map();
    for (const item of found) {
        if (seen.has(item.name)) continue;
        seen.set(item.name, { name: item.name, kinds: KINDS.filter((kind) => traitsOf(item).includes(kind)), level: Number(item.system?.level?.value) || 0, id: item.id });
    }
    return [...seen.values()];
}

/** What the caster is told: yes or no at 1st rank; from 2nd, how many and which. */
export function poisonReport(name, poisons, rank, object = false) {
    if (poisons.length === 0) return t(object ? "Poison.CleanObject" : "Poison.Clean", { name });
    if ((Number(rank) || 1) < 2) return t(object ? "Poison.PoisonedObject" : "Poison.Poisonous", { name });
    const list = poisons.map((p) => (p.kinds.length ? `${p.name} (${p.kinds.join(", ")})` : p.name)).join("; ");
    return t("Poison.Count", { name, count: poisons.length, list });
}

/** The most a cast at this rank can enhance: a gallon or 5 pounds, and one more or 5 more each rank past 2nd. */
export function victualsCap(rank) {
    const steps = Math.max(1, (Number(rank) || 2) - 1);
    return { gallons: steps, pounds: steps * 5 };
}

/** The items whose enhancement is over at this world time. */
export function spoiled(items, now) {
    return items.filter((item) => {
        const until = Number(item.flags?.[LIB_ID]?.[FLAG]?.until);
        return Number.isFinite(until) && until <= now;
    });
}

/** pf2e's level-based DC table. */
function dcByLevel(level) {
    const table = [14, 15, 16, 18, 19, 20, 22, 23, 24, 26, 27, 28, 30, 31, 32, 34, 35, 36, 38, 39, 40, 42, 44, 46, 48, 50];
    return table[Math.clamp(Math.floor(Number(level) || 0) + 1, 0, table.length - 1)];
}

export async function detectPoison(_rider, context, rank = 1) {
    const actor = context.actor;
    const from = context.originActor;
    if (!actor || !from) return;
    const name = context.target?.name ?? actor.name;
    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: from }),
        whisper: playersOf(from),
        flavor: context.item?.name ?? t("Poison.Title"),
        content: `<p>${poisonReport(name, poisonsOf(actor), rank, isObject(actor))}</p>`,
    });
}

export async function enhanceVictuals(rider, context, chosen = {}, { rank = 2, item = null } = {}) {
    const from = context.originActor;
    const pile = context.actor ?? from;
    if (!from || !pile) return;
    const named = String(chosen[rider.apply.flag ?? "item"] ?? "").trim().toLowerCase();
    const physical = pile.items.filter((i) => typeof i.isOfType === "function" ? i.isOfType("physical") : true);
    const food = named
        ? physical.filter((i) => i.name.toLowerCase() === named)
        : physical.filter((i) => i.system?.category === "food");
    if (food.length === 0) {
        context.notes.push(t("Poison.NoFood", { item: named || t("Poison.Food"), name: pile.name }));
        return;
    }
    const lines = [];
    // *Cleanse Cuisine*: toxins removed outright, when the caster chose to.
    if (rider.apply.cleanse && isObject(pile)) {
        if (String(chosen[rider.apply.cleanse] ?? "") === "yes") {
            const toxins = physical.filter((i) => traitsOf(i).includes("poison"));
            for (const toxin of toxins) await toxin.delete();
            if (toxins.length) lines.push(t("Poison.Removed", { items: toxins.map((i) => i.name).join(", ") }));
        }
    } else if (isObject(pile)) {
    // "Prior to the transformation": a pile's poisons first, each counteracted on its own.
        const statistic = item?.spellcasting?.statistic ?? RiderExtensions.statistic(from, "spellcasting");
        for (const poison of physical.filter((i) => traitsOf(i).includes("poison"))) {
            const level = Number(poison.system?.level?.value) || 0;
            const theirs = Math.max(1, Math.ceil(level / 2));
            const roll = statistic ? await statistic.roll({ dc: { value: dcByLevel(level) }, skipDialog: true, label: t("Counteract.Against", { effect: poison.name }), extraRollOptions: [`${LIB_ID}:counteract`] }) : null;
            const outcome = DEGREES[roll?.degreeOfSuccess ?? -1];
            const gone = !!outcome && counteracts(outcome, rank, theirs);
            if (gone) await poison.delete();
            lines.push(t(gone ? "Counteract.Gone" : "Poison.Holds", { effect: poison.name, rank: theirs, ours: rank }));
        }
    }
    const until = game.time.worldTime + ONE_HOUR;
    for (const dish of food) {
        const original = dish.flags?.[LIB_ID]?.[FLAG]?.name ?? dish.name;
        // Fine already, from an earlier casting: it stays as it is.
        if (rider.apply.lasting) {
            if (!dish.flags?.[LIB_ID]?.fine) await dish.update({ name: t("Poison.Fine", { name: original }), [`flags.${LIB_ID}.fine`]: true });
        }
        else await dish.update({ name: t("Poison.Fine", { name: original }), [`flags.${LIB_ID}.${FLAG}`]: { name: original, until } });
    }
    if (rider.apply.lasting) {
        lines.push(t("Poison.Cleansed", { items: food.map((i) => i.name).join(", "), feet: Math.ceil(rank / 2) }));
    } else {
        const cap = victualsCap(rank);
        lines.push(t("Poison.Enhanced", { items: food.map((i) => i.name).join(", "), gallons: cap.gallons, pounds: cap.pounds }));
    }
    context.notes.push(...lines);
}

export const Victuals = {
    registerHooks() {
        Hooks.on("updateWorldTime", () => Victuals.revert());
    },

    /** Food not eaten within the hour turns back to what it was. Active GM only. */
    async revert() {
        if (game.users?.activeGM?.id !== game.user?.id) return;
        const now = game.time.worldTime;
        const actors = new Set([...(game.actors ?? []), ...[...(game.scenes ?? [])].flatMap((scene) => scene.tokens.filter((token) => !token.actorLink && token.actor).map((token) => token.actor))]);
        for (const actor of actors) {
            for (const dish of spoiled([...(actor.items ?? [])], now)) {
                await dish.update({ name: dish.flags[LIB_ID][FLAG].name, [`flags.${LIB_ID}.-=${FLAG}`]: null });
            }
        }
    },
};

/**
 * *Extract Poison*: "Attempt a counteract check against one poison you're aware of on or in an object you touch. If you
 * successfully counteract the poison, you negate the object's toxicity and transfer the poison into a weapon you are
 * holding … On your next successful attack with that weapon before the end of your next turn, you add 1d6 poison damage
 * per level of the poison you counteracted. On a critically failed attack roll, you lose the extracted poison". `{ type:
 * "extract" }` counteracts the targeted pile's first poison at the cast's rank; on a success the poison is gone and the
 * caster's held weapon carries pf2e's *Extract Poison* at that poison's level, until the end of their next turn — spent
 * by the next damage roll the weapon's hit makes, or lost on a critically failed attack.
 */
const EXTRACT = "Compendium.pf2e.spell-effects.Item.fEhCbATDNlt6c1Ug";

export async function extractPoison(_rider, context, { rank = 2, item = null } = {}) {
    const caster = context.originActor;
    const pile = context.actor;
    if (!caster || !pile) return;
    const poison = pile.items.find((i) => traitsOf(i).includes("poison"));
    // "A weapon you are holding": the one, or the one the caster picks of several.
    const { chooseHeldWeapon } = await import("./weapon.mjs");
    const weapon = await chooseHeldWeapon(caster, context.item?.name ?? "");
    if (!poison) return context.notes.push(t("Poison.NoneToExtract", { name: pile.name }));
    if (!weapon) return context.notes.push(t("Poison.NoWeapon", { actor: caster.name }));
    const level = Number(poison.system?.level?.value) || 0;
    const theirs = Math.max(1, Math.ceil(level / 2));
    const statistic = item?.spellcasting?.statistic ?? RiderExtensions.statistic(caster, "spellcasting");
    const roll = statistic ? await statistic.roll({ dc: { value: dcByLevel(level) }, skipDialog: true, label: t("Counteract.Against", { effect: poison.name }), extraRollOptions: [`${LIB_ID}:counteract`] }) : null;
    const outcome = DEGREES[roll?.degreeOfSuccess ?? -1];
    if (!outcome || !counteracts(outcome, rank, theirs)) return context.notes.push(t("Poison.Holds", { effect: poison.name, rank: theirs, ours: rank }));
    await poison.delete();
    const source = (await fromUuid(EXTRACT))?.toObject();
    if (!source) return;
    // pf2e's level choices are strings ("1" … "20"); a selection of another type leaves the prompt open.
    source.system.rules = source.system.rules.map((rule) => (rule.key !== "ChoiceSet" ? rule : { ...rule, selection: rule.flag === "weapon" ? weapon.id : String(Math.max(1, level)) }));
    source.system.duration = { value: 1, unit: "rounds", expiry: "turn-end", sustained: false };
    source.system.badge = { type: "counter", value: 1 };
    source.flags = foundry.utils.mergeObject(source.flags ?? {}, { [LIB_ID]: { riders: [
        { event: "damage-applied", apply: { type: "spend-badge" } },
        { event: "strike-resolved", outcomes: ["criticalFailure"], apply: { type: "spend-badge" } },
    ] } });
    source.system.context = { origin: { actor: caster.uuid, token: null, item: context.item?.uuid ?? null, spellcasting: null, rollOptions: [] }, target: null, roll: null };
    await caster.createEmbeddedDocuments("Item", [source]);
    context.notes.push(t("Poison.Extracted", { effect: poison.name, weapon: weapon.name, dice: Math.max(1, level) }));
}

/**
 * *Allfood*: "You transform one object into an edible substance … After 1 day, if no one has eaten the allfood, it
 * reverts to its original form … Heightened (+1) Double the maximum bulk". `{ type: "allfood", flag }` turns the
 * targeted pile's item the cast named — non-magical, within the rank's Bulk — into allfood, a food to eat, and back after
 * a day if it is still there.
 */
export function allfoodBulk(rank) {
    return 2 ** Math.max(0, (Number(rank) || 2) - 2);
}

export async function makeAllfood(rider, context, chosen = {}, rank = 2) {
    const pile = context.actor;
    const named = String(chosen[rider.apply.flag ?? "item"] ?? "").trim().toLowerCase();
    const thing = pile?.items?.find((i) => i.name.toLowerCase() === named);
    const cap = allfoodBulk(rank);
    if (!thing || thing.isMagical || (Number(thing.system?.bulk?.value) || 0) > cap) return context.notes.push(t("Poison.NoAllfood", { item: named, cap }));
    const original = { name: thing.name, category: thing.system?.category ?? null };
    await thing.update({ name: t("Poison.Allfood", { name: thing.name }), [`flags.${LIB_ID}.${FLAG}`]: { name: original.name, until: game.time.worldTime + 86400 } });
    context.notes.push(t("Poison.Allfooded", { item: original.name, cap }));
}
