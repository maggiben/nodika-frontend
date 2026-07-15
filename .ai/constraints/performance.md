# Performance Constraints

- Prefer server rendering and narrow Client Component islands to minimize shipped JavaScript.
- Use `next/image` for application imagery and preserve explicit dimensions to avoid layout shifts.
- Do not add a dependency for a small utility, icon, or styling task without measuring its impact.
- Keep route-level work out of the root layout unless every route needs it.
- Optimize only after identifying a route, asset, or interaction bottleneck; retain a before/after measurement.
