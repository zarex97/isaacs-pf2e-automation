import { LIB_ID } from "../id.mjs";
import { key } from "../i18n.mjs";
import { Vanilla } from "./table.mjs";

/**
 * Living beside the other modules that already automate vanilla spells.
 *
 * PF2e Automations and PF2e Assistant each apply conditions and effects for a list of spells. A table rider
 * for one of those would apply the same frightened a second time, so by default a table rider steps aside
 * for any spell another active module covers — the area, the lingering ground and the rest still run.
 *
 *  - PF2e Automations declares its coverage in `rules/config.json`: every active spell group, by the pf2e
 *    compendium uuid it names (else the slugs in its predicates). Read live, so an update of theirs counts.
 *  - PF2e Assistant's is compiled into its code; `build/coverage-assistant.mjs` extracts it into
 *    `data/coverage/pf2e-assistant.json`, refreshed each release.
 */

export const SETTING = "vanillaRiders";
/** What `deferredTo` answers when the setting itself has the table's riders off. */
export const RIDERS_OFF = "setting:off";

const covered = new Map();

const sluggify = (name) => String(name ?? "").toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function fetchJSON(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return response.json();
}

/** pf2e's spell compendium, id → slug, for resolving the uuids another module names. */
async function spellSlugs() {
    const pack = game.packs.get("pf2e.spells-srd");
    if (!pack) return new Map();
    const index = await pack.getIndex({ fields: ["system.slug"] });
    return new Map(index.map((entry) => [entry._id, entry.system?.slug ?? sluggify(entry.name)]));
}

const READERS = {
    async "pf2e-automations"() {
        const config = await fetchJSON("modules/pf2e-automations/rules/config.json");
        const byId = await spellSlugs();
        const slugs = new Set();
        for (const group of config.groups ?? []) {
            if (group.group !== "spell" || group.isActive === false) continue;
            const fromSource = (group.source ?? []).map((uuid) => /^Compendium\.pf2e\.spells-srd\.Item\.(\w+)$/.exec(uuid)?.[1]).filter(Boolean).map((id) => byId.get(id)).filter(Boolean);
            if (fromSource.length) fromSource.forEach((slug) => slugs.add(slug));
            else {
                const rules = [...(group.baseRules ?? []), ...(group.complexRules ?? []), ...(group.handlerRules ?? [])];
                for (const m of JSON.stringify(rules).matchAll(/"(?:origin:item:|item:slug:)([a-z0-9-]+)"/g)) slugs.add(m[1]);
                slugs.add(sluggify(group.name));
            }
        }
        return slugs;
    },
    async "pf2e-assistant"() {
        const list = await fetchJSON(`modules/${LIB_ID}/data/coverage/pf2e-assistant.json`);
        return new Set(list.slugs ?? []);
    },
};

export const Coexistence = {
    registerSettings() {
        game.settings.register(LIB_ID, SETTING, {
            name: key("Settings.VanillaRiders.Name"),
            hint: key("Settings.VanillaRiders.Hint"),
            scope: "world",
            config: true,
            type: String,
            choices: {
                off: key("Settings.VanillaRiders.Off"),
                uncovered: key("Settings.VanillaRiders.Uncovered"),
                all: key("Settings.VanillaRiders.All"),
            },
            default: "uncovered",
        });
        Vanilla.setRiderDeferral((slug) => Coexistence.deferredTo(slug));
    },

    /** Read what every active automation module covers. At `ready`, once: their files do not change mid-session. */
    async gather() {
        covered.clear();
        for (const [moduleId, read] of Object.entries(READERS)) {
            if (!game.modules.get(moduleId)?.active) continue;
            try {
                for (const slug of await read()) if (!covered.has(slug)) covered.set(slug, moduleId);
            } catch (error) {
                console.warn(`Isaac's PF2e Automation | could not read what ${moduleId} covers; its spells are not deferred to.`, error);
            }
        }
    },

    /** Who a table rider for this spell is left to: another module's id, `RIDERS_OFF`, or null to apply it. */
    deferredTo(slug) {
        const choice = game.settings.get(LIB_ID, SETTING);
        if (choice === "all") return null;
        if (choice === "off") return RIDERS_OFF;
        return covered.get(slug) ?? null;
    },

    /** `{ slug: moduleId }`, for the console and the indicator. */
    covered() {
        return Object.fromEntries(covered);
    },

    /** For the tests. */
    setCovered(entries) {
        covered.clear();
        for (const [slug, moduleId] of Object.entries(entries)) covered.set(slug, moduleId);
    },
};
