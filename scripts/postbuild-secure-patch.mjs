/* eslint-env node */
/**
 * Post-build secure patch script.
 *
 * Goal:
 * Apply targeted string replacements to the compiled bundle(s) in the `dist` directory
 * to harden against CodeQL issues we selected.
 *
 * This script is intentionally conservative: it only performs textual rewrites that
 * are:
 *  - Idempotent (safe to run multiple times)
 *  - Narrowly scoped to patterns indicated by the scan results
 *  - Logged, with a summary of applied changes
 *
 * Targeted patches applied:
 *
 * 1. js/incomplete-sanitization:
 *    - Promote single-occurrence < / > replacements to global form
 *    - Promote single-occurrence backslash replacements to global form
 *    - Ensure class selector utility additionally globally escapes backslashes
 *
 * 2. js/overly-large-range:
 *    - Replace suspicious character class `[!#$&-;=?-Z_a-z~]` with explicit enumeration `[!#$&'()*+,\\-./0-9:;=?@A-Z_a-z~]`
 *
 * 3. js/incomplete-hostname-regexp:
 *    - Escape literal dots in YouTube URL regex (`(?:www.)?youtube.com` => `(?:www\\.)?youtube\\.com`)
 *
 * NOTE: If future CodeQL results add more patterns, extend PATCH_RULES below.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import console from "node:console";

const DIST_DIR = path.resolve(process.cwd(), "dist");

async function listDistFiles() {
	let entries;
	try {
		entries = await fs.readdir(DIST_DIR, { withFileTypes: true });
	} catch (e) {
		console.error(`[secure-patch] Unable to read dist directory: ${DIST_DIR}`, e);
		process.exitCode = 1;
		return [];
	}
	return entries
		.filter(d => d.isFile() && /\.(m?js|cjs|jsbundle)$/.test(d.name))
		.map(d => path.join(DIST_DIR, d.name));
}

const PATCH_RULES = [
	{
		id: "sanitize-angle-brackets",
		description: "Promote single-occurrence < or > replacements to global form",
		apply: content => ({
			updated: content
				.replace(/\.replace\('<','&lt;'\)/g, '.replace(/</g,"&lt;")')
				.replace(/\.replace\("<","&lt;"\)/g, '.replace(/</g,"&lt;")')
				.replace(/\.replace\('>','&gt;'\)/g, '.replace(/>/g,"&gt;")')
				.replace(/\.replace\(">", "&gt;"\)/g, '.replace(/>/g,"&gt;")'),
		}),
	},
	{
		id: "sanitize-backslash-single",
		description: "Promote single-occurrence backslash replacement to global form",
		apply: content => ({
			updated: content.replace(
				/\.replace\(['"]\\\\['"],\s*(['"])([^'"]+?)\1\)/g,
				(_match, quote, inner) => `.replace(/\\\\/g,${quote}${inner}${quote})`,
			),
		}),
	},
	{
		id: "classes-to-selector-backslash-escape",
		description: "Ensure classes-to-selector escapes backslashes globally",
		apply: content => {
			const selectorPattern =
				/\.trim\(\)\.replace\(\(\/\(\[\\.:!\+\/()\[\]\]\)\/g,'\\\$1'\)\.replace\(\/ \/g,'\.'\)/;
			if (
				selectorPattern.test(content) &&
				!/\.replace\(\/\\\\\/g,'\\\\\\\\'\)/.test(content)
			) {
				return {
					updated: content.replace(
						selectorPattern,
						m => m + ".replace(/\\\\/g,'\\\\\\\\')",
					),
				};
			}
			return { updated: content };
		},
	},
	{
		id: "micromark-overly-large-range",
		description: "Replace overly large character class range with explicit enumeration",
		apply: content => ({
			updated: content.replace(
				/\[!#\$&-;=\?-Z_a-z~\]/g,
				() => "[!#$&'()*+,\\-./0-9:;=?@A-Z_a-z~]",
			),
		}),
	},
	{
		id: "youtube-host-regex",
		description: "Escape dot before youtube.com inside URL regex patterns",
		apply: content => ({
			updated: content.replace(/\(\?:www\.\)\?youtube\.com/g, "(?:www\\.)?youtube\\.com"),
		}),
	},
];

async function applyPatchesToFile(filePath) {
	let original;
	try {
		original = await fs.readFile(filePath, "utf8");
	} catch (e) {
		console.error(`[secure-patch] Failed to read ${filePath}`, e);
		return { filePath, changed: false, applied: [], error: e };
	}
	let content = original;
	const applied = [];
	for (const rule of PATCH_RULES) {
		const before = content;
		const { updated } = rule.apply(content);
		if (updated !== before) {
			content = updated;
			applied.push(rule.id);
		}
	}
	if (applied.length) {
		try {
			await fs.writeFile(filePath, content, "utf8");
		} catch (e) {
			console.error(`[secure-patch] Failed to write ${filePath}`, e);
			return { filePath, changed: false, applied: [], error: e };
		}
		return { filePath, changed: true, applied };
	}
	return { filePath, changed: false, applied: [] };
}

async function main() {
	console.log("[secure-patch] Starting post-build security patching...");
	const files = await listDistFiles();
	if (!files.length) {
		console.warn("[secure-patch] No distributable JS files found; nothing to patch.");
		return;
	}
	const results = [];
	for (const f of files) {
		const res = await applyPatchesToFile(f);
		results.push(res);
	}

	const summary = {
		totalFiles: files.length,
		changedFiles: results.filter(r => r.changed).length,
		unchangedFiles: results.filter(r => !r.changed).length,
		ruleUsage: {},
	};
	for (const r of results) {
		for (const id of r.applied) {
			summary.ruleUsage[id] = (summary.ruleUsage[id] || 0) + 1;
		}
	}

	console.log("[secure-patch] Patch summary:");
	console.log(JSON.stringify(summary, null, 2));

	for (const r of results) {
		if (r.changed) {
			console.log(`  [+] ${r.filePath} => applied: ${r.applied.join(", ")}`);
		} else {
			console.log(`  [=] ${r.filePath} (no changes)`);
		}
	}

	// Non-zero exit code only on IO errors.
	if (results.some(r => r.error)) {
		process.exitCode = 1;
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch(err => {
		console.error("[secure-patch] Uncaught error:", err);
		process.exitCode = 1;
	});
}

export {}; // Ensure this remains an ES module.
