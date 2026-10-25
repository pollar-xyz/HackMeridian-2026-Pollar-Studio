import { endsEven } from "./random";
import type { App, Job, JobStatus } from "./types";

export const CREDIT_COSTS = {
  generating: 20,
  building: 5,
  publishing: 10,
} as const;

export const JOB_STEPS: Array<{ key: JobStatus; label: string }> = [
  { key: "queued", label: "Queued" },
  { key: "generating", label: "Generating" },
  { key: "building", label: "Building" },
  { key: "publishing", label: "Deploying" },
  { key: "published", label: "Ready" },
];

export function stepIndex(status: JobStatus): number {
  if (status === "retrying") return 2;
  if (status === "failed") return -1;
  return JOB_STEPS.findIndex((s) => s.key === status);
}

export function isTerminal(status: JobStatus): boolean {
  return status === "published" || status === "failed";
}

export interface JobRunnerApi {
  getJob(jobId: string): Job | undefined;
  getApp(appId: string): App | undefined;
  patchJob(jobId: string, patch: Partial<Job>): void;
  appendLog(jobId: string, line: string): void;
  finishBuild(appId: string, sha: string): string; // stores the reviewable build, returns the contract id
  applyPatch(appId: string, patch: Partial<App>): void;
  spendCredits(amount: number, reason: string, appId?: string): void;
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const running = new Set<string>();

export function runJob(jobId: string, api: JobRunnerApi): void {
  if (running.has(jobId)) return;
  running.add(jobId);
  void execute(jobId, api).finally(() => running.delete(jobId));
}

async function execute(jobId: string, api: JobRunnerApi): Promise<void> {
  const job = api.getJob(jobId);
  if (!job) return;
  const app = api.getApp(job.appId);
  if (!app) return;
  const startedAt = job.startedAt;
  const log = (text: string) => {
    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
    api.appendLog(jobId, `${elapsed}s ${text}`);
  };
  const setStatus = (status: JobStatus) => api.patchJob(jobId, { status });

  try {
    setStatus("queued");
    log("Job queued");
    await wait(600);

    setStatus("generating");
    if (job.trigger === "prompt") {
      api.spendCredits(CREDIT_COSTS.generating, "Generating", app.id);
      log("Reading prompt");
      await wait(800);
      log(`Picked template ${app.kind}`);
      await wait(800);
      log("Generating app/ and components/");
      await wait(500);
      log("Wiring Pollar SDK: passkey login, wallet, PayButton");
      await wait(400);
    } else if (job.trigger === "chat") {
      log("Reading your message");
      await wait(500);
      for (const change of job.changes ?? []) {
        log(`Applying: ${change}`);
        await wait(400);
      }
    } else {
      log("Pulling main from GitHub");
      await wait(400);
      log("Source already generated, skipping generation");
      await wait(300);
    }

    const build = async () => {
      setStatus("building");
      api.spendCredits(CREDIT_COSTS.building, "Building", app.id);
      log("pnpm install");
      await wait(700);
      log("tsc");
      await wait(650);
      log("pnpm build");
      await wait(650);
    };

    await build();

    if (endsEven(app.id) && job.trigger === "prompt") {
      log("error: Type error in components/PayButton.tsx");
      setStatus("retrying");
      log("Retrying (attempt 2 of 3)");
      await wait(800);
      api.patchJob(jobId, { attempt: 2 });
      await build();
      log("Build fixed on attempt 2");
    }

    setStatus("publishing");
    api.spendCredits(CREDIT_COSTS.publishing, "Preview deploy", app.id);
    if (job.patch) api.applyPatch(app.id, job.patch);
    const contractId = api.finishBuild(app.id, job.commit?.sha ?? "");
    log(`Deploying payment contract to Stellar ${app.network ?? "testnet"}`);
    await wait(350);
    log(`Contract live at ${contractId.slice(0, 8)}...${contractId.slice(-4)}, settles in ${app.asset ?? "USDC"}`);
    await wait(200);
    log("Sponsor wallet funded, network fees covered for your users");
    await wait(250);
    log("Stablecoin rails enabled: QR Bolivia, Pix Brazil, Transfer Argentina");
    await wait(250);
    log("Identity checks connected for bank cashouts");
    await wait(200);
    log("Creating API key");
    await wait(150);
    log("Deploying a private preview");
    await wait(250);

    api.patchJob(jobId, { status: "published", finishedAt: Date.now() });
    log("Preview ready for review");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    log(`error: ${message}`);
    api.patchJob(jobId, { status: "failed", finishedAt: Date.now() });
  }
}
