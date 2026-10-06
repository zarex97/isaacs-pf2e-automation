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
    if (typeof moduleId !== "string" || !moduleId) throw new Error("Isaac's PF2e Automation | a flag scope needs a module id.");
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

/**
 * A keyed record kept under one flag — receipts on a message, a ledger on an actor — merged across every
 * scope, this module's own entries winning.
 *
 * The rider engine wrote under the homebrew's namespace before it moved here (phase 2). A receipt or a
 * ledger is short-lived, but one written the moment before an upgrade must still be read the moment after;
 * reading only the first scope that has the flag would hide an old entry behind a new one. Dropped in 2.0.0.
 */
export function mergedFlag(doc, key) {
    const parts = [...scopes].reverse().map((scope) => doc?.flags?.[scope]?.[key]).filter((v) => v && typeof v === "object");
    return parts.length === 0 ? undefined : Object.assign({}, ...parts);
}

/** Unset a flag in every scope that holds it, so an entry the homebrew wrote cannot outlive its clearing. */
export async function unsetFlagEverywhere(doc, key) {
    for (const scope of scopes) {
        if (doc?.flags?.[scope]?.[key] !== undefined) await doc.unsetFlag(scope, key);
    }
}
