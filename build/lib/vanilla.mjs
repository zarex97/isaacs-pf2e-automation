/**
 * The vanilla table's sources, its bundle, and the checks every entry must pass.
 *
 * Sources: `content/vanilla/<slug>.json`, one spell each, in the shape item flags carry, plus
 * `content/vanilla/_aliases.json` (`{ legacySlug: remasterSlug }`). The bundle, `data/vanilla.json`, is what
 * the module fetches; `npm run build:vanilla` writes it and the tests fail when it is stale.
 */
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

export const ROOT = path.resolve(url.fileURLToPath(new URL(".", import.meta.url)), "..", "..");
export const SOURCES = path.join(ROOT, "content", "vanilla");
export const BUNDLE = path.join(ROOT, "data", "vanilla.json");
export const INDEX = path.join(ROOT, "build", "data", "pf2e-index.json");

const ALIASES = "_aliases.json";

/** The bundle the sources make: deterministic, so a stale one is a byte-for-byte difference. */
export function bundle() {
    const index = JSON.parse(fs.readFileSync(INDEX, "utf8"));
    const files = fs.existsSync(SOURCES) ? fs.readdirSync(SOURCES).filter((f) => f.endsWith(".json") && f !== ALIASES).sort() : [];
    const entries = Object.fromEntries(files.map((f) => [f.slice(0, -5), JSON.parse(fs.readFileSync(path.join(SOURCES, f), "utf8"))]));
    const aliasFile = path.join(SOURCES, ALIASES);
    const aliases = fs.existsSync(aliasFile) ? JSON.parse(fs.readFileSync(aliasFile, "utf8")) : {};
    return { pf2e: index.pf2e, aliases: Object.fromEntries(Object.entries(aliases).sort(([a], [b]) => a.localeCompare(b))), entries };
}

export const serialise = (value) => `${JSON.stringify(value, null, 4)}\n`;

export const DOC = path.join(ROOT, "Docs", "vanilla.md");

