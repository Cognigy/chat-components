# Success criteria

Please describe what should be possible after this change. List all individual items on a separate line.

- A
- B
- C

# How to test

Please describe the individual steps on how a peer can test your change.

1. A
2. B
3. C

# Security

- [ ] Possible injection vector
- [ ] Authentication/Access controls touched
- [ ] Sensitive Data could be exposed
- [ ] XSS
- [ ] Logging/Monitoring touched
- [ ] Exchanges data with external systems
- [ ] No security implications

# Accessibility (WCAG 2.2 AA)

<!-- CI already gates linting (lint:a11y) and axe (test:a11y) — these are the two
     things no gate can catch. Everything else: docs/accessibility.md -->

- [ ] New message types have a case entry in `test/fixtures/message-cases.ts` (one entry covers both the axe and DOM-compat gates)
- [ ] Interaction spec (`<Component>A11y.spec.tsx`) added/updated for new or changed interactive behavior

# Additional considerations

- [ ] This PR might have performance implications

# Documentation Considerations

These are hints for the documentation team to help write the docs.
