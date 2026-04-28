/**
 * Installs the latest published `@cognigy/chat-components` as the aliased
 * dev-dependency `chat-components-baseline`. Consumed by
 * `test/dom-compat.spec.tsx`, which compares the current branch's built
 * DOM output against the last public release.
 *
 * Why a script instead of a pinned devDependency?
 *   A pinned version would drift as releases happen; we'd have to bump
 *   package.json on every release or the DOM-compat check would silently
 *   assert against an older baseline. Resolving "latest" at install time
 *   keeps the check honest without human bookkeeping.
 *
 * Behavior:
 *   - Resolves the latest @cognigy/chat-components from the configured
 *     registry (`dist-tags.latest`).
 *   - Installs it as `chat-components-baseline@npm:@cognigy/chat-components@<latest>`
 *     without touching package.json / package-lock.json (`--no-save`).
 *   - If the working tree's own package.json version equals the latest
 *     published version, logs a notice — the DOM-compat test will still run
 *     but will effectively compare a rebuild against itself.
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

function main() {
	const current = currentVersion();
	const latest = latestPublishedVersion();

	console.log(`[dom-compat] working tree version:     ${current}`);
	console.log(`[dom-compat] latest published version: ${latest}`);

	if (current === latest) {
		console.log(
			`[dom-compat] NOTE: working tree is at the latest published version — ` +
				`DOM-compat check will compare a rebuild against itself.`,
		);
	}

	const installed = installedBaselineVersion();
	if (installed === latest) {
		console.log(`[dom-compat] baseline already installed at ${latest} — skipping.`);
		return;
	}

	console.log(
		`[dom-compat] installing ${ALIAS}@npm:${PKG_NAME}@${latest}` +
			(installed ? ` (replacing ${installed})` : "") +
			"...",
	);
	run(`npm install --no-save --no-package-lock --no-audit --no-fund ${ALIAS}@npm:${PKG_NAME}@${latest}`, {
		stdio: "inherit",
	});
	console.log(`[dom-compat] done.`);
}

try {
	main();
} catch (err) {
	console.error(`[dom-compat] failed: ${err?.message ?? err}`);
	process.exit(1);
}
