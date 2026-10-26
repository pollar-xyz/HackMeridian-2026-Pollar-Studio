import { NextResponse, type NextRequest } from "next/server";
import { authorizationUrl } from "@/lib/auth/oidc";
import { codeChallenge, randomToken, safeReturnTo } from "@/lib/auth/pkce";
import { LOGIN_COOKIE, loginCookieOptions, sealLogin } from "@/lib/auth/session-cookie";

export async function GET(request: NextRequest) {
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get("returnTo"));
  const state = randomToken();
  const nonce = randomToken();
  const verifier = randomToken();
  const url = await authorizationUrl({ state, nonce, codeChallenge: await codeChallenge(verifier) });
  const response = NextResponse.redirect(url);
  response.cookies.set(LOGIN_COOKIE, await sealLogin({ state, nonce, verifier, returnTo }), loginCookieOptions);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
