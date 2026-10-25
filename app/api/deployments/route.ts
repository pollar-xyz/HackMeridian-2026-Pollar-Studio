import { createStudioApi, StudioApiError } from "../chat/studio-api";
import { projectIdSchema } from "../chat/schemas/studio-api";
import { deploymentJobIdSchema } from "@/lib/schemas/studio-deployment";

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization || !/^Bearer \S+$/i.test(authorization)) {
    return Response.json({ error: "Sign in to view deployments." }, { status: 401 });
  }
  const params = new URL(request.url).searchParams;
  const appId = projectIdSchema.safeParse(params.get("appId"));
  const jobId = params.get("jobId");
  if (!appId.success || (jobId !== null && !deploymentJobIdSchema.safeParse(jobId).success)) {
    return Response.json({ error: "Invalid project or deployment." }, { status: 400 });
  }
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(20_000)]);
  try {
    const api = createStudioApi(authorization, signal);
    const { jobs } = await api.listDeployments(appId.data);
    if (jobId !== null) {
      // Verify project membership before reading the selected job's logs.
      if (!jobs.some(job => job.jobId === jobId)) {
        return Response.json({ error: "Deployment not found in this project." }, { status: 404 });
      }
      return new Response(await api.getLogs(jobId), {
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
      });
    }
    const project = await api.getProject(appId.data);
    return Response.json({ jobs, url: project.url ?? null }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: signal.aborted ? "Deployment request timed out. Try again."
      : error instanceof StudioApiError ? error.message : "Could not load deployments." },
    { status: signal.aborted ? 504 : error instanceof StudioApiError ? error.status : 502 });
  }
}
