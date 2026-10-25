This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Studio chat API

`POST /api/chat` forwards the caller's Bearer to `STUDIO_API_BASE_URL`
(default: `https://api-studio.pollar.studio`). During local development an optional
`NEXT_PUBLIC_STUDIO_DEV_TOKEN` in `.env.local` overrides the session token. The
upstream currently documents a fixed development JWT, so hub-api sessions are
not yet guaranteed to work there. Never commit a token.

The first message creates a project without `displayName`; the backend names it
from the original prompt. Subsequent requests use the same project ID. Prompts
are sent unchanged to `POST /projects/{id}/chat`; conversation context is owned
by the backend. No `PROJECT_NAME` convention or metadata PATCH is needed.

The server consumes `GET /jobs/{id}/stream` using fetch with Authorization and
maps upstream `log`, `phase`, and `done` events to frontend SSE. It no longer polls.
Only URLs marked `live` become the Preview iframe source. `building`, `failed`,
and `expired` have explicit preview states. Each successful deployment can replace
the previous URL. Stop/disconnect closes the stream; it does not cancel the job.
The stream has a ten-minute timeout.

`GET /api/chat` lists owned projects. `GET /api/chat?appId=prj_...` retrieves a
project and its persisted conversation; `?jobId=job_...` reads a job. On reload,
active jobs reconnect with `resumeJobId` instead of creating another generation.
Conversations are held in memory while navigating and recovered from the backend
after a reload. Chat messages and logs are not persisted in browser storage.
Other workspace tabs retain their existing implementation.

```bash
node --test lib/ai/chat-stream.test.mjs lib/ai/generation-step.test.mjs app/api/chat/studio-generation.test.mjs app/api/chat/job-stream.test.mjs
```
