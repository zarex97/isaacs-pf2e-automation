import { RiderExtensions } from "./extensions.mjs";
import { LIB_ID } from "../id.mjs";

export const FLAG = "escape";

/**
 * The Escape a condition rider promises, made into something the captive can actually click.
 *
 * Thirteen condition riders across nine Soulbound abilities — Sai, Gritz, Rikujōkōrō, Kurohitsugi,
 * Hyōten Hyakkasō, Ryūsenka, Sennen Hyōrō, Sprenger and Minami's ash — carry `escapeDc: "reiatsu"`, and
 * every one of their descriptions says "(Escape against your Reiatsu DC)". Only `encasement.mjs` ever
 * read that key. On a condition rider it was inert: the condition landed with its timer and the Escape
 * did not exist anywhere, so the only way out was to wait the duration out.
 *
 * pf2e cannot supply it either. `immobilized` and `restrained` carry no native Escape action, `grabbed`
 * carries one with no DC attached, and nothing in the system knows that this particular grip is answered
 * by a Soulbound's Reiatsu DC. So the Escape is granted to the captive as a real action on their own
 * sheet, naming the DC and what it releases — the same shape `encasement.mjs` already grants against a
 * shell, and for the same reason.
 *
 * **Which skill.** pf2e's own Escape offers Acrobatics, Athletics or an unarmed attack roll, the
 * captive's choice. The first two are statistics this can roll; the unarmed modifier is assembled inside
 * the system's own action and is not a rollable statistic, so it is not offered here. The captive's
 * better of Acrobatics and Athletics is rolled, and the card says out loud that a table preferring the
 * unarmed roll can make it against the same DC. Content may name one skill with `escapeStatistic`.
 */
export const Escape = {
    /**
     * Grant the captive their way out.
     *
     * Returns the action created, or null when there is already one for this grip. An aura re-applying
     * itself every round — Minami's ash figures are exactly that — must not leave a sheet wearing five
     * copies of the same Escape, and `applyCondition` refreshes a standing effect rather than granting a
     * second one, so the check here is against the ability that caused it rather than against a timer.
     */
    async grant(rider, context, release) {
        const actor = context.actor;
        if (!actor) return null;

        const item = context.item ?? context.riderItem ?? null;
        const spec = { ...release, source: item?.uuid ?? null, name: item?.name ?? null };
        if (actor.items.some((i) => isEscapeFor(i, spec))) return null;

        const dc = escapeDcFor(rider.apply.escapeDc, context);
        const source = escapeActionSource({
            item,
            dc,
            statistic: rider.apply.escapeStatistic ?? null,
            release: spec,
        });
        const [created] = await actor.createEmbeddedDocuments("Item", [source]);
        return created ?? null;
    },

    /**
     * Free the captive: the Escape goes, and then what it was for.
     *
     * The action is deleted **first**, and the order is not cosmetic. Deleting the effect fires the
     * cleanup hook below, which deletes the Escape that named it — so releasing the grip first and
     * tidying up afterwards is two deletes racing for one item, and the loser throws
     * `Item "…" does not exist!` out of the rider, before the "breaks free" line is ever posted. Driven
     * live, the captive was freed and never told. Taking the action down first leaves the hook nothing
     * to find.
     */
    async release(actor, action, authored = null) {
        // What was granted, and what was written by hand. An Escape this module created carries the flag
        // and is deleted with the grip; an Escape authored onto an item in content says what it releases
        // in its own rider and must survive being used, because it is part of that item forever.
        const granted = action?.flags?.[LIB_ID]?.[FLAG] ?? null;
        const spec = granted ?? authored;
        if (!actor || !spec) return;

        if (granted && actor.items.has(action.id)) await action.delete();

        const effect = spec.effectId ? actor.items.get(spec.effectId) : null;
        if (effect) {
            await effect.delete();
            return;
        }
        for (const slug of spec.conditions ?? []) {
            if (actor.hasCondition?.(slug)) await actor.decreaseCondition(slug, { forceRemove: true });
        }
    },

    /**
     * An Escape outlives what it was for unless something is watching.
     *
     * The grip ends three ways — the escape check, the effect's own timer running out, and a GM deleting
     * it by hand — and only the first goes through `release`. Left alone, the other two leave a permanent
     * "Escape Sai — Restrain" on the sheet of someone who is no longer held by anything.
     */
    registerHooks() {
        Hooks.on("deleteItem", async (item) => {
            // One client deletes, and it is the GM's — the same gate `encasement.mjs`, `banish.mjs` and
            // the relay all use. `isOwner` is true for the GM *and* for the player whose character is
            // held, so both clients would see the Escape alive in a collection that lags a socket round
            // trip and both would delete it. `Hooks.on` does not await this callback, so the loser's
            // `Item "…" does not exist!` surfaces as an unhandled rejection rather than anything a
            // try/catch here could hold.
            if (game.users.activeGM?.id !== game.user.id) return;
            const actor = item?.parent;
            if (!actor?.items) return;
            if (item.type === "action") return;

            for (const action of actor.items.filter((i) => i.flags?.[LIB_ID]?.[FLAG])) {
                const spec = action.flags[LIB_ID][FLAG];
                const orphaned = spec.effectId
                    ? spec.effectId === item.id
                    : (spec.conditions ?? []).includes(item.slug) && !actor.hasCondition?.(item.slug);
                if (orphaned && actor.items.has(action.id)) await action.delete();
            }
        });
    },
};

