import { readCookie, SESSION_COOKIE, unsealSession } from "@/lib/auth/session-cookie";

export async function GET(request: Request) {
  const session = await unsealSession(readCookie(request, SESSION_COOKIE));
  const headers = { "Cache-Control": "no-store" };
  if (!session) return Response.json({ error: "Not signed in" }, { status: 401, headers });
  return Response.json({ profile: session.profile }, { headers });
}
