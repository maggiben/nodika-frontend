## Context

The application has one interactive upload screen styled by Tailwind CSS 4. Material UI is requested as the sole application component and styling system. The existing Geist CSS variables remain available from `next/font`.

## Goals / Non-Goals

**Goals:**

- Remove Tailwind runtime/build dependencies and use Material UI components exclusively.
- Provide consistent responsive layout, theme, and accessible controls.
- Preserve the upload route, JSON editor, validation, and token-handling security behavior.

**Non-Goals:**

- Changing upload semantics, JSON validation, or Core integration.
- Adding dark-mode preference persistence or a UI component library beyond Material UI.

## Decisions

### Material UI provider

A Client Component provider wraps the root body with `ThemeProvider` and `CssBaseline`. The theme uses the existing Geist Sans variable for typography and establishes light/dark palette support with Material UI’s system preference support.

### Component migration

The server-rendered page composes `Container`, `Stack`, `Typography`, and `Paper`; the existing Client Component uses Material UI form controls, alerts, buttons, and layout primitives. CodeMirror remains the JSON editor because it supplies the required JSON syntax highlighting.

### Tailwind removal

Tailwind and its PostCSS plugin are removed. Global CSS retains only document-level defaults and no utility/theme directives. Removing `postcss.config.mjs` avoids a build-time reference to removed packages.

## Risks / Trade-offs

- [Material UI increases client bundle size] → Use only core components and retain the narrow Client Component boundary around the form.
- [Theme provider is a client boundary] → Keep the route itself server-rendered and pass only children through the provider.
- [Visual regression during migration] → Preserve semantic landmarks, labels, validation summaries, and responsive constraints in the component rewrite.