/** `Docs/vanilla.md`: every spell the table covers and what it does, generated beside the bundle. */
export function docs(built, index, en) {
    const words = (key) => key.split(".").slice(1).reduce((node, part) => node?.[part], en.ISAACS_AUTOMATION) ?? key;
    const rankFromRider = (predicate) => (predicate ?? []).map((p) => (p?.gte?.[0] === "item:rank" ? `from rank ${p.gte[1]}` : p?.lt?.[0] === "item:rank" ? `below rank ${p.lt[1]}` : null)).filter(Boolean);
    const outcome = { criticalSuccess: "crit. success", success: "success", failure: "failure", criticalFailure: "crit. failure" };
    const rider = (r) => {
        const a = r.apply ?? {};
        const what = a.type === "condition" ? [a.slug, a.value].filter((x) => x !== undefined && x !== null).join(" ")
            : a.type === "effect" ? (a.uuid ? Object.entries(index.effects).find(([, uuid]) => uuid === a.uuid)?.[0] ?? "effect" : words(a.label ?? "effect"))
            : a.type === "prompt" ? `GM note: “${words(a.text)}”`
            : a.type === "teleport" ? `${a.stopsAtWalls ? "pushed" : "moved"} ${a.distance} ft${a.direction === "toward" ? " closer" : a.direction === "choose" ? " in a direction you choose" : " away"}`
            : a.type === "persistent-damage" ? `${a.formula}${a.perStep ? ` (+${a.perStep} per ${a.perStepInterval > 1 ? `${a.perStepInterval} ranks` : "rank"})` : ""} persistent ${a.damageType ?? ""}${a.endsWith ? `, ends with ${a.endsWith.join("/")}` : ""}`
            : a.type === "banish" ? (r.duration?.unit === "unlimited" ? "banished for good" : "banished")
            : a.type === "damage" ? `${a.formula} ${a.damageType ?? ""}`.trim()
            : a.type;
        const when = (r.outcomes ?? []).map((o) => outcome[o]).join(" / ");
        const lasting = [r.duration ? (r.duration.of === "target" ? "until its next turn" : r.duration.unit === "unlimited" ? "until it ends" : `${r.duration.value} ${r.duration.unit}`) : (a.type === "condition" && !a.value ? "no end" : null), a.escapeDc ? "Escape" : null, a.endsOnLeaving ? "ends on leaving" : null, a.sustained ? "while Sustained" : null, a.sustain ? `Sustain: +${a.sustain.step ?? 1}` : null, a.carries?.length ? `carries ${a.carries.map((c) => `${c.event ?? ""} ${c.apply?.type === "save" ? `${c.apply.statistic} save` : c.apply?.type}`.trim()).join(", ")}` : null, a.withoutGrants?.length ? `without ${a.withoutGrants.join(", ")}` : null, ...rankFromRider(r.predicate), r.self ? "on you" : null].filter(Boolean);
        const lastingText = lasting.length ? ` (${lasting.join(", ")})` : "";
        return `${when ? `${when}: ` : ""}${what}${lastingText}`;
    };
    const area = (a) => {
        if (!a) return "";
        const parts = [];
        if (a.area) parts.push(`${a.area.value}-ft ${a.area.type}`);
        if (a.anchor === "caster") parts.push("from you");
        if (a.affects) parts.push(a.affects);
        if (a.includesSelf) parts.push("includes you");
        if (a.predicate?.length) parts.push("filtered");
        if (a.maxTargets) parts.push(`up to ${a.maxTargets}`);
        if (a.chain) parts.push(`a chain, each within ${a.chain.link} ft of the last`);
        if (a.placeOnly) parts.push("placed, no targets");
        if (a.moveCaster) parts.push(a.moveCaster.seeBelowRank ? `you move there (seen, until rank ${a.moveCaster.seeBelowRank})` : "you move there");
        for (const [rank, gains] of Object.entries(a.heightening?.atRank ?? {})) {
            if (gains.maxTargets) parts.push(`+${gains.maxTargets} at rank ${rank}`);
        }
        if (a.heightening?.maxTargets) parts.push(`+${a.heightening.maxTargets} per ${a.heightening.interval ?? 1} ranks`);
        return parts.join(", ");
    };
    const EVENT_WORDS = { tokenMoveIn: "entering", tokenMoveOut: "moving out", tokenMoveWithin: "moving in it", tokenTurnStart: "turn start", tokenTurnEnd: "turn end" };
    const eventsOf = (l) => (l.events ?? ["tokenMoveIn", "tokenTurnEnd"]).map((e) => EVENT_WORDS[e]).filter(Boolean).join(" / ");
    const rankFrom = (predicate) => (predicate ?? []).map((p) => p?.gte?.[0] === "item:rank" ? `from rank ${p.gte[1]}` : null).filter(Boolean);
    const linger = (spec) => [spec ?? []].flat().map((l) => [
            ...rankFrom(l.predicate),
            l.difficultTerrain ? "difficult terrain" : null,
            l.replacesPrevious ? "ends your previous one" : null,
            l.until === "originTurnStart" ? "until your next turn" : null,
            l.followsCaster ? "moves with you" : null,
            l.sustain ? `Sustain: +${l.sustain.radius} ft${l.sustain.saveNewcomers ? ", newcomers save" : ""}` : null,
            l.darkness ? "darkness, outshining light up to its rank" : null,
            l.inside ? `while inside: ${[...(l.inside.conditions ?? []), ...(l.inside.rules?.length ? ["its rules"] : [])].join(", ")}` : null,
            l.save ? `${[l.save.statistic ?? l.save.statistics].flat().join(" or ")} on ${eventsOf(l) || (l.sustain?.saveNewcomers ? "a Sustain" : "—")} — ${(l.save.riders ?? []).map(rider).join("; ")}` : null,
            l.damage ? `${l.damage.formula}${l.damage.persistent === false ? "" : " persistent"} ${l.damage.type ?? ""} on ${(l.events ?? ["tokenMoveIn", "tokenTurnEnd"]).map((e) => ({ tokenMoveIn: "entering", tokenTurnStart: "turn start", tokenTurnEnd: "turn end" })[e] ?? e).join(" / ")}`.trim() : null,
            l.duration ? `${l.duration.value} ${l.duration.unit}` : null,
        ].filter(Boolean).join(", ")).join("; ");
    const rows = Object.entries(built.entries).map(([slug, entry]) => {
        const spell = index.spells[slug];
        const variants = Object.entries(entry.variants ?? {})
            .map(([id, v]) => {
                const overlay = spell?.overlays?.[id];
                const named = overlay?.name ?? (overlay?.area ? `${overlay.area.value}-ft ${overlay.area.type} version` : id);
                return `${named}: ${area(v.areaTargeting)}`;
            }).join("; ");
        // An entry that aims the spell's own area names it, so the row says what is placed.
        const own = entry.areaTargeting && !entry.areaTargeting.area && spell?.area ? `${spell.area.value}-ft ${spell.area.type} (pf2e's)` : "";
        const shapes = (entry.areaTargetingShapes ?? []).map((c) => (c.type === "none" ? "no area" : `${c.value}-ft ${c.type}`)).join(" or ");
        const areaCell = [[shapes ? `choose: ${shapes}` : own, area(entry.areaTargeting)].filter(Boolean).join(", "), variants && `variant — ${variants}`].filter(Boolean).join("; ");
        return `| ${spell?.name ?? slug} | ${spell?.rank ?? ""} | ${areaCell} | ${(entry.riders ?? []).map(rider).join("; ")} | ${linger(entry.lingering)} |`;
    });
    const aliases = Object.entries(built.aliases).map(([legacy, remaster]) => `- \`${legacy}\` → ${index.spells[remaster]?.name ?? remaster}`);
    return [
        "# Vanilla spells",
        "",
        "Generated by `npm run build:vanilla` from `content/vanilla/` — do not edit by hand. Checked against pf2e",
        `${built.pf2e}. A spell's riders step aside when another active module already automates it (the **Riders for`,
        "vanilla spells** setting); its area and lingering ground still apply.",
        "",
        "| Spell | Rank | Area and targets | Riders | Lingering |",
        "| :-- | :-- | :-- | :-- | :-- |",
        ...rows,
        "",
        "## Legacy names",
        "",
        ...(aliases.length ? aliases : ["None."]),
        "",
    ].join("\n");
}

