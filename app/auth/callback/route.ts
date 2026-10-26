import { NextResponse, type NextRequest } from "next/server";
import { exchangeCode, oidcConfig } from "@/lib/auth/oidc";
import {
  LOGIN_COOKIE,
  SESSION_COOKIE,
  loginCookieOptions,
  sealSession,
  sessionCookieOptions,
  unsealLogin,
} from "@/lib/auth/session-cookie";

// The browser comes back from the sign-in page with `?code=&state=`, or with
// `?error=` when the user cancelled or the provider refused.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const login = await unsealLogin(request.cookies.get(LOGIN_COOKIE)?.value);
  const code = params.get("code");
  const { publicUrl } = oidcConfig();

  const fail = (reason: string) => {
    const response = NextResponse.redirect(new URL(`/?error=${encodeURIComponent(reason)}`, publicUrl));
    response.cookies.set(LOGIN_COOKIE, "", { ...loginCookieOptions, maxAge: 0 });
    return response;
  };

  if (params.get("error")) return fail(params.get("error") === "access_denied" ? "cancelled" : "signin");
  if (!login || !code || params.get("state") !== login.state) return fail("expired");

  try {
    const session = await exchangeCode(code, login.verifier, login.nonce);
    const response = NextResponse.redirect(new URL(login.returnTo, publicUrl));
    response.cookies.set(LOGIN_COOKIE, "", { ...loginCookieOptions, maxAge: 0 });
    response.cookies.set(SESSION_COOKIE, await sealSession(session), sessionCookieOptions);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    console.error("[auth] code exchange failed", error instanceof Error ? error.message : error);
    return fail("signin");
  }
}
