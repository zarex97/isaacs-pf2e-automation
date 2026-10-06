import { buildApi } from "./api.mjs";
import { LIB_ID } from "./id.mjs";
import { INIT, SETUP } from "./main.mjs";

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

    // The contract (`api.mjs`, documented in `Docs/api.md`). Published at `init` so that any module's
    // `setup` can register on it; announced too, for a module that would rather be told.
    const api = buildApi();
    game.modules.get(LIB_ID).api = api;
    Hooks.callAll(`${LIB_ID}.init`, api);
});

// After `init`, so the system's document classes exist to be wrapped.
Hooks.once("setup", () => {
    for (const [feature, fn] of SETUP) start(feature, fn);
});
