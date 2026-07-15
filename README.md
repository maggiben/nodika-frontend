# Nodika Frontend

Nodika Frontend is a [Next.js](https://nextjs.org) BFF for the Nodika Core
snapshot upload workflow.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Core authentication configuration

Set the server-only Core base URL before running the app:

```bash
NODIKA_CORE_URL=https://core.example npm run dev
```

The browser uses same-origin `/api/auth/*` routes for registration, login,
logout, email verification, and password recovery. Core access and refresh
tokens are kept only in root-path `Secure`, `HttpOnly`, `SameSite=Lax` cookies;
they are never returned in JSON responses or read by client-side code.

Snapshot uploads use the access-token cookie. If Core returns a 401, the BFF
refreshes once using the refresh-token cookie, rotates both cookies on success,
and clears the session with a safe 401 response if refresh fails.

Because session cookies are marked `Secure`, test complete browser sessions over
HTTPS. Do not use `NEXT_PUBLIC_NODIKA_CORE_URL` or paste Core tokens into the
application.

## Validation

```bash
npm run test:coverage
npm run format:check
npm run lint
npm run build
npm run spec:validate
```

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Spec-driven development

This repository uses [OpenSpec](https://github.com/Fission-AI/OpenSpec) as the source of truth for behavior.

1. Read the relevant current specification in `openspec/specs/`.
2. Explore unclear requirements with `/opsx:explore`.
3. Create a proposed change with `/opsx:propose <change>`.
4. Implement only after its required artifacts are complete, using `/opsx:apply`.
5. Validate with `npm run spec:validate`, sync accepted delta specs, then archive with `/opsx:archive`.

The installed Cursor commands require an IDE restart before they appear.

# nodika-frontend
