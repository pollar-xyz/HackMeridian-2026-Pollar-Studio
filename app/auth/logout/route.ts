import { NextResponse, type NextRequest } from "next/server";
import { endSessionUrl, oidcConfig, revokeRefreshToken } from "@/lib/auth/oidc";
import { SESSION_COOKIE, sessionCookieOptions, unsealSession } from "@/lib/auth/session-cookie";

// Ends the studio session here and the central one on the issuer, which then
// sends the browser back to the studio root.
export async function GET(request: NextRequest) {
  const session = await unsealSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (session?.refreshToken) {
    await revokeRefreshToken(session.refreshToken).catch((error) => {
      console.error("[auth] refresh token revocation failed", error instanceof Error ? error.message : error);
    });
  }
  const target = await endSessionUrl(session?.idToken).catch(() => new URL(oidcConfig().postLogoutRedirectUri));
  const response = NextResponse.redirect(target);
  response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
