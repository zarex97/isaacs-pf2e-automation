import { LIB_ID } from "../id.mjs";

/**
 * Which modules' flags carry authored config.
 *
 * Content says how it wants to be aimed, recharged or heightened in its own module's flags. The module that
 * runs the automation reads its own namespace first, then every scope another module has registered, so
 * content keeps authoring where it always has — including the copies already sitting on characters, which
 * no rewrite of the compendium would reach.
 */
const scopes = [LIB_ID];

export function registerFlagScope(moduleId) {
    if (typeof moduleId !== "string" || !moduleId) throw new Error("Isaac's Homebrew | a flag scope needs a module id.");
    if (!scopes.includes(moduleId)) scopes.push(moduleId);
}

export function flagScopes() {
    return [...scopes];
}

/** The first scope's value for `key` on a document, or undefined when no scope has one. */
export function flagOf(doc, key) {
    for (const scope of scopes) {
        const value = doc?.flags?.[scope]?.[key];
        if (value !== undefined) return value;
    }
    return undefined;
}
