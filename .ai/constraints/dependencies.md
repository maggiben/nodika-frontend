# Dependency Constraints

- Do not create a new dependency unless existing Next.js, React, Material UI, React Hook Form, CodeMirror, or Vitest capabilities cannot meet the requirement.
- Before adding one, document the use case, bundle/runtime impact, maintenance state, license, and removal plan.
- Use the package manager already selected by the repository lockfile; do not commit competing lockfiles.
- Keep framework packages compatible with Next.js 16.2.10 and React 19.2.4.
- Add a focused test or build validation for every dependency-driven change.
