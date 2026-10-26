import { NextResponse, type NextRequest } from "next/server";
import {
  REFRESH_MARGIN_MS,
  SESSION_COOKIE,
  refreshSession,
  sealSession,
  sessionCookieOptions,
  unsealSession,
} from "@/lib/auth/session-cookie";

// Gates the studio on the session cookie and keeps its access token fresh, so
// route handlers always read a token api-studio still accepts.
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const page = !pathname.startsWith("/api/");
  const signIn = () => {
    const url = new URL("/auth/login", request.url);
    url.searchParams.set("returnTo", pathname + search);
    return NextResponse.redirect(url);
  };
  // Signed out: pages under /studio go to the sign-in, the root shows its
  // button, and API routes answer 401 themselves.
  const signedOut = () => {
    const response = pathname.startsWith("/studio") ? signIn() : NextResponse.next();
    if (request.cookies.has(SESSION_COOKIE)) response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
    return response;
  };
  const signedIn = (response: NextResponse) => (pathname === "/" ? NextResponse.redirect(new URL("/studio", request.url)) : response);

  let session = await unsealSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return signedOut();
  if (session.expiresAt - Date.now() > REFRESH_MARGIN_MS) return signedIn(NextResponse.next());

  try {
    const result = await refreshSession(session);
    if ("expired" in result) {
      if (page) return signedOut();
      request.cookies.delete(SESSION_COOKIE);
      const response = NextResponse.next({ request: { headers: request.headers } });
      response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
      return response;
    }
    session = result.session;
  } catch (error) {
    // hub-api unreachable: keep the current session; api-studio decides
    // whether its token is still good, and the next request retries.
    console.error("[auth] token refresh failed", error instanceof Error ? error.message : error);
    return signedIn(NextResponse.next());
  }

  const sealed = await sealSession(session);
  request.cookies.set(SESSION_COOKIE, sealed);
  const response = signedIn(NextResponse.next({ request: { headers: request.headers } }));
  response.cookies.set(SESSION_COOKIE, sealed, sessionCookieOptions);
  return response;
}

export const config = {
  matcher: ["/", "/studio/:path*", "/api/:path*"],
};
