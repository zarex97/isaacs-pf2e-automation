import { LIB_ID } from "../id.mjs";
import { t } from "../i18n.mjs";
import { AUTHORED_KEYS, sourceOf } from "../lib/config-of.mjs";
import { RIDERS_OFF } from "./coexistence.mjs";

/**
 * What the module automates for an item, in words — the indicator's panel, and nothing else.
 *
 * One row per authored key that has something to say: the value summarised, where it came from, and
 * whether the GM may switch it. Pure enough to test: Foundry is only reached for module titles and effect
 * names, and both have fallbacks.
 */

const titleOf = (moduleId) => globalThis.game?.modules?.get(moduleId)?.title ?? moduleId;
const outcomeWords = (outcomes) => (outcomes ?? []).map((o) => t(`Outcome.${o}`)).join(" / ");

function whatARiderDoes(rider) {
    const apply = rider?.apply ?? {};
    switch (apply.type) {
        case "condition":
            return [apply.slug, apply.value].filter((x) => x !== undefined && x !== null).join(" ");
        case "effect":
            return globalThis.fromUuidSync?.(apply.uuid)?.name ?? t("Indicator.AnEffect");
        case "save":
            return t("Indicator.SaveRider", { statistic: apply.statistic });
        default:
            return apply.type ?? "?";
    }
}

/** One line per rider: what it does, and on which outcomes. */
export function describeRiders(riders) {
    return (riders ?? []).map((rider) => {
        const what = whatARiderDoes(rider);
        const on = outcomeWords(rider.outcomes);
        return on ? t("Indicator.RiderOn", { what, on }) : what;
    });
}

/** The area rule in a line: shape and size, who it catches, how many. */
export function describeArea(area, item) {
    const parts = [];
    const shape = area?.area ?? item?.system?.area;
    if (shape?.type) parts.push(t("Indicator.Shape", { size: shape.value, shape: shape.type }));
    parts.push(t(({ allies: "Rule.Allies", enemies: "Rule.Enemies" })[area?.affects] ?? "Rule.Everyone"));
    if (area?.maxTargets) parts.push(area.maxTargets === 1 ? t("Rule.UpToTargetsOne") : t("Rule.UpToTargets", { count: area.maxTargets }));
    if (area?.range) parts.push(t("Rule.Within", { range: area.range }));
    return [parts.join(" · ")];
}

const SUMMARIES = {
    areaTargeting: describeArea,
    areaTargetingShapes: (shapes) => [t("Indicator.Shapes", { count: shapes?.length ?? 0 })],
    riders: describeRiders,
    lingering: () => [t("Indicator.Lingering")],
    overlap: () => [t("Indicator.Overlap")],
    bypass: () => [t("Indicator.Bypass")],
    counterThresholds: () => [t("Indicator.Thresholds")],
    requires: () => [t("Indicator.Requires")],
    variantFromWeapon: () => [t("Indicator.VariantFromWeapon")],
    actionVariants: (variants) => [t("Indicator.ActionVariants", { counts: Object.keys(variants ?? {}).join(", ") })],
    targetsPerAction: () => [t("Indicator.TargetsPerAction")],
    sameAttackPenalty: () => [t("Indicator.SameAttackPenalty")],
    castChoice: (spec) => [t("Indicator.CastChoice", { count: spec?.choices?.length ?? spec?.fields?.length ?? 0 })],
    sacrifice: () => [t("Indicator.Sacrifice")],
    circumstanceAcLess: (by) => [t("Indicator.CircumstanceAcLess", { by })],
    saveOrSkill: (skill) => [t("Indicator.SaveOrSkill", { skill })],
    castCost: (spec) => [t("Indicator.CastCost", { gp: spec?.gp ?? 0, rank: spec?.fromRank ?? 1 })],
    saveModifier: (spec) => [spec].flat().filter(Boolean).map((s) => t("Indicator.SaveModifier", { value: s.value, type: s.type ?? "untyped" })),
};

/** Where a key's config came from, in words. */
export function describeSource(found) {
    if (found.off) return t("Indicator.Source.Off", { module: titleOf(found.module) });
    if (found.deferred === RIDERS_OFF) return t("Indicator.Source.SettingOff");
    if (found.deferred) return t("Indicator.Source.Deferred", { module: titleOf(found.deferred) });
    if (found.source === "flags") return t("Indicator.Source.Flags", { module: titleOf(found.module) });
    if (found.source === "registered") return t("Indicator.Source.Registered", { module: titleOf(found.module) });
    return t("Indicator.Source.Table");
}

/**
 * The panel's rows for an item: `[{ key, label, lines, source, applies, switchable }]`.
 *
 * `switchable` — the GM may turn this key off or back on for this item. Only what this module can own:
 * a table or registered entry (turning it off writes `false` under this module's id), or a \`false\` this
 * module wrote (turning it back on removes it). An item's own authored config is never touched from here.
 */
export function rowsFor(item) {
    const rows = [];
    for (const key of AUTHORED_KEYS) {
        const found = sourceOf(item, key);
        if (!found.source && !found.off) continue;
        const summary = SUMMARIES[key](found.value, item);
        rows.push({
            key,
            label: t(`Indicator.Key.${key}`),
            lines: found.value === undefined ? [] : summary,
            source: describeSource(found),
            applies: found.value !== undefined,
            // A deferred rider is the setting's to decide, not this item's.
            switchable: found.off ? found.module === LIB_ID : !found.deferred && (found.source === "table" || found.source === "registered"),
        });
    }
    return rows;
}

/** Does the module automate anything on this item? */
export function isAutomated(item) {
    return rowsFor(item).length > 0;
}
