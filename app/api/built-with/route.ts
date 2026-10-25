import { createStudioApi, StudioApiError } from "../chat/studio-api";
import { projectIdSchema } from "../chat/schemas/studio-api";

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization || !/^Bearer \S+$/i.test(authorization)) {
    return json({ error: "Sign in to view app tools." }, 401);
  }
  const appId = projectIdSchema.safeParse(new URL(request.url).searchParams.get("appId"));
  if (!appId.success) return json({ error: "Invalid project." }, 400);
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(20_000)]);
  try {
    const api = createStudioApi(authorization, signal);
    // Check ownership first: a missing project is different from a summary that
    // has not been generated yet, even though both upstream routes return 404.
    const project = await api.getProject(appId.data);
    const [summary, catalog] = await Promise.all([
      api.getProjectSummary(appId.data).catch(error => {
        if (error instanceof StudioApiError && error.status === 404) return null;
        throw error;
      }),
      api.getToolCatalog(),
    ]);
    return json({ summary, selection: project.tools ?? {}, catalog });
  } catch (error) {
    return json({ error: signal.aborted ? "App tools request timed out. Try again."
      : error instanceof StudioApiError ? error.message : "Could not load app tools." },
    signal.aborted ? 504 : error instanceof StudioApiError ? error.status : 502);
  }
}
