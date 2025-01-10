[![ESLint](https://github.com/Cognigy/chat-components/actions/workflows/eslint.yml/badge.svg)](https://github.com/Cognigy/chat-components/actions/workflows/eslint.yml)

# Chat Components

This repository contains reusable components Cognigy uses in various of their products in order to render chat-messages such as:

-   text messages
-   galleries
-   quick replies
-   buttons
-   images

and much more. We aim to use these components in various products such as:

-   Cognigy.AI - as part of our Interaction Panel
-   Cognigy Insights - as part of the Transcript Explorer
-   Cognigy Live Agent - in order to render the Chat history
-   Webchat v3 - our new Webchat Widget

## Develop

`npm run dev`

`npm run test:watch`

### To test in local Webchat v3 build:

1. In /chat-components run `npm ci && npm run build && npm pack`
2. In /Webchat folder run npm i with the correct relative path and file name, e.g. `npm i ../chat-components/cognigy-chat-components-0.36.1.tgz`

## Release

`npm version patch`
or
`npm version minor`

It will bump the version in `package.json`, commit it and create a git tag.

Push the changes to the GitHub and create a PR.

**After the PR is merged:**

`git push --tags`

This will trigger the GitHub Action to create a release on GitHub and will publish the package to npm.
