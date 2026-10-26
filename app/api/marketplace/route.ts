import { studioAuthorization } from "@/lib/auth/session-cookie";
import { z } from "zod";
import { createStudioApi, StudioApiError } from "../chat/studio-api";
import { projectIdSchema } from "../chat/schemas/studio-api";
import { marketplaceInputSchema } from "@/lib/schemas/marketplace";

export const maxDuration = 180;
const messages: Record<string, string> = {
  PUBLICATION_NOT_CONFIGURED: "Publishing is not configured on this server yet. Dokploy access is required.",
  APP_NOT_DEPLOYED: "Wait for a successful app deployment before publishing.",
  INVALID_PUBLICATION_ADDRESS: "Choose a new HTTPS subdomain of pollar.studio, different from the preview address.",
  ADDRESS_TAKEN: "That address is already in use. Choose another one.",
  PUBLICATION_NOT_READY: "The address did not become available yet. Your app has not been published. Try again.",
  PUBLICATION_BUSY: "Another publication or deployment is in progress. Try again shortly.",
  UNPUBLISH_BEFORE_ADDRESS_CHANGE: "Unpublish the previous address before choosing another one.",
};
function errorResponse(error: unknown) { return Response.json({ error: error instanceof StudioApiError && error.status === 412 ? "This app changed. Close and reopen this dialog before saving." : error instanceof StudioApiError ? (messages[error.code] ?? (error.status >= 500 ? "Publishing failed. Please try again." : error.message)) : "Could not update the marketplace. Please try again." }, { status: error instanceof StudioApiError ? error.status : 502 }); }
const headers = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  const appId = new URL(request.url).searchParams.get("appId");
  const authorization = appId ? await studioAuthorization(request) : null;
  if (appId && !authorization) return Response.json({ error: "Sign in to publish an app." }, { status: 401 });
  if (appId && !projectIdSchema.safeParse(appId).success) return Response.json({ error: "Invalid project." }, { status: 400 });
  try {
    const api = createStudioApi(authorization ?? "", AbortSignal.any([request.signal, AbortSignal.timeout(160_000)]));
    if (!appId) return Response.json(await api.listMarketplace(), { headers });
    const project = await api.getProject(appId);
    return Response.json({ revision: project.revision, name: project.identity.displayName, url: project.url ?? null, marketplace: project.marketplace ?? null }, { headers });
  } catch (error) { return errorResponse(error); }
}

async function write(request: Request, method: "PUT" | "DELETE") {
  const authorization = await studioAuthorization(request);
  if (!authorization) return Response.json({ error: "Sign in to publish an app." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const input = (method === "DELETE" ? z.object({ appId: projectIdSchema })
    : z.object({ appId: projectIdSchema, listing: marketplaceInputSchema })).safeParse(body);
  const revision = request.headers.get("if-match");
  if (!input.success || !/^rev-[1-9]\d*$/.test(revision ?? "")) return Response.json({ error: "Check the title, URL and one-liner." }, { status: 400 });
  try {
    const api = createStudioApi(authorization, AbortSignal.any([request.signal, AbortSignal.timeout(160_000)]));
    const project = method === "PUT"
      ? await api.saveMarketplace(body.appId, body.listing, Number(revision!.slice(4)))
      : await api.removeMarketplace(body.appId, Number(revision!.slice(4)));
    return Response.json({ projectId: project.projectId, revision: project.revision, marketplace: project.marketplace ?? null }, { headers });
  } catch (error) { return errorResponse(error); }
}
export const PUT = (request: Request) => write(request, "PUT");
export const DELETE = (request: Request) => write(request, "DELETE");
