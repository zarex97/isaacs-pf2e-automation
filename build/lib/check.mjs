/**
 * The smallest test harness that says what broke.
 *
 * Deliberately not a framework: these tests run against built content in a plain Node process, and a
 * dependency here would have to be installed before the build could be trusted. `build/test-riders.mjs`
 * carries its own copy of this, written before there was a second test file; it is left alone rather
 * than migrated, because 146 green checks are not worth risking for a tidier import.
 */
const failures = [];
let checks = 0;

export function check(label, actual, expected) {
    checks += 1;
    const a = JSON.stringify(actual);
    const e = JSON.stringify(expected);
    if (a !== e) failures.push(`${label}\n      expected ${e}\n      got      ${a}`);
}

export function report(name) {
    if (failures.length > 0) {
        console.error(`${name} failed: ${failures.length} of ${checks}.`);
        for (const failure of failures) console.error(`  - ${failure}`);
        process.exit(1);
    }
    console.log(`${name} passed: ${checks} checks.`);
}
