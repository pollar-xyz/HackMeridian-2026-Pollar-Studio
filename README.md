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

Open [http://localhost:4719](http://localhost:4719) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

Run the tests with `pnpm test`: Node's test runner loads every `*.test.mjs`, which import the
TypeScript sources directly through type stripping. That mode rejects TypeScript-only runtime
syntax such as constructor parameter properties (`constructor(public code: string)`), so declare
class fields explicitly.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Authentication

Studio signs in through the central Pollar sign-in page as the `studio`
OpenID Connect confidential client of hub-api (contract:
`system/docs/plane/DEV-311/contract.md`). It is a backend-for-frontend: the
browser holds only the `pollar_studio_session` cookie (httpOnly, Secure,
SameSite=Lax, a JWE encrypted with `STUDIO_SESSION_SECRET`) and never a token.

- `GET /auth/login?returnTo=/studio/...` creates `state`, `nonce` and the PKCE
  verifier, keeps them in the short-lived `pollar_studio_login` cookie and
  redirects to the issuer.
- `GET /auth/callback` checks `state`, exchanges the code with
  `client_secret_basic` + `code_verifier`, verifies the ID token and writes the
  session cookie (access, refresh and ID tokens, expiry, profile claims).
- `proxy.ts` sends signed-out visits under `/studio` to `/auth/login`, sends a
  signed-in visit to `/` on to `/studio`, and refreshes the access token a
  minute before it expires. Concurrent requests with the same refresh token
  share one refresh, because hub-api revokes the grant when a rotated refresh
  token is reused; that sharing is per process, so Studio runs one replica.
- `GET /api/auth/session` returns the profile (`id`, `mail`, `first_name`,
  `last_name`, `avatar`, `role`) for `useSession()`; never the tokens.
- `GET /auth/logout` revokes the refresh token, clears the cookie and ends the
  central session at the issuer, which returns to `/`.

Locally, open https://app.local.pollar.studio (`pnpm caddy`): the redirect URI
registered on hub-api and the Secure cookie both need that origin.

## Studio chat API

`POST /api/chat` forwards the session's access token as a Bearer to
`STUDIO_API_BASE_URL` (default: `https://api-studio.pollar.studio`). During local
development an optional server-side `STUDIO_DEV_TOKEN` in `.env.local` replaces
the session token. Never commit a token.

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
Other workspace tabs retain their existing implementation, apart from Deploys
and Built with (see below).

```bash
node --experimental-transform-types --test lib/auth/auth.test.mjs lib/ai/chat-stream.test.mjs lib/ai/generation-step.test.mjs app/api/chat/studio-generation.test.mjs app/api/chat/job-stream.test.mjs app/api/deployments/route.test.mjs app/api/built-with/route.test.mjs
```

## Deployment history

The Deploys tab reads real Dokploy records through `GET /api/deployments?appId=prj_...`.
The server forwards the session's Bearer to `GET /api/v1/projects/{projectId}/jobs`
and reads the project's stable URL. Expanded rows request persistent logs through
`GET /api/deployments?appId=prj_...&jobId=job_...`; the server verifies the job is
in that project's deployment history before reading `/api/v1/jobs/{jobId}/logs`.
All responses bypass caching. No Dokploy administrator credential is needed.

History refreshes every five seconds while visible, including after a deployment
finishes so new chat deployments appear. Open active logs refresh every three
seconds and once more on completion. Requests stop on navigation; background tabs
resume when visible. Failed or expired version URLs are not offered as live links.
Demo project IDs show an explanatory empty state instead of fabricated history.

The published Studio API has no standalone redeploy or GitHub export endpoint.
The old simulated export, push, and rebuild controls have been removed from this
tab. Send a chat message to generate and deploy a new version.

## Contract

For projects created in Studio, the Contract tab reads `GET /api/contracts?appId=prj_...`, which
forwards the session's Bearer to `/api/v1/projects/{projectId}/contracts`. It lists the app's Soroban
contracts as the builder deployed them through soroban-factory: name, status (`pending` until a
deploy succeeds), contract id with a stellar.expert link, when it went live, and the Rust source the
AI wrote. An app without contracts shows how to ask for one. Demo apps keep the illustrated mock view.
The tab refreshes every ten seconds while visible. When a generation deploys contracts, the chat answer
ends with their ids (the `done` event's `contracts`).

## Built with

`GET /api/built-with?appId=prj_...` forwards the session's Bearer to the Studio
project, `/api/v1/projects/{projectId}/summary`, and `/api/v1/tools` endpoints.
The tab displays the summary's tool usage and source evidence, resolving names
through the tool catalog. Detailed usage takes precedence over AI declarations;
additional declared tools are labeled Reported, and project settings without
usage evidence are labeled Configured. Catalog defaults never become project
integrations.

An owned project without a generated summary shows its available settings and
an empty state. Missing or inaccessible projects remain errors. The tab refreshes
every ten seconds while visible and supports manual refresh and retry.


### Publishing generated apps

The Preview Publish button opens the real-project publishing modal. `/api/marketplace` forwards the authenticated user's token and project revision to `PUT/DELETE /api/v1/projects/{id}/publication`. The backend configures the chosen HTTPS subdomain of `pollar.studio`, verifies availability, and then lists the app. The marketplace reads public listings on the server and opens their public URLs. Existing mock app views remain available.

Deploy the updated builder backend and set `STUDIO_API_BASE_URL` to it. For local development this can be `http://127.0.0.1:3001`; the default still points at the team's remote API. Publishing requires an already deployed app, Dokploy credentials and DNS routing on that backend. Missing configuration or failed readiness is shown as an error, never as a successful publication. Real infrastructure verification remains necessary after those credentials are available.
