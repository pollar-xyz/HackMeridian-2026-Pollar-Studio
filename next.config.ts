import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Locally the dev server sits behind Caddy as app.local.pollar.studio, an
  // origin pollar.xyz/.well-known/webauthn lets use the hub-api passkeys.
  // Without it Next blocks the dev resources and React never hydrates.
  allowedDevOrigins: ["app.local.pollar.studio"],
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
