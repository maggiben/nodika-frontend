# Nodika Frontend Constitution

## Mission

Evolve this Next.js 16 frontend safely from its current server-rendered App Router foundation.

## Non-negotiable principles

1. Evidence before invention: document and implement only contracts that exist or are explicitly approved.
2. Server first: preserve Server Components unless browser-only behavior needs a narrow Client Component.
3. Type and validate boundaries: strict TypeScript is not runtime validation; never use `any`.
4. Accessible UI is a release requirement, not a polish pass.
5. Keep changes small, reversible, tested where behavior exists, and production-buildable.
6. Do not add dependencies, services, or package-manager lockfiles without justification and review.
7. OpenSpec is mandatory for behavior changes: read current specs, propose before implementation, validate, sync accepted deltas, then archive.
8. DRY: do not duplicate knowledge. Shared domain rules, validation, formatting, and mapping live in one typed module; copy-paste across routes, Client Components, or helpers is a defect to extract, not a shortcut.
9. SOLID (applied to this frontend):
   - Single Responsibility: each module/component owns one reason to change (UI shell, form state, parsing, storage, or presentation—not several).
   - Open/Closed: extend via composition, props, and shared utilities; avoid editing stable core paths for one-off feature variants.
   - Liskov Substitution: interchangeable components and helpers must honor the same contracts (props, return shapes, error behavior) without callers needing special cases.
   - Interface Segregation: prefer narrow props and focused modules over god objects or catch-all context bags.
   - Dependency Inversion: UI depends on typed abstractions (pure functions, lib modules, validated shapes), not on concrete I/O details scattered through components.

## Current baseline

`src/app` contains the only route; there is no backend, persistence, auth, payment, CI/CD, container, or deployment implementation. `next.config.ts` must retain the explicit Turbopack root setting.