/**
 * The apply types whose handler reads `escapeDc`.
 *
 * Exported so the build can hold the content to it: an `escapeDc` written on any other rider is a
 * sentence in a description with nothing behind it, which is what this whole module is here to fix.
 */
export const ESCAPE_DC_TYPES = new Set(["condition", "encasement"]);

/** The granted action, as a plain source object — no Foundry, so the build can read it. */
export function escapeActionSource({ item, dc, statistic = null, release }) {
    const name = item?.name ?? "the grip";
    const skill = statistic ? capitalise(statistic) : "Acrobatics or Athletics";
    return {
        type: "action",
        name: `Escape ${name}`,
        img: item?.img ?? "icons/skills/movement/figure-running-gray.webp",
        system: {
            actionType: { value: "action" },
            actions: { value: 1 },
            // Named in plain text rather than linked. `encasement.mjs` can link its hazard because a
            // hazard is a world actor the captive may look at; the item behind a condition rider is the
            // *caster's* own spell, and an `@UUID` to an item on someone else's sheet renders to a player
            // as a broken link they cannot open.
            description: {
                value: `<p>Attempt ${article(skill)} ${skill} check against <strong>DC ${dc}</strong> to `
                    + `break free of <strong>${name}</strong>. On a success you are released and this `
                    + `action goes away.</p>`
                    + `<p><em>Pathfinder's Escape also allows an unarmed attack roll. A table that would `
                    + `rather roll that can, against the same DC.</em></p>`,
            },
            traits: { value: ["attack"], rarity: "common" },
            category: "defensive",
        },
        flags: {
            [LIB_ID]: {
                [FLAG]: release,
                riders: [
                    {
                        apply: { type: "escape", statistic, dc, ...release },
                        event: "action-used",
                        self: true,
                    },
                ],
            },
        },
    };
}

/**
 * The captive's better of Acrobatics and Athletics, or the one skill the content named.
 *
 * Returning null rather than defaulting is deliberate: a creature with neither skill prepared is a
 * creature this cannot roll for, and inventing a +0 check would read at the table as a real attempt.
 */
export function escapeStatisticFor(actor, named = null) {
    if (named) return actor?.getStatistic?.(named) ?? null;
    const candidates = ["acrobatics", "athletics"].map((slug) => actor?.getStatistic?.(slug)).filter(Boolean);
    return candidates.reduce((best, s) => ((s.mod ?? 0) > (best?.mod ?? -Infinity) ? s : best), null);
}

/**
 * The escape DC, resolved through the shared resolver.
 *
 * It falls back out loud for the same reason `encasement.mjs` does: this number is interpolated into the
 * action's own card, so `null` would print "DC null" onto a player's sheet and stay there.
 */
export function escapeDcFor(dc, context) {
    const value = RiderExtensions.resolveDC(dc, context);
    if (value !== null) return value;
    console.warn(
        `Isaac's Homebrew | escape: could not resolve escape DC ${JSON.stringify(dc)}`
            + ` for ${context.originActor?.name ?? "an unknown origin"} — falling back to 10.`,
    );
    return 10;
}

function isEscapeFor(item, spec) {
    const existing = item.flags?.[LIB_ID]?.[FLAG];
    if (!existing) return false;
    if (existing.source !== spec.source) return false;
    return (existing.conditions ?? []).join(",") === (spec.conditions ?? []).join(",");
}

function capitalise(slug) {
    return String(slug).charAt(0).toUpperCase() + String(slug).slice(1);
}

function article(word) {
    return /^[AEIOU]/i.test(word) ? "an" : "a";
}
