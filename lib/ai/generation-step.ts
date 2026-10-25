import type { JobStatus } from "@/lib/mock/types";

// Use observed backend milestones rather than advancing a simulated timer.
export function generationStep(progress: string | undefined, logs: string): JobStatus {
  if (progress === "failed") return "failed";
  if (progress === "succeeded") return "published";
  let step: JobStatus = progress === "running" ? "generating" : "queued";
  for (const line of logs.split(/\r?\n/)) {
    if (/Preparing Next\.js workspace|Calling .* inside|Sending .* files|Applied .* files/i.test(line)) step = "generating";
    if (/Installing dependencies|Checking the build|application build|fix the build/i.test(line)) step = "building";
    if (/Deployment status: (queued|deploying)|Dokploy deployment queued/i.test(line)) step = "publishing";
  }
  return step;
}
