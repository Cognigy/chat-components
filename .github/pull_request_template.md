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

<!-- Only items CI cannot verify belong here — the lint:a11y and test:a11y gates
     already block the PR on their own. -->

# Accessibility (WCAG 2.2 AA)

- [ ] New message types have a case entry in `test/fixtures/message-cases.ts` (one entry covers both the axe and DOM-compat gates)
- [ ] Interaction spec (`<Component>A11y.spec.tsx`) added/updated for new or changed interactive behavior
- [ ] No unjustified `eslint-disable jsx-a11y/*` comments or known-violation allowlist entries
- [ ] Intentional changes to rendered `aria-*`/`role` attributes are called out in the release notes so Webchat can re-run its accessibility suite on the version bump (`docs/accessibility.md`, "ARIA is API")
- [ ] Contrast checked manually via the demo (`npm run dev`) if colors changed

# Additional considerations

- [ ] This PR might have performance implications

# Documentation Considerations

These are hints for the documentation team to help write the docs.
