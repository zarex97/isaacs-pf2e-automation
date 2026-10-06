/**
 * The automation's own module id.
 *
 * Everything under `scripts/automation/` will become its own module, `isaacs-pf2e-automation`. Until then it
 * still runs inside this one, so the id is still this one's — settings, flags and the template path keep
 * working unchanged — but nothing in here reads it from the homebrew's own constant any more.
 */
export const LIB_ID = "isaacs-hb-pf2e";
