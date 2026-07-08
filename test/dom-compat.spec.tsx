/**
 * DOM compatibility: this branch's <Message> output must render DOM identical
 * to the latest published library release (@cognigy/chat-components installed
 * dynamically as the `chat-components-baseline` alias by
 * scripts/install-dom-compat-baseline.mjs — see that script for the why).
 *
 * Compares BUILT artifact vs BUILT artifact to avoid false positives caused
 * by Vitest's `classNameStrategy: "non-scoped"` CSS-module behavior (see
 * vite.config.ts). Under `non-scoped`, every CSS-module key resolves to its
 * literal camelCase name, which diverges from the production build in two
 * ways:
 *   - missing keys (e.g. `classes.slideImage` when `.slideImage` isn't in the
 *     CSS file) resolve to the literal string "slideImage" instead of
 *     `undefined`, producing a phantom `class="slideImage"` attribute;
 *   - two distinct CSS-module scopes that reuse the same key (e.g. `.button`
 *     in both Buttons.module.css and TextWithButtons.module.css) collapse to
 *     the same string, producing visible duplicates (`class="button button"`).
 * Neither divergence exists at runtime for real consumers. Building the
 * branch first and importing from `dist/` makes both sides go through the
 * same Vite production CSS-module pipeline, so the comparison reflects the
 * actual published DOM.
 *
 * RUN SEPARATION: this spec is excluded from the default `npm test` via
 * vite.config.ts (`test.exclude`). It's executed by `npm run test:dom-compat`,
 * which uses vitest.dom-compat.config.ts to narrow `include` to just this
 * file. On CI, the dedicated .github/workflows/dom-compat.yml invokes the
 * script after the baseline install + production build so it shows as its
 * own check on the PR.
 *
 * PRECONDITIONS:
 *   - `npm run test:dom-compat:install-baseline` has installed the
 *     `chat-components-baseline` alias (latest published release).
 *   - `npm run build` has produced `../dist/chat-components.js`.
 * The CI workflow wires both steps before invoking `npm run test:dom-compat`.
 *
 * The test renders the same fixtures through <Message> from both packages
 * side by side and performs a strict DOM structure comparison. Indentation,
 * inter-tag whitespace, React-generated dynamic ids (useId output like
 * `:r7:`, tooltip ids, UUID-based gallery ids, swiper wrapper hashes) and
 * CSS-module hash suffixes (`_header_21mid_1` → `header`) are normalized
 * away before comparing because they are not part of the structural
 * contract.
 *
 * If this test fails, the <Message> render path on this branch has diverged
 * from the published release — backward compatibility for consumers of the
 * Message DOM contract is broken.
 */
import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";

// Import from the branch's built dist/, not src/, so CSS-module resolution
// matches the baseline package (which is also a dist/ bundle). See preamble.
import { Message as CurrentMessage } from "../dist/chat-components.js";
import { Message as BaselineMessage } from "chat-components-baseline";
// Read the installed baseline's version so the describe block / failure
// messages show exactly which release we compared against. The baseline's
// package.json is not re-exported through the package's `exports` field, so
// we read the file directly instead of using a bare-specifier import.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
const __dirname = dirname(fileURLToPath(import.meta.url));
const baselineVersion: string = JSON.parse(
	readFileSync(
		resolve(__dirname, "../node_modules/chat-components-baseline/package.json"),
		"utf8",
	),
).version;

// The shared <Message> case corpus. The same tables drive the a11y gate
// (test/a11y.spec.tsx) — a new message type added there is automatically
// covered by both gates. See test/fixtures/message-cases.ts.
import { coreCases, demoCases, type Case } from "./fixtures/message-cases";

import type { IMessage } from "@cognigy/socket-client";