/**
 * Everything wrong with one entry, as readable lines; empty when it is sound.
 *
 * `ctx`: `{ index, authoredKeys, events, outcomes, applyTypes, areaShapes, affects, i18nKeys }` — the facts
 * the checks lean on, passed in so the tests can hand the same function a fixture.
 */
export function problemsWith(slug, entry, ctx) {
    const problems = [];
    const at = (where, what) => problems.push(`${slug}${where ? ` ${where}` : ""}: ${what}`);
    const spell = ctx.index.spells[slug];
    if (!spell) at("", "no pf2e spell has this slug");
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return at("", "an entry is an object"), problems;

    const keysOf = (where, object) => {
        for (const key of Object.keys(object)) {
            if (key === "variants" && where === "") continue;
            if (!ctx.authoredKeys.includes(key)) at(where, `"${key}" is not an authored key`);
        }
    };
    keysOf("", entry);
    for (const [id, variant] of Object.entries(entry.variants ?? {})) {
        if (spell && !spell.overlays?.[id]) at(`variants.${id}`, "the spell has no overlay with this id");
        keysOf(`variants.${id}`, variant ?? {});
        checkKeys(`variants.${id}`, variant ?? {});
    }
    checkKeys("", entry);
    return problems;

    function checkKeys(where, object) {
        const area = object.areaTargeting;
        if (area !== undefined && area !== false) {
            if (area.area && !ctx.areaShapes.includes(area.area.type)) at(`${where} areaTargeting.area`, `unknown shape "${area.area.type}"`);
            if (area.area && !(Number(area.area.value) > 0)) at(`${where} areaTargeting.area`, "a size in feet");
            if (area.anchor !== undefined && !["self", "free", "caster"].includes(area.anchor)) at(`${where} areaTargeting.anchor`, `"${area.anchor}" is not self, free or caster`);
            if (area.affects && !ctx.affects.includes(area.affects)) at(`${where} areaTargeting.affects`, `"${area.affects}" is not one of ${ctx.affects.join(", ")}`);
            for (const n of ["maxTargets", "range"]) if (area[n] !== undefined && !(Number(area[n]) > 0)) at(`${where} areaTargeting.${n}`, "a positive number");
            if (area.placeOnly !== undefined && typeof area.placeOnly !== "boolean") at(`${where} areaTargeting.placeOnly`, "true or false");
            if (area.moveCaster !== undefined && (typeof area.moveCaster !== "object" || area.moveCaster === null)) at(`${where} areaTargeting.moveCaster`, "an object: { seeBelowRank? }");
            if (area.chain !== undefined && !(Number(area.chain?.link) > 0)) at(`${where} areaTargeting.chain`, "a chain names its link in feet");
        }
        for (const [i, choice] of (Array.isArray(object.areaTargetingShapes) ? object.areaTargetingShapes : []).entries()) {
            if (choice.type !== "none" && !ctx.areaShapes.includes(choice.type)) at(`${where} areaTargetingShapes[${i}]`, `"${choice.type}" is not a shape or none`);
            if (choice.type !== "none" && !(Number(choice.value) > 0)) at(`${where} areaTargetingShapes[${i}]`, "a size in feet");
        }
        for (const [i, spec] of [object.lingering ?? []].flat().entries()) {
            if (spec?.darkness !== undefined && spec.darkness !== true) at(`${where} lingering.darkness`.trim(), "true or absent");
            if (spec?.replacesPrevious !== undefined && spec.replacesPrevious !== true) at(`${where} lingering.replacesPrevious`.trim(), "true or absent");
            if (spec?.until !== undefined && spec.until !== "originTurnStart") at(`${where} lingering.until`.trim(), "originTurnStart or absent");
            if (spec?.followsCaster !== undefined && spec.followsCaster !== true) at(`${where} lingering.followsCaster`.trim(), "true or absent");
            if (spec?.sustain !== undefined && !(Number(spec.sustain?.radius) > 0)) at(`${where} lingering.sustain`.trim(), "a sustain names the feet it widens by: { radius, saveNewcomers? }");
            if (spec?.targetPredicate !== undefined && !Array.isArray(spec.targetPredicate)) at(`${where} lingering.targetPredicate`.trim(), "a predicate list");
            if (spec?.save) {
                const asked = [spec.save.statistic ?? spec.save.statistics ?? []].flat();
                if (asked.length === 0 || asked.some((s) => !STATISTICS.includes(s))) at(`${where} lingering.save`.trim(), `a save names its statistic, or the statistics to choose between, from ${STATISTICS.join(", ")}`);
                (spec.save.riders ?? []).forEach((r, j) => checkRider(`${where} lingering.save.riders[${j}]`.trim(), r));
            }
            if (spec?.inside === undefined) continue;
            const inside = spec.inside;
            const at2 = (what) => at(`${where} lingering${Array.isArray(object.lingering) ? `[${i}]` : ""}.inside`.trim(), what);
            if (!inside || typeof inside !== "object") { at2("an object: { conditions?, rules?, description? }"); continue; }
            for (const slug of inside.conditions ?? []) if (!ctx.index.conditions[slug]) at2(`no pf2e condition "${slug}"`);
            if (inside.rules !== undefined && (!Array.isArray(inside.rules) || inside.rules.some((r) => typeof r?.key !== "string"))) at2("rules are a list of rule elements, each with a key");
            if (!(inside.conditions?.length || inside.rules?.length)) at2("holds a condition or a rule");
        }
        if (object.riders !== undefined && object.riders !== false) {
            if (!Array.isArray(object.riders)) at(`${where} riders`, "a list");
            else object.riders.forEach((rider, i) => checkRider(`${where} riders[${i}]`.trim(), rider));
        }
        walkText(where, object);
    }

    function checkRider(where, rider) {
        if (!rider || typeof rider !== "object") return at(where, "a rider is an object");
        if (rider.event !== undefined && !ctx.events.includes(rider.event)) at(where, `unknown event "${rider.event}"`);
        for (const outcome of rider.outcomes ?? []) if (!ctx.outcomes.includes(outcome)) at(where, `unknown outcome "${outcome}"`);
        const apply = rider.apply ?? {};
        if (!ctx.applyTypes.includes(apply.type)) at(`${where}.apply`, `"${apply.type}" is not a built-in apply type`);
        if (apply.type === "condition" && !ctx.index.conditions[apply.slug]) at(`${where}.apply`, `no pf2e condition "${apply.slug}"`);
        for (const slug of apply.withoutGrants ?? []) if (!ctx.index.conditions[slug]) at(`${where}.apply.withoutGrants`, `no pf2e condition "${slug}"`);
        const inline = apply.type === "effect" && !apply.uuid && Array.isArray(apply.rules);
        if (inline && (!apply.label || apply.rules.some((r) => typeof r?.key !== "string"))) at(`${where}.apply`, "an effect written out names a label and rules that each have a key");
        if (apply.type === "effect" && !inline && !Object.values(ctx.index.effects).includes(apply.uuid)) at(`${where}.apply`, `no pf2e spell effect ${apply.uuid}`);
        if (apply.type === "save" && !["fortitude", "reflex", "will"].includes(apply.statistic)) at(`${where}.apply`, `a save is fortitude, reflex or will, not "${apply.statistic}"`);
        for (const list of ["riders", "onAllHit", "carries", "onMax", "onZero"]) (apply[list] ?? []).forEach((r, i) => checkRider(`${where}.apply.${list}[${i}]`, r));
        (apply.options ?? []).forEach((o, i) => (o.riders ?? []).forEach((r, j) => checkRider(`${where}.apply.options[${i}].riders[${j}]`, r)));
    }

    /** Words in an entry are i18n keys under ISAACS_AUTOMATION.Vanilla, and each must exist. */
    function walkText(where, value, field = null) {
        if (typeof value === "string" && ["text", "prompt", "label", "title", "note", "name", "description"].includes(field)) {
            if (!value.startsWith("ISAACS_AUTOMATION.Vanilla.")) at(where, `${field} must be an i18n key under ISAACS_AUTOMATION.Vanilla, not "${value}"`);
            else if (!ctx.i18nKeys.has(value)) at(where, `${value} is not in lang/en.json`);
        } else if (Array.isArray(value)) value.forEach((v) => walkText(where, v, field));
        else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) walkText(where, v, k);
    }
}

/** What a check in an entry may roll: the three saves and the skills a creature can be asked for. */
const STATISTICS = ["fortitude", "reflex", "will", "perception", "acrobatics", "arcana", "athletics", "crafting", "deception", "diplomacy", "intimidation", "medicine", "nature", "occultism", "performance", "religion", "society", "stealth", "survival", "thievery"];

/** Problems with the alias map: every target is an entry, and no alias shadows a real pf2e slug. */
export function aliasProblems(aliases, entries, index) {
    const problems = [];
    for (const [legacy, remaster] of Object.entries(aliases)) {
        if (!entries[remaster]) problems.push(`alias ${legacy} → ${remaster}: no entry for ${remaster}`);
        if (index.spells[legacy]) problems.push(`alias ${legacy}: pf2e still has a spell with this slug`);
    }
    return problems;
}
