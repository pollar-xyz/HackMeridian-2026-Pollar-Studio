import { studioAuthorization } from "@/lib/auth/session-cookie";
import { createStudioApi, StudioApiError } from "../chat/studio-api";
import { loadCredits } from "./credits";

export async function GET(request: Request) {
  const authorization = await studioAuthorization(request);
  if (!authorization) return Response.json({ error: "Sign in to see your credits." }, { status: 401 });
  try {
    const api = createStudioApi(authorization, AbortSignal.any([request.signal, AbortSignal.timeout(20_000)]));
    return Response.json(await loadCredits(api), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: "Could not load your credits." }, { status: error instanceof StudioApiError ? error.status : 502 });
  }
}
