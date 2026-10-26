import { studioAuthorization } from "@/lib/auth/session-cookie";
import { z } from "zod";
import { createStudioApi, StudioApiError } from "../chat/studio-api";
import { projectIdSchema } from "../chat/schemas/studio-api";

// Deleting removes deployments, DNS records and the database one by one.
export const maxDuration = 180;
const messages: Record<string, string> = {
  PROJECT_BUSY: "The app is being built, deployed or published. Try again when it finishes.",
  PROJECT_CLEANUP_FAILED: "The app could not be fully deleted. Nothing is lost: try again.",
};

export async function DELETE(request: Request) {
  const authorization = await studioAuthorization(request);
  if (!authorization) return Response.json({ error: "Sign in to delete an app." }, { status: 401 });
  const input = z.object({ appId: projectIdSchema }).safeParse(await request.json().catch(() => null));
  if (!input.success) return Response.json({ error: "Invalid project." }, { status: 400 });
  try {
    const api = createStudioApi(authorization, AbortSignal.any([request.signal, AbortSignal.timeout(170_000)]));
    // Read the revision here, so a rename in another tab cannot block the deletion.
    const project = await api.getProject(input.data.appId);
    await api.deleteProject(project.projectId, project.revision);
    return new Response(null, { status: 204 });
  } catch (error) {
    const status = error instanceof StudioApiError ? error.status : 502;
    const message = error instanceof StudioApiError ? messages[error.code] ?? (status === 404 ? "This app no longer exists." : "Could not delete the app. Please try again.") : "Could not delete the app. Please try again.";
    return Response.json({ error: message }, { status });
  }
}
