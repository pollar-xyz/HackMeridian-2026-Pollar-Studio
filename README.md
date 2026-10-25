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

`POST /api/chat` forwards the caller's `Authorization: Bearer ...` to
`STUDIO_API_BASE_URL` (defaults to `https://api-studio.pollar.studio`).
The frontend currently passes a temporary JWT directly in `lib/ai/use-studio-chat.ts`;
replace that argument with the authenticated user's access token.
Gateway credentials and the AI SDK are no longer used.

A first message creates a project named `Nueva app`, emits its real `prj_...` ID,
and enqueues a generation. Follow-up messages pass that same ID as `appId`.
The server polls job status and logs every two seconds and exposes SSE events:
`app`, `job`, `progress`, `log`, `warning`, `delta`, `done`, and `error`.
Only appended log content is sent. `succeeded` and `failed` are terminal;
`deployment.phase` is informational. The model's final summary becomes the
assistant response, rather than pretending the backend streams model tokens.

The generation prompt asks the model to respect an explicitly requested name,
or choose a descriptive name otherwise. A `PROJECT_NAME:` line in the summary
is used to PATCH project metadata with the current `If-Match` revision; that
line is removed from the visible response. Renaming failures are shown as warnings.

The stream times out after ten minutes. Disconnecting or stopping the response
stops polling; the backend has no documented endpoint to cancel its job.
When a job succeeds, its `result.deployment.origin` is sent through SSE, saved with the app, and used by the address bar and Preview iframe. Other workspace tabs continue to use mock data. To run adapter and SSE tests:

```bash
node --test lib/ai/chat-stream.test.mjs app/api/chat/studio-generation.test.mjs
```
