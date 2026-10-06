/**
 * Link the repo root into a Foundry data directory as an installed module.
 *
 * The repo root is already the module layout — module.json, scripts/, styles/, templates/ and the built
 * packs/ all sit where Foundry expects them — so a link is enough. Foundry then serves the working tree
 * directly, and a code change is live on the next reload instead of on the next release.
 *
 * Usage: npm run link:foundry [-- --data <dir>] [-- --force]
 * The data directory otherwise comes from FOUNDRY_DATA, or the platform's default install location.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import url from "node:url";

const ROOT = path.resolve(url.fileURLToPath(new URL(".", import.meta.url)), "..");
const MODULE_ID = JSON.parse(fs.readFileSync(path.join(ROOT, "module.json"), "utf8")).id;

const args = process.argv.slice(2);
const force = args.includes("--force");
const dataFlag = args.indexOf("--data");

/** Where Foundry keeps its user data by default, per platform. */
function defaultDataDir() {
    const home = os.homedir();
    if (process.platform === "win32") return path.join(home, "AppData", "Local", "FoundryVTT", "Data");
    if (process.platform === "darwin") return path.join(home, "Library", "Application Support", "FoundryVTT", "Data");
    return path.join(home, ".local", "share", "FoundryVTT", "Data");
}

const dataDir = dataFlag !== -1 ? path.resolve(args[dataFlag + 1] ?? "") : (process.env.FOUNDRY_DATA ?? defaultDataDir());
const modulesDir = path.join(dataDir, "modules");
const link = path.join(modulesDir, MODULE_ID);

if (!fs.existsSync(modulesDir)) {
    console.error(`No modules directory at ${modulesDir}`);
    console.error("Pass the right one with --data <FoundryVTT data dir>, or set FOUNDRY_DATA.");
    process.exit(1);
}

const existing = fs.lstatSync(link, { throwIfNoEntry: false });
if (existing) {
    // Node reports a Windows junction as a symbolic link, so relinking an existing link needs no --force.
    if (existing.isSymbolicLink()) {
        fs.rmSync(link, { force: true });
    } else if (force) {
        // A real directory here is an installed release. Deleting it loses nothing a reinstall cannot
        // restore, but it is still someone's files, so it takes --force.
        fs.rmSync(link, { recursive: true, force: true });
    } else {
        console.error(`${link} is an installed copy of the module, not a link.`);
        console.error("Re-run with --force to replace it (Foundry must be closed), or remove it yourself.");
        process.exit(1);
    }
}

// Junctions are the one link type Windows creates without Developer Mode or an elevated shell.
fs.symlinkSync(ROOT, link, process.platform === "win32" ? "junction" : "dir");
console.log(`Linked ${link}
     -> ${ROOT}`);
