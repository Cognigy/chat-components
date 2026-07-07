<!-- Keep this template in sync with .azuredevops/pull_request_template.md — GitHub ignores
     .azuredevops/, and PRs are reviewed on GitHub, so both copies must match. -->

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

- [ ] `npm run lint:a11y` passes
- [ ] `npm run test:a11y` passes (new message types added to `test/fixtures/message-cases.ts`)
- [ ] Interaction spec (`<Component>A11y.spec.tsx`) added/updated for new or changed interactive behavior
- [ ] No unjustified `eslint-disable jsx-a11y/*` comments or known-violation allowlist entries
- [ ] ARIA attribute changes follow the dom-compat skip + release-notes procedure (`docs/accessibility.md`)
- [ ] Contrast checked manually via the demo (`npm run dev`) if colors changed

# Additional considerations

- [ ] This PR might have performance implications

# Documentation Considerations

These are hints for the documentation team to help write the docs.
