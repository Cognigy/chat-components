/**
 * Shared <Message> case corpus — the single source of truth for "every
 * message type this library renders".
 *
 * Two gates consume these tables:
 *   - test/dom-compat.spec.tsx renders each case through the branch's built
 *     <Message> AND the latest published release and compares the DOM
 *     (backward-compatibility contract for Webchat 3 and other consumers).
 *   - test/a11y.spec.tsx renders each case and runs axe-core against it
 *     (WCAG 2.2 AA contract — see docs/accessibility.md).
 *
 * Because both gates iterate the same tables, adding a new message type here
 * automatically puts it under BOTH the DOM-compat and the accessibility
 * gate — the two can never drift apart. When you add a message type to the
 * library, add its fixture JSON and a case entry here.
 */
import {
	botTextMessage,
	userTextMessage,
	agentTextMessage,
	engagementTextMessage,
	richBotMessage,
	quickRepliesBotMessage,
	quickRepliesNoTextBotMessage,
	defaultPreviewQuickReplies,
	defaultPreviewText,
	xAppQuickReply,
	xAppButton,
	sanitizedHtmlMessage,
	sanitizedCustomTagsMessage,
	sanitizationDisabledMessage,
	markdownText,
	borderlessText,
	collatedFollowupMessage,
	collatedPrevMessage,
} from "./messages";

// Demo-page fixtures. Each maps to a tab on test/demo.tsx; we cover every
// message type that demo renders via <Message>. Fixtures that omit `source`
// are given "bot" at render time via `asBot` — for dom-compat the baseline
// and the branch both apply the same default, so the comparison still holds.
import imageFixture from "./image.json";
import imageDownloadableFixture from "./image-downloadable.json";
import imageBrokenFixture from "./imageBroken.json";
import videoFixture from "./video.json";
import videoYoutubeFixture from "./videoYoutube.json";
import videoAltTextFixture from "./videoWithAltText.json";
import audioFixture from "./audio.json";
import fileFixture from "./file.json";
import listFixture from "./list.json";
import galleryFixture from "./gallery.json";
import galleryNullButtonsFixture from "./gallery-with-null-buttons.json";
import actionButtonsFixture from "./action-buttons.json";
import adaptiveCardsFixture from "./adaptiveCards.json";
import webchat3EventFixture from "./webchat3Event.json";
import datepickerSingleDate from "./datepicker/singleDate.json";
import datepickerMinMax from "./datepicker/singleDateWithMinMax.json";
import datepickerMultiple from "./datepicker/multiple.json";
import datepickerRange from "./datepicker/range.json";
import datepickerWeeks from "./datepicker/weekNumbers.json";
import datepickerNoTime from "./datepicker/noTime.json";
import datepickerTimeOnly from "./datepicker/timeOnly.json";
import datepickerDisableWeekends from "./datepicker/disableWeekends.json";

import type { IMessage } from "@cognigy/socket-client";

// Cast + default source helper. JSON fixtures sometimes omit `source`; the
// existing per-component specs accept whatever shape the matcher needs, but
// at the Message level a source is required so the non-user / non-engagement
// branches flow as expected.
export const asBot = (raw: unknown): IMessage =>
	({ source: "bot", ...(raw as object) }) as IMessage;

// Optional `config` is forwarded as the <Message config={...}> prop. Used to
// unlock matcher branches that are gated behind widgetSettings — without it,
// the matcher early-returns and <Message> renders null, which would make a
// consuming assertion trivially pass (empty === empty). Consumers must guard
// against empty renders (see assertSameDom in dom-compat / the a11y sweep).
//
// Optional `prevMessage` participates in collation: matcher / collation rules
// suppress the header on follow-up messages from the same source within a
// short timestamp window.
export type Case = {
	name: string;
	message: IMessage;
	config?: unknown;
	prevMessage?: IMessage;
};

// Per-tab widgetSettings configs. Source: test/demo.tsx — keep in sync if
// the demo's config shape moves.

// Engagement teaser: matcher.ts gates engagement-source messages behind
// `settings.teaserMessage.showInChat`. Without it, both renders resolve to
// null and the case becomes vacuous coverage.
const engagementConfig = {
	settings: { teaserMessage: { showInChat: true } },
};

// Default Preview: matcher.ts routes messages with `_defaultPreview` payload
// to that channel only when this flag is set; otherwise it falls back to the
// `_webchat` payload. Both demo Default-Preview fixtures encode "RENDER OK"
// in `_defaultPreview` and "RENDER WRONG" in `_webchat` so the assertion
// catches a regression that flipped the channel selection.
const defaultPreviewConfig = {
	settings: { widgetSettings: { enableDefaultPreview: true } },
};

