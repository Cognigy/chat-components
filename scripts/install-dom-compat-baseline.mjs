/**
 * Installs the right baseline build of `@cognigy/chat-components` as the
 * aliased dev-dependency `chat-components-baseline`. Consumed by
 * `test/dom-compat.spec.tsx`, which compares the current branch's built
 * DOM output against that baseline.
 *
 * Baseline selection:
 *   We default to the dist-tag `latest` so the check stays honest as
 *   releases happen — no human has to bump a pinned devDependency and
 *   risk silently asserting against a stale version.
 *
 *   But when the working tree's own version is *behind* npm latest (which
 *   happens whenever a release ships from a sibling branch before main has
 *   merged it — e.g. a hotfix or an out-of-order feature release), comparing
 *   `working tree source` vs `npm latest` reports the divergence the
 *   sibling-branch release introduced, not anything this branch did. To
 *   keep the check actionable we degrade to rebuild-vs-itself in that case
 *   by installing the working tree's own version as the baseline.
 *
 *   Resulting policy: baseline = min(npm `latest`, working tree version).
 *
 * Behavior:
 *   - Reads the working tree's version from package.json.
 *   - Reads npm latest via `npm view <pkg> version`.
 *   - Picks the lower of the two as the baseline (semver compare).
 *   - Installs `chat-components-baseline@npm:@cognigy/chat-components@<baseline>`
 *     with `--no-save --no-package-lock` so the lockfile isn't touched.
 *   - Logs a clear notice when the comparison degrades to rebuild-vs-itself
 *     (either current === latest, or current < latest).
 *
 * Usage:
 *   node scripts/install-dom-compat-baseline.mjs
 *   # or via npm:
 *   npm run test:dom-compat:install-baseline
 *
 * Exit codes:
 *   0 — baseline installed (or already present at the resolved version)
 *   1 — npm view / npm install failed
 */

import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";

const PKG_NAME = "@cognigy/chat-components";
const ALIAS = "chat-components-baseline";

function run(cmd, opts = {}) {
	// execSync returns null when stdout is inherited (no captured buffer), so
	// we only call .toString() when we know we captured stdout.
	const out = execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"], ...opts });
	return out == null ? "" : out.toString().trim();
}

function currentVersion() {
	const pkg = JSON.parse(readFileSync("package.json", "utf8"));
	return pkg.version;
}

function latestPublishedVersion() {
	// `npm view <pkg> version` returns the version tagged `latest`.
	return run(`npm view ${PKG_NAME} version`);
}

function installedBaselineVersion() {
	const p = `node_modules/${ALIAS}/package.json`;
	if (!existsSync(p)) return null;
	try {
		return JSON.parse(readFileSync(p, "utf8")).version ?? null;
	} catch {
		return null;
	}
}

// Numeric semver compare for plain `MAJOR.MINOR.PATCH` strings.
// Returns negative if a < b, 0 if equal, positive if a > b. Pre-release
// suffixes are ignored — package.json/npm release versions are always
// plain triplets in this repo, so we don't need full semver semantics.
function compareSemver(a, b) {
	const parse = v =>
		v
			.split("-")[0]
			.split(".")
			.map(n => parseInt(n, 10) || 0);
	const [a1, a2, a3] = parse(a);
	const [b1, b2, b3] = parse(b);
	return a1 - b1 || a2 - b2 || a3 - b3;
}

function main() {
	const current = currentVersion();
	const latest = latestPublishedVersion();

	console.log(`[dom-compat] working tree version:     ${current}`);
	console.log(`[dom-compat] latest published version: ${latest}`);

	// Pick the lower of the two as the baseline. Rationale in the file
	// preamble: when the working tree is behind npm latest (an anomaly that
	// happens when a release shipped from a sibling branch before main
	// merged it), comparing branch vs npm latest reports the sibling
	// release's diff, not anything this branch did.
	const cmp = compareSemver(current, latest);
	const baseline = cmp < 0 ? current : latest;

	if (cmp === 0) {
		console.log(
			`[dom-compat] NOTE: working tree is at the latest published version — ` +
				`DOM-compat check will compare a rebuild against itself.`,
		);
	} else if (cmp < 0) {
		console.log(
			`[dom-compat] NOTE: working tree (${current}) is behind npm latest ` +
				`(${latest}); pinning baseline to ${current} so the check ` +
				`degrades to rebuild-vs-itself instead of reporting drift this ` +
				`branch can't fix.`,
		);
	}

	const installed = installedBaselineVersion();
	if (installed === baseline) {
		console.log(`[dom-compat] baseline already installed at ${baseline} — skipping.`);
		return;
	}

	console.log(
		`[dom-compat] installing ${ALIAS}@npm:${PKG_NAME}@${baseline}` +
			(installed ? ` (replacing ${installed})` : "") +
			"...",
	);
	run(
		`npm install --no-save --no-package-lock --no-audit --no-fund ${ALIAS}@npm:${PKG_NAME}@${baseline}`,
		{
			stdio: "inherit",
		},
	);
	console.log(`[dom-compat] done.`);
}

try {
	main();
} catch (err) {
	console.error(`[dom-compat] failed: ${err?.message ?? err}`);
	process.exit(1);
}
