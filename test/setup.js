import { expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

// jsdom does not implement `innerText` (it is layout-dependent), so
// assigning to it is a silent no-op. adaptivecards sets all TextRun /
// input-label / action-title text through `element.innerText`, which made
// that text vanish in every jsdom render — input labels resolved to empty
// accessible names in the axe gate (test/a11y.spec.tsx) even though real
// browsers render them fine. Map innerText onto textContent so jsdom
// renders match browser output. (Approximation: textContent ignores
// styling/visibility, which is irrelevant for these tests.)
if (!Object.getOwnPropertyDescriptor(globalThis.HTMLElement.prototype, "innerText")) {
	Object.defineProperty(globalThis.HTMLElement.prototype, "innerText", {
		get() {
			return this.textContent;
		},
		set(value) {
			this.textContent = value;
		},
		configurable: true,
	});
}

afterEach(() => {
	cleanup();
});
