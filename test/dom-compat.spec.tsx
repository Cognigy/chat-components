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

import {
	botTextMessage,
	userTextMessage,
	agentTextMessage,
	engagementTextMessage,
	richBotMessage,
	quickRepliesBotMessage,
} from "./fixtures/layout-messages";
import type { IMessage } from "@cognigy/socket-client";

// ---- demo-page fixtures ----
// Each corresponds to a tab on test/demo.tsx. We cover every message type the
// demo renders via a <Message> component (i.e. everything except the
// non-Message tabs: "UI Components" and tabs that require stateful runtime
// setup like collation or streaming animation). Fixtures that don't ship with
// a `source` field are given `"bot"` at rendering time — the published
// baseline and the branch both follow the same rule so the comparison still holds.
import imageFixture from "./fixtures/image.json";
import imageDownloadableFixture from "./fixtures/image-downloadable.json";
import imageBrokenFixture from "./fixtures/imageBroken.json";
import videoFixture from "./fixtures/video.json";
import videoYoutubeFixture from "./fixtures/videoYoutube.json";
import videoAltTextFixture from "./fixtures/videoWithAltText.json";
import audioFixture from "./fixtures/audio.json";
import fileFixture from "./fixtures/file.json";
import listFixture from "./fixtures/list.json";
import galleryFixture from "./fixtures/gallery.json";
import galleryNullButtonsFixture from "./fixtures/gallery-with-null-buttons.json";
import actionButtonsFixture from "./fixtures/action-buttons.json";
import adaptiveCardsFixture from "./fixtures/adaptiveCards.json";
import webchat3EventFixture from "./fixtures/webchat3Event.json";
import datepickerSingleDate from "./fixtures/datepicker/singleDate.json";
import datepickerMinMax from "./fixtures/datepicker/singleDateWithMinMax.json";
import datepickerMultiple from "./fixtures/datepicker/multiple.json";
import datepickerRange from "./fixtures/datepicker/range.json";
import datepickerWeeks from "./fixtures/datepicker/weekNumbers.json";
import datepickerNoTime from "./fixtures/datepicker/noTime.json";
import datepickerTimeOnly from "./fixtures/datepicker/timeOnly.json";
import datepickerDisableWeekends from "./fixtures/datepicker/disableWeekends.json";

// Cast + default source helper. Fixtures are stored as plain JSON and some
// omit `source` because the existing per-component specs accept whatever
// shape the matcher needs; for Message-level rendering we must have a source
// so the non-user / non-engagement branches flow as expected.
const asBot = (raw: unknown): IMessage => ({ source: "bot", ...(raw as object) }) as IMessage;

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
//   3. CSS-module hashed class names. The published baseline build emits
//      classes in the default hashed form (`_header_21mid_1`, `_incoming_21mid_8`,
//      `_title2-regular_1ltiv_41`), while the branch-under-test source is
//      loaded by Vitest with `classNameStrategy: "non-scoped"` (see
//      vite.config.ts test.css.modules), which yields plain class names
//      (`header`, `incoming`, `title2-regular`). This is a build-time
//      packaging difference, not a DOM-structural one, so we canonicalize
//      both shapes to the plain name before comparing.
function normalize(html: string): string {
	return (
		html
			// collapse whitespace between tags
			.replace(/>\s+</g, "><")
			// trim leading/trailing whitespace
			.trim()
			// mask React useId tokens like :r0:, :R1a:, :Rab:
			.replace(/:[rR][0-9a-z]+:/g, ":__id__:")
			// mask react-tooltip / random uuid-ish ids seen in attribute values
			.replace(/tooltip-[A-Za-z0-9_-]+/g, "tooltip-__id__")
			// mask UUID v4-style ids (used by gallery subtitle/title/content ids)
			.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, "__uuid__")
			// mask swiper auto-generated wrapper/container ids: `swiper-wrapper-<hex>`
			.replace(/swiper-wrapper-[0-9a-f]+/g, "swiper-wrapper-__id__")
			// canonicalize hashed CSS-module class names:
			//   `_header_21mid_1` / `_title2-regular_1ltiv_41` → `header` / `title2-regular`
			.replace(/\b_([A-Za-z][\w-]*?)_[A-Za-z0-9]{4,6}_\d+\b/g, "$1")
			// collapse any resulting double spaces inside attribute values
			.replace(/  +/g, " ")
	);
}

// Optional `config` is forwarded as the <Message config={...}> prop. Used to
// unlock matcher branches that are gated behind widgetSettings — without it,
// the matcher early-returns and <Message> renders null, which would make the
// comparison trivially pass (empty === empty). The non-empty-render guard in
// assertSameDom catches such silent no-ops.
type Case = { name: string; message: IMessage; config?: unknown };