// Normalize HTML so that non-structural differences don't cause false
// positives. We strip:
//   1. Whitespace between tags (indentation is explicitly allowed to differ
//      per the PR review request).
//   2. React-generated auto ids (useId / react-tooltip). These look like
//      `:r0:`, `:R1a:`, `«r0»` in React 18 and are regenerated per render,
//      so the same component rendered twice produces two distinct id
//      strings. Any attribute value *containing* such a token gets the
//      token masked so cross-referenced attrs (aria-describedby, htmlFor,
//      for, id) stay equal to themselves after masking.
//   3. CSS-module hashed class names. Both `CurrentMessage` and
//      `BaselineMessage` are imported from built dist bundles, so both
//      sides emit hashed class tokens (`_header_21mid_1`, `_incoming_21mid_8`,
//      `_title2-regular_1ltiv_41`). The hash suffix is content-derived per
//      build, so the same logical class can carry a different suffix
//      between releases (or between two rebuilds of the same source after
//      a node_modules shuffle) even when the underlying DOM structure and
//      logical class identity are unchanged. That's a build-artifact
//      difference, not a DOM-structural one, so we canonicalize both
//      sides' tokens to their plain local names before comparing. The
//      plain-name shape (`header`, `incoming`) is also what
//      vite.config.ts uses for the regular Vitest run via
//      `classNameStrategy: "non-scoped"` — the canonicalization is a
//      no-op on that shape, which is convenient if anyone ever runs the
//      spec against a non-dist source build.
//
// NOT stripped — deliberately: `aria-*`, `role`, `alt`, `tabindex` and every
// other semantic attribute. They are consumer-facing API — assistive
// technology in Webchat 3 depends on them — so a regression in any of them
// must fail this comparison. Only the generated id VALUES inside such
// attributes are masked (symmetrically on both sides), never the attributes
// themselves. The "normalize preserves the accessibility contract" test below
// guards this property.
function normalize(html: string): string {
	return (
		html
			// Collapse INDENTATION between tags only — whitespace runs that
			// contain a newline. Single intentional spaces between inline
			// elements (e.g. `</strong> <em>`) are preserved so a regression
			// that drops or adds them is still caught.
			.replace(/>\s*[\r\n]\s*</g, "><")
			// trim leading/trailing whitespace
			.trim()
			// mask React useId tokens like :r0:, :R1a:, :Rab:, «r0», «R1a»
			.replace(/(?::[rR][0-9a-z]+:|«[rR][0-9a-z]+»)/g, "__id__")
			// mask react-tooltip / random uuid-ish ids seen in attribute values
			.replace(/tooltip-[A-Za-z0-9_-]+/g, "tooltip-__id__")
			// mask UUID v4-style ids (used by gallery subtitle/title/content ids)
			.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, "__uuid__")
			// mask swiper auto-generated wrapper/container ids: `swiper-wrapper-<hex>`
			.replace(/swiper-wrapper-[0-9a-f]+/g, "swiper-wrapper-__id__")
			// canonicalize hashed CSS-module class names:
			//   `_header_21mid_1` / `_title2-regular_1ltiv_41` → `header` / `title2-regular`
			.replace(/\b_([A-Za-z][\w-]*?)_[A-Za-z0-9]{4,6}_\d+\b/g, "$1")
			// Collapse double spaces ONLY inside HTML attribute values. The
			// CSS-module canonicalization above can leave `class="foo  bar"`
			// when one of the originals was a hashed token; class values are
			// space-separated so the extras are non-structural. Scoping this
			// to attribute values preserves intentional double spaces in text
			// content (e.g. `<pre>` blocks).
			.replace(/="([^"]*)"/g, (_match, value: string) => `="${value.replace(/  +/g, " ")}"`)
	);
}

// Shared assertion helper: render the same message through both packages,
// normalize the HTML, compare. Also asserts the rendered HTML is non-empty
// — without this guard, a fixture that silently fails to match any plugin
// would produce empty === empty and pass without exercising any DOM.
function assertSameDom(message: IMessage, config?: unknown, prevMessage?: IMessage) {
	const configProp = config as React.ComponentProps<typeof CurrentMessage>["config"];

	const { container: current, unmount: unmountCurrent } = render(
		<CurrentMessage message={message} config={configProp} prevMessage={prevMessage} />,
	);
	const currentHtml = normalize(current.innerHTML);
	unmountCurrent();

	const { container: baseline, unmount: unmountBaseline } = render(
		<BaselineMessage message={message} config={configProp} prevMessage={prevMessage} />,
	);
	const baselineHtml = normalize(baseline.innerHTML);
	unmountBaseline();

	expect(currentHtml).not.toBe("");
	expect(currentHtml).toBe(baselineHtml);
}