// HTML sanitization variants from the demo's `HTML Sanitization` tab.
const customAllowedTagsConfig = {
	settings: { widgetSettings: { customAllowedHtmlTags: ["p", "strong"] } },
};
const sanitizationDisabledConfig = {
	settings: { layout: { disableHtmlContentSanitization: true } },
};

// Markdown / layout-flag text variants from the `Text messages` tab.
const renderMarkdownConfig = {
	settings: { behavior: { renderMarkdown: true } },
};
const disableBorderConfig = {
	settings: { layout: { disableBotOutputBorder: true } },
};

// Core source fixtures. These exercise the Message/Header/Body structural
// contract across every MessageSender variant plus the two plugin payload
// shapes (gallery, quick replies) defined in test/fixtures/messages.ts.
export const coreCases: Case[] = [
	{ name: "bot text message", message: botTextMessage },
	{ name: "user text message", message: userTextMessage },
	{ name: "agent text message", message: agentTextMessage },
	{ name: "engagement message", message: engagementTextMessage, config: engagementConfig },
	{ name: "bot gallery (generic template)", message: richBotMessage },
	{ name: "bot quick replies", message: quickRepliesBotMessage },
	{ name: "bot quick replies (no text)", message: quickRepliesNoTextBotMessage },
];

// Demo-page coverage. One case per demo tab where the tab renders via
// <Message>. Skipped:
//   - "UI Components" — renders ActionButtons / Typography / ChatEvent
//     directly, not through <Message>.
//   - "Streaming messages with markdown" — animationState transitions
//     ("start" / "animating" / "done") change the DOM over time, so a static
//     comparison would be flaky.
export const demoCases: Case[] = [
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
	// Adaptive Cards — fixture is an array; cover all three indices since
	// they exercise different card payload shapes.
	{
		name: "demo: adaptive cards [0]",
		message: asBot((adaptiveCardsFixture as unknown as object[])[0]),
	},
	{
		name: "demo: adaptive cards [1]",
		message: asBot((adaptiveCardsFixture as unknown as object[])[1]),
	},
	{
		name: "demo: adaptive cards [2]",
		message: asBot((adaptiveCardsFixture as unknown as object[])[2]),
	},
	// Default Preview — gated by widgetSettings.enableDefaultPreview; both
	// fixtures contrast `_defaultPreview` ("RENDER OK") against `_webchat`
	// ("RENDER WRONG") so the assertion catches a regression that flipped
	// the channel selection.
	{
		name: "demo: default preview (quick replies)",
		message: defaultPreviewQuickReplies,
		config: defaultPreviewConfig,
	},
	{
		name: "demo: default preview (text)",
		message: defaultPreviewText,
		config: defaultPreviewConfig,
	},
	// xApp Buttons — both shapes route through the matcher's openXApp branch.
	{ name: "demo: xApp button (quick reply)", message: xAppQuickReply },
	{ name: "demo: xApp button (template)", message: xAppButton },
	// HTML Sanitization — default config is already covered by `bot text
	// message`; these exercise the customAllowedHtmlTags / disableHtmlContent
	// Sanitization branches.
	{ name: "demo: sanitized html (default tags)", message: sanitizedHtmlMessage },
	{
		name: "demo: sanitized html (custom allowed tags)",
		message: sanitizedCustomTagsMessage,
		config: customAllowedTagsConfig,
	},
	{
		name: "demo: sanitization disabled",
		message: sanitizationDisabledMessage,
		config: sanitizationDisabledConfig,
	},
	// Markdown / layout-flag text variants from the `Text messages` tab.
	{ name: "demo: markdown text", message: markdownText, config: renderMarkdownConfig },
	{ name: "demo: borderless text", message: borderlessText, config: disableBorderConfig },
	// Message Collation — header suppression depends on `prevMessage`. This
	// case reproduces the demo's "bot follows bot within window" scenario.
	{
		name: "demo: collated bot follow-up (no header)",
		message: collatedFollowupMessage,
		prevMessage: collatedPrevMessage,
	},
	{ name: "demo: webchat3 event", message: asBot(webchat3EventFixture) },
];

// Cases covered by the a11y gate only. Use this table for a case that cannot
// run under dom-compat at all (e.g. its render is non-deterministic across
// packages); for a case whose DOM merely diverges from the current baseline
// by design, prefer the version-aware skip set in test/dom-compat.spec.tsx —
// it re-enables the case automatically once the fix version publishes.
export const a11yOnlyCases: Case[] = [];
