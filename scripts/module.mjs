import { buildApi } from "./api.mjs";
import { LIB_ID } from "./id.mjs";
import { t } from "./i18n.mjs";
import { INIT, RIDER_INIT, RIDER_SETUP, SETUP } from "./main.mjs";
import { Coexistence } from "./vanilla/coexistence.mjs";

/** The homebrew the rider engine moved here from. */
const HOMEBREW = "isaacs-hb-pf2e";

/**
 * Is a homebrew active that still runs its own copy of the rider engine?
 *
 * The engine moved here in 1.1.0. A homebrew released before that carries its own, and says so by requiring
 * this module below 1.1.0. Read off its manifest rather than its version, so a working tree's placeholder
 * version answers the same as the release it will become.
 */
export function homebrewRunsItsOwnEngine() {
    const homebrew = game.modules.get(HOMEBREW);
    if (!homebrew?.active) return false;
    const requirement = [...(homebrew.relationships?.requires ?? [])].find((r) => r.id === LIB_ID);
    const minimum = requirement?.compatibility?.minimum;
    return !minimum || foundry.utils.isNewerVersion("1.1.0", minimum);
}

let standDown = false;

/**
 * Run one start-up step, and let the rest start if it fails.
 *
 * A wrapper conflict once threw inside `setup` and took every feature registered after it down with it —
 * read at the table as "half the module does nothing". One step failing should cost one step.
 */
function start(feature, fn) {
    try {
        fn();
    } catch (error) {
        console.error(`Isaac's PF2e Automation | ${feature} failed to start; the rest of the module continues.`, error);
    }
}

Hooks.once("init", () => {
    for (const [feature, fn] of INIT) start(feature, fn);
    standDown = homebrewRunsItsOwnEngine();
    if (standDown) console.warn(`Isaac's PF2e Automation | ${HOMEBREW} runs its own rider engine; this module's stands down.`);
    else for (const [feature, fn] of RIDER_INIT) start(feature, fn);

    // The contract (`api.mjs`, documented in `Docs/api.md`). Published at `init` so that any module's
    // `setup` can register on it; announced too, for a module that would rather be told.
    const api = buildApi();
    game.modules.get(LIB_ID).api = api;
    Hooks.callAll(`${LIB_ID}.init`, api);
});

// After `init`, so the system's document classes exist to be wrapped.
Hooks.once("setup", () => {
    for (const [feature, fn] of SETUP) start(feature, fn);
    if (!standDown) for (const [feature, fn] of RIDER_SETUP) start(feature, fn);
});

// What other automation modules already cover, so the vanilla table's riders can step aside for it.
Hooks.once("ready", () => void Coexistence.gather());

// Said once to the GM, who is the one who can update the homebrew.
Hooks.once("ready", () => {
    if (standDown && game.user.isGM) ui.notifications.warn(t("Riders.StandDown"), { permanent: true });
});
