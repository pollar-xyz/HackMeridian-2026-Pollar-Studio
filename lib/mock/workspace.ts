import { workspaceAppIdSchema } from "@/lib/schemas/studio-app";
import { MOCK_DATA } from "./data";
import { getMockApp } from "./get-app";
import type { App, Job } from "./types";

// New conversations keep their real UUID while the workspace uses demo content.
export function getWorkspaceMockApp(appId: string): App | undefined {
  const existing = getMockApp(appId);
  if (existing) return existing;
  if (!workspaceAppIdSchema.safeParse(appId).success) return undefined;
  const template = MOCK_DATA.apps[0];
  return template ? { ...template, id: appId } : undefined;
}

export function getWorkspaceMockJobs(app: App): Job[] {
  const source = MOCK_DATA.apps.find((item) => item.slug === app.slug);
  return MOCK_DATA.jobs
    .filter((job) => job.appId === (source?.id ?? app.id))
    .map((job) => ({ ...job, appId: app.id }))
    .sort((a, b) => b.startedAt - a.startedAt);
}
