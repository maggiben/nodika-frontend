<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:openspec-agent-rules -->

# OpenSpec is the development workflow

Read the relevant `openspec/specs/<capability>/spec.md` before changing behavior. For every behavior-changing feature, bug fix, migration, dependency upgrade, or security change, create an OpenSpec change before implementation with `/opsx:propose`. Complete its required proposal, design, task, and delta-spec artifacts; apply the change; validate with `npm run spec:validate`; sync its accepted specs; and archive it only after implementation validation passes.

Use `/opsx:explore` when requirements or design are unclear. Do not create speculative API, database, authentication, service, or deployment specifications: these systems are not integrated in this frontend.
<!-- END:openspec-agent-rules -->
