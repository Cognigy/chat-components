# Storybook for Chat Components

This directory contains the Storybook configuration for the Cognigy Chat Components library.

## Getting Started

### Running Storybook

```bash
npm run storybook
```

This will start Storybook on port 6006 (or the next available port).

### Building Storybook

```bash
npm run build-storybook
```

This creates a static build of Storybook in the `storybook-static` directory.

## Structure

### Configuration Files

- **main.ts**: Main Storybook configuration defining story locations, addons, and framework settings
- **preview.ts**: Global decorators, parameters, and styling for all stories
- **README.md**: This file

### Stories

Stories are located alongside their respective components:

#### Message Types
- **Text Messages**: [src/messages/Message.stories.tsx](src/messages/Message.stories.tsx)
- **Gallery**: [src/messages/Gallery/Gallery.stories.tsx](src/messages/Gallery/Gallery.stories.tsx)
- **Image**: [src/messages/Image/Image.stories.tsx](src/messages/Image/Image.stories.tsx)
- **Video**: [src/messages/Video/Video.stories.tsx](src/messages/Video/Video.stories.tsx)
- **Audio**: [src/messages/Audio/Audio.stories.tsx](src/messages/Audio/Audio.stories.tsx)
- **List**: [src/messages/List/List.stories.tsx](src/messages/List/List.stories.tsx)
- **File**: [src/messages/File/File.stories.tsx](src/messages/File/File.stories.tsx)
- **DatePicker**: [src/messages/DatePicker/DatePicker.stories.tsx](src/messages/DatePicker/DatePicker.stories.tsx)
- **AdaptiveCards**: [src/messages/AdaptiveCards/AdaptiveCards.stories.tsx](src/messages/AdaptiveCards/AdaptiveCards.stories.tsx)

#### Common Components
- **Avatar**: [src/common/Avatar.stories.tsx](src/common/Avatar.stories.tsx)
- **ChatEvent**: [src/common/ChatEvent.stories.tsx](src/common/ChatEvent.stories.tsx)
- **Buttons**: [src/common/Buttons/Buttons.stories.tsx](src/common/Buttons/Buttons.stories.tsx)
- **TypingIndicator**: [src/common/TypingIndicator/TypingIndicator.stories.tsx](src/common/TypingIndicator/TypingIndicator.stories.tsx)

## Features

### Addons Included

- **@storybook/addon-essentials**: Includes controls, actions, viewport, backgrounds, toolbars, and more
- **@storybook/addon-interactions**: Test user interactions within Storybook
- **@storybook/addon-links**: Create links between stories

### CollationProvider Context

All message component stories are wrapped with `CollationProvider` to properly initialize the message collation context. This is necessary to avoid circular dependency initialization issues between `utils.ts` and `matcher.ts`.

## Adding New Stories

When creating a new story for a message component:

1. Create a `.stories.tsx` file next to your component
2. Import the `CollationProvider` if your component uses the Message wrapper
3. Add the decorator to your meta configuration:

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import Message from "../Message";
import { CollationProvider } from "../collation";

const meta: Meta<typeof Message> = {
  title: "Messages/YourComponent",
  component: Message,
  decorators: [
    (Story) => (
      <CollationProvider>
        <Story />
      </CollationProvider>
    ),
  ],
};

export default meta;
```

## Test Fixtures

Stories reuse test fixtures from `test/fixtures/` directory, ensuring consistency between tests and documentation.

## Notes

- Storybook uses Vite 7 with `--legacy-peer-deps` flag due to version compatibility
- Stories automatically generate documentation with the `autodocs` tag
- Background colors can be switched using the toolbar (light/dark/chat-bg)
