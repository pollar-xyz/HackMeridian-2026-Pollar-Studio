import { studioAuthorization } from "@/lib/auth/session-cookie";
import { createStudioApi, StudioApiError } from "../chat/studio-api";
import { projectIdSchema } from "../chat/schemas/studio-api";

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

// The app's Soroban contracts: sources the AI wrote, ids soroban-factory deployed, explorer links.
export async function GET(request: Request) {
  const authorization = await studioAuthorization(request);
  if (!authorization) return json({ error: "Sign in to view the contract." }, 401);
  const appId = projectIdSchema.safeParse(new URL(request.url).searchParams.get("appId"));
  if (!appId.success) return json({ error: "Invalid project." }, 400);
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(20_000)]);
  try {
    const api = createStudioApi(authorization, signal);
    return json(await api.getContracts(appId.data));
  } catch (error) {
    return json({ error: signal.aborted ? "Contract request timed out. Try again."
      : error instanceof StudioApiError ? error.message : "Could not load the contract." },
    signal.aborted ? 504 : error instanceof StudioApiError ? error.status : 502);
  }
}
