import { z } from "zod";

const httpUrl = z.string().url().regex(/^https?:\/\//);
export const deploymentJobIdSchema = z.string().regex(/^job_[\w-]+$/);

// GET /projects/{projectId}/jobs exposes Dokploy records, not generation jobs.
export const studioDeploymentSchema = z.object({
  type: z.literal("deploy"),
  jobId: deploymentJobIdSchema,
  status: z.string().min(1),
  url: httpUrl.nullable(),
  current: z.boolean(),
  createdAt: z.iso.datetime({ offset: true }),
  dokploy: z.object({
    deploymentId: z.string(),
    status: z.string(),
    title: z.string().nullable().optional(),
    createdAt: z.iso.datetime({ offset: true }),
    finishedAt: z.iso.datetime({ offset: true }).nullable().optional(),
    errorMessage: z.string().nullable().optional(),
  }).nullable().optional(),
});

export const studioDeploymentListSchema = z.object({ jobs: z.array(studioDeploymentSchema) });
export const deploymentsResponseSchema = studioDeploymentListSchema.extend({ url: httpUrl.nullable() });
export type StudioDeployment = z.infer<typeof studioDeploymentSchema>;

export function deploymentIsActive(deployment: StudioDeployment) {
  return ["queued", "running", "building", "deploying"].includes(deployment.status);
}

export function deploymentLiveUrl(deployment: StudioDeployment) {
  return deployment.status === "live" ? deployment.url : null;
}
