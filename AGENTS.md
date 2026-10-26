# AGENTS.md - Pollar Studio

Guide for coding agents (Claude Code, Codex, Cursor) working on this repo. Read it before changing code.
For what the product is and how it works, read [README.md](README.md) first.

## What this repo is

The Pollar Studio front end: a Next.js 16 backend-for-frontend where a user describes an app, the
builder generates and deploys it, and the user previews, iterates, publishes and lists it.

- It does not generate or deploy anything itself. Route handlers under `app/api/` forward the
  session's access token to the Studio API (`STUDIO_API_BASE_URL`, repo
  https://github.com/pollar-xyz/pollar-app-builder-studio). Its OpenAPI is at
  `<STUDIO_API_BASE_URL>/api/v1/openapi.json`.
- Login is the central Pollar login (OIDC against hub-api, `accounts.pollar.xyz`). The browser only
  holds the encrypted `pollar_studio_session` cookie. Tokens never reach client code.
- `lib/mock/` holds the types and UI state the workspace was first built on. Real projects have ids
  starting with `prj_` and read everything from the Studio API. Do not show mock data for a real project,
  and do not add new features on top of `lib/mock`.

## Commands

```bash
pnpm install
pnpm dev        # http://localhost:4719
pnpm caddy      # https://app.local.pollar.studio (the OIDC redirect and the Secure cookie need it)
pnpm test       # node --test over every *.test.mjs, importing the TypeScript sources directly
pnpm lint
npx tsc --noEmit
```

Run `pnpm test`, `pnpm lint` and `npx tsc --noEmit` before every commit.

Tests use Node's type stripping, which rejects TypeScript-only runtime syntax: declare class fields
explicitly instead of `constructor(public code: string)`.

## Rules

- **There is no staging.** The Studio API, hub-api and the Pollar SDK API are production services.
  A local run creates real projects, real Pollar applications and real deployments.
- **Never read, print or commit `.env` files or tokens.** Only `.env.example` documents configuration.
  Do not paste secret keys or API keys into prompts or the terminal.
- **Server-only code stays server-only.** Anything that touches the session or a token lives in route
  handlers or `server-only` modules, never in a client component.
- **i18n**: English strings are the keys (`lib/i18n/translate.ts`). A new user-facing string gets its
  `es` and `pt` entries in `lib/i18n/es.ts` and `lib/i18n/pt.ts`.
- **Never fake success.** If the Studio API fails or is not configured, show the error. A demo value
  must never look like a real result.
- **Comments**: comment the exception, not the line, and describe the present. History belongs in the
  commit message.
- **Scope**: one or two features that work end to end beat ten that half work. Do not add features
  nobody asked for.

## This Next.js version

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Pollar references

| What | Where |
|---|---|
| Pollar docs | https://docs.pollar.xyz |
| Docs index for agents | https://docs.pollar.xyz/llms.txt |
| All docs in one file | https://docs.pollar.xyz/llms-full.txt |
| Pollar agent skill (wallets, auth, transactions, ramps, React and React Native) | https://raw.githubusercontent.com/pollar-xyz/pollar/main/skills/pollar-wallet-auth/SKILL.md |
| What the builder gives the model | `context/` in pollar-app-builder-studio: the skill, the docs.pollar.xyz pages, the Stellar knowledge base |
| Studio API contract | `<STUDIO_API_BASE_URL>/api/v1/openapi.json` |

Generated apps use `@pollar/react`: sign-in with email, Google or passkeys, a Stellar wallet per user,
sponsored fees and trustlines, USDC/EURC payments, swaps, x402 and bank cashouts through anchors.

## Stellar references

| What | Where |
|---|---|
| Stellar docs for agents | https://developers.stellar.org/llms.txt |
| Official and community agent skills (includes the Pollar skill) | https://skills.stellar.org, source https://github.com/stellar/stellar-dev-skill |
| Raven, Stellar's MCP: use it to find gaps in an idea or a design | https://raven.stellar.org |
| Quest: check what the AI got wrong about Stellar | https://quest.stellar.org |
| Ecosystem resources | https://github.com/stellar/ecosystem-resources |
| OpenZeppelin Stellar contracts (smart accounts, spending limits, fee abstraction, confidential tokens) | https://docs.openzeppelin.com/stellar-contracts |
| Testnet explorer | https://stellar.expert/explorer/testnet |