// Guard for the accessibility half of the DOM contract: normalize() must
// never strip semantic attributes. If a future normalizer change masks or
// removes aria-*/role/alt/tabindex, ARIA regressions vs the published
// release would pass dom-compat silently — this test makes that change
// impossible to land unnoticed. See docs/accessibility.md ("aria is API").
describe("normalize preserves the accessibility contract", () => {
	it("keeps aria-*, role, alt and tabindex attributes intact", () => {
		const html =
			'<div role="button" tabindex="0" aria-label="Close" aria-expanded="false">' +
			'<img alt="Product photo" role="img" /></div>';
		const normalized = normalize(html);
		expect(normalized).toContain('role="button"');
		expect(normalized).toContain('tabindex="0"');
		expect(normalized).toContain('aria-label="Close"');
		expect(normalized).toContain('aria-expanded="false"');
		expect(normalized).toContain('alt="Product photo"');
		expect(normalized).toContain('role="img"');
	});

	it("masks only the generated id token inside cross-referencing aria attributes", () => {
		// The useId token in the VALUE is masked, but the attribute survives.
		const normalized = normalize('<button aria-describedby=":r7:">x</button>');
		expect(normalized).toContain('aria-describedby="__id__"');
	});
});

// Cases whose DOM intentionally diverges from releases before 0.77.0:
//   - AB#105550: ActionButton dropped its aria-label and gained sr-only
//     position/new-tab spans — affects every case containing action buttons
//     (quick replies, image-downloadable, list, gallery, buttons template).
//   - AB#144248: ListItem renders images without `image_alt_text` as
//     `<span aria-hidden="true">` instead of an unnamed `<span role="img">`
//     (axe: role-img-alt) — affects "demo: list" (also in the set above).
//   - AB#90506 Avatart new data attribute which distinguishes between default avatart and custom avatart
// All of these stay in the shared corpus, so the a11y gate keeps scanning
// them. The skip is version-aware — once 0.77.0 ships to npm latest,
// install-dom-compat-baseline resolves to it, the condition turns false,
// and the cases re-enable themselves.
// TODO(AB#144248): delete this block once 0.77.0 is on npm latest.
const INTENTIONALLY_DIVERGING_PRE_0_77 = new Set<string>([
	"bot quick replies",
	"demo: image downloadable",
	"demo: list",
	"demo: gallery",
	"demo: gallery (null buttons)",
	"demo: quick replies / buttons",
]);
const semverLt = (a: string, b: string): boolean => {
	const pa = a.split(".").map(Number);
	const pb = b.split(".").map(Number);
	for (let i = 0; i < 3; i++) {
		if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) < (pb[i] ?? 0);
	}
	return false;
};
const isSkipped = (c: Case) =>
	semverLt(baselineVersion, "0.77.0") && INTENTIONALLY_DIVERGING_PRE_0_77.has(c.name);

describe(`DOM compatibility: branch vs @cognigy/chat-components@${baselineVersion}`, () => {
	describe("core source fixtures", () => {
		it.each(coreCases.filter(c => !isSkipped(c)))(
			"$name — <Message> matches published release DOM",
			({ message, config, prevMessage }) => assertSameDom(message, config, prevMessage),
		);
		it.skip.each(coreCases.filter(isSkipped))(
			"$name — skipped: intentional DOM change pending 0.77.0 publish (AB#105550 / AB#144248)",
			() => {},
		);
	});

	describe("demo-page message tabs", () => {
		it.each(demoCases.filter(c => !isSkipped(c)))(
			"$name — matches published release DOM",
			({ message, config, prevMessage }) => assertSameDom(message, config, prevMessage),
		);
		it.skip.each(demoCases.filter(isSkipped))(
			"$name — skipped: intentional DOM change pending 0.77.0 publish (AB#105550 / AB#144248)",
			() => {},
		);
	});
});