// Engagement teaser config: matcher.ts gates engagement-source messages
// behind `settings.teaserMessage.showInChat`. Without it, both renders
// resolve to null and the case becomes vacuous coverage.
const engagementConfig = {
	settings: { teaserMessage: { showInChat: true } },
};

// Core source fixtures. These exercise the Message/Header/Body structural
// contract across every MessageSender variant plus the two plugin payload
// shapes that exist in the layout-messages test helper.
const cases: Case[] = [
	{ name: "bot text message", message: botTextMessage },
	{ name: "user text message", message: userTextMessage },
	{ name: "agent text message", message: agentTextMessage },
	{ name: "engagement message", message: engagementTextMessage, config: engagementConfig },
	{ name: "bot gallery (generic template)", message: richBotMessage },
	{ name: "bot quick replies", message: quickRepliesBotMessage },
];

// Demo-page coverage. One case per demo tab where the tab renders via
// <Message> and is not inherently time- or animation-dependent. Skipped
// tabs: "UI Components" (renders ActionButtons/Typography/ChatEvent directly,
// not via <Message>), "Message Collation" (depends on prevMessage chaining),
// "Streaming messages with markdown" (animationState changes DOM over time),
// "Default Preview" + "HTML Sanitization" + "xApp Buttons" (require specific
// widgetSettings.config injection that isn't trivially picked up from JSON).
const demoCases: Case[] = [
	// Multimedia
	{ name: "demo: image", message: asBot(imageFixture) },
	{ name: "demo: image downloadable", message: asBot(imageDownloadableFixture) },
	{ name: "demo: image broken", message: asBot(imageBrokenFixture) },
	{ name: "demo: video", message: asBot(videoFixture) },
	{ name: "demo: video (YouTube)", message: asBot(videoYoutubeFixture) },
	{ name: "demo: video with alt text", message: asBot(videoAltTextFixture) },
	{ name: "demo: audio", message: asBot(audioFixture) },
	{ name: "demo: file", message: asBot(fileFixture) },
	// Templates
	{ name: "demo: list", message: asBot(listFixture) },
	{ name: "demo: gallery", message: asBot(galleryFixture) },
	{ name: "demo: gallery (null buttons)", message: asBot(galleryNullButtonsFixture) },
	{ name: "demo: quick replies / buttons", message: asBot(actionButtonsFixture) },
	// Datepicker variants (closed calendar — open state is non-deterministic)
	{ name: "demo: datepicker single date", message: asBot(datepickerSingleDate) },
	{ name: "demo: datepicker single date w/ min-max", message: asBot(datepickerMinMax) },
	{ name: "demo: datepicker multiple", message: asBot(datepickerMultiple) },
	{ name: "demo: datepicker range", message: asBot(datepickerRange) },
	{ name: "demo: datepicker week numbers", message: asBot(datepickerWeeks) },
	{ name: "demo: datepicker no time", message: asBot(datepickerNoTime) },
	{ name: "demo: datepicker time only", message: asBot(datepickerTimeOnly) },
	{ name: "demo: datepicker disable weekends", message: asBot(datepickerDisableWeekends) },
	// Misc
	// adaptiveCards fixture is an array — first entry is representative.
	{
		name: "demo: adaptive cards (first)",
		message: asBot((adaptiveCardsFixture as unknown as object[])[0]),
	},
	{ name: "demo: webchat3 event", message: asBot(webchat3EventFixture) },
];

// Shared assertion helper: render the same message through both packages,
// normalize the HTML, compare. Also asserts the rendered HTML is non-empty
// — without this guard, a fixture that silently fails to match any plugin
// would produce empty === empty and pass without exercising any DOM.
function assertSameDom(message: IMessage, config?: unknown) {
	const configProp = config as React.ComponentProps<typeof CurrentMessage>["config"];

	const { container: current, unmount: unmountCurrent } = render(
		<CurrentMessage message={message} config={configProp} />,
	);
	const currentHtml = normalize(current.innerHTML);
	unmountCurrent();

	const { container: baseline, unmount: unmountBaseline } = render(
		<BaselineMessage message={message} config={configProp} />,
	);
	const baselineHtml = normalize(baseline.innerHTML);
	unmountBaseline();

	expect(currentHtml).not.toBe("");
	expect(currentHtml).toBe(baselineHtml);
}

describe(`DOM compatibility: branch vs @cognigy/chat-components@${baselineVersion}`, () => {
	describe("core source fixtures", () => {
		it.each(cases)("$name — <Message> matches published release DOM", ({ message, config }) =>
			assertSameDom(message, config),
		);
	});

	describe("demo-page message tabs", () => {
		it.each(demoCases)("$name — matches published release DOM", ({ message, config }) =>
			assertSameDom(message, config),
		);
	});
});
