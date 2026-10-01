import { describe, it, expect } from "vitest";
// src/utils → matcher → message components → Message.tsx → src/utils is a
// module cycle; Message.tsx instantiates a utils class at module top, so the
// graph must be entered via Message (as every component spec does) rather
// than via utils directly.
import "src/messages/Message";
import { resolveAttachmentUrl } from "src/utils";

describe("resolveAttachmentUrl", () => {
	it("prefers downloadUrl when both are present", () => {
		const result = resolveAttachmentUrl({
			url: "https://legacy.example.com/file.png",
			downloadUrl: "https://download.example.com/file.png",
		});
		expect(result).toBe("https://download.example.com/file.png");
	});

	it("falls back to url when downloadUrl is absent", () => {
		const result = resolveAttachmentUrl({ url: "https://legacy.example.com/file.png" });
		expect(result).toBe("https://legacy.example.com/file.png");
	});

	it("treats an empty-string downloadUrl as present, not absent", () => {
		// Documents current behavior: `??` only falls back on null/undefined. If the
		// backend ever sends "" instead of omitting the field, this pins what happens
		// today rather than silently changing behavior later.
		const result = resolveAttachmentUrl({
			url: "https://legacy.example.com/file.png",
			downloadUrl: "",
		});
		expect(result).toBe("");
	});

	it("returns undefined when neither is present", () => {
		const result = resolveAttachmentUrl({});
		expect(result).toBeUndefined();
	});
});
