---
description: Review the current PR / diff for WCAG 2.2 AA accessibility compliance
---

Run an accessibility-focused review of the current changes.

1. Run both gates and capture the results:
    - `npm run lint:a11y` — static jsx-a11y gate.
    - `npm run test:a11y` — axe over the shared message corpus + interaction states.
2. Use the `a11y-reviewer` subagent (`.claude/agents/a11y-reviewer.md`) to review the diff against `main` for WCAG 2.2 Level AA compliance and this repo's governance rules (`docs/accessibility.md`). If `$ARGUMENTS` contains a PR number, review that PR (`gh pr diff $ARGUMENTS`); otherwise review the local branch diff vs. `main`. Pass the gate results to the subagent.

Report the subagent's findings grouped by severity (blocker / should-fix / nit), each with a `file:line`, the relevant WCAG success criterion or repo rule, and a concrete fix. Finish with: whether both gates pass, whether the change meets WCAG 2.2 AA, whether any new message type has its `test/fixtures/message-cases.ts` entry (and `live-region-helper.ts` branch), whether new/changed interactive behavior has an interaction A11y spec, and whether any rendered ARIA changes followed the dom-compat skip + release-notes procedure.
