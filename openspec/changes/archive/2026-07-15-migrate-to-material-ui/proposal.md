## Why

The current upload interface is styled entirely with Tailwind utilities, which does not meet the preferred component-library approach. Material UI will provide coherent accessible controls, theming, spacing, and feedback components while retaining the existing validated upload behavior.

## What Changes

- Replace Tailwind CSS and its PostCSS integration with Material UI and Emotion.
- Introduce a shared Material UI theme that uses the existing Geist font variables.
- Rewrite the home page and snapshot upload form with Material UI layout, form, alert, and button components.
- Preserve CodeMirror, React Hook Form, snapshot validation, and Core upload behavior.

## Capabilities

### New Capabilities

- `material-ui-theming`: Shared Material UI theme and baseline styles for the application.

### Modified Capabilities

- `application-shell`: The root layout will provide Material UI theming and baseline styling.
- `home-page`: The snapshot upload workflow will use Material UI components while preserving its responsive behavior.

## Impact

- Removes Tailwind CSS packages and `postcss.config.mjs`.
- Adds `@mui/material`, `@emotion/react`, and `@emotion/styled`.
- Updates global CSS, the root layout, page, and upload form.
