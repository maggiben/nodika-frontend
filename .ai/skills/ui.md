# UI, Styling, and Accessibility

## Purpose

Extend the existing Material UI theme without creating a competing design system.

## Responsibilities

- Use Material UI components and the shared theme for layout, styling, feedback, and controls.
- Reuse the Geist font variables provided by `src/app/layout.tsx` and `src/components/app-theme.tsx`.
- Maintain usable light and dark color schemes and semantic HTML.

## Inputs and outputs

Input: a visual requirement. Output: responsive, keyboard-usable markup with a minimal CSS footprint.

## Best practices

- Start with semantic elements (`main`, `nav`, `button`, `label`, headings).
- Keep focus states, sufficient contrast, visible labels, and logical heading order.
- Use `next/image` with meaningful `alt` text; use empty alt only for decoration.

## Common mistakes

- Bypassing the shared Material UI theme with ad-hoc CSS or inline visual constants.
- Copying the starter page’s external template links into product UI.
- Encoding product colors or spacing repeatedly instead of extending established tokens after design decisions exist.

## Example

```tsx
<Button type="submit" variant="contained">
  Save
</Button>
```

## Related files

`src/components/app-theme.tsx`, `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`
