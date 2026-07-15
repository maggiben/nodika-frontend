# React and Forms

## Purpose

Build typed React UI and form behavior using React 19.2.4 and React Hook Form 7.81.0.

## Responsibilities

- Keep display-only components server-rendered when possible.
- Isolate interactive form controls in small Client Components.
- Use React Hook Form for form state; define a concrete TypeScript value type for every form.

## Inputs and outputs

Input: UI state or form requirements. Output: typed components with explicit validation and accessible error rendering.

## Best practices

- Pass serializable props across Server/Client Component boundaries.
- Use `useForm<Values>()`; derive error text from `formState.errors`.
- Keep business rules outside JSX so the same rule can serve routes and UI.

## Common mistakes

- Using `any` for form values or errors.
- Turning an entire page into a Client Component to support one input.
- Adding a form without a submit contract or validation strategy.

## Example

```tsx
"use client";
import { useForm } from "react-hook-form";
type Values = { email: string };
const form = useForm<Values>({ defaultValues: { email: "" } });
```

## Related files

`package.json`, `src/app/page.tsx`, `tsconfig.json`
