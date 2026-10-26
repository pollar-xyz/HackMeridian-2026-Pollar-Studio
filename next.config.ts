import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Locally the dev server sits behind Caddy as app.local.pollar.studio, the
  // origin the OIDC redirect URI and the Secure session cookie are bound to.
  // Without it Next blocks the dev resources and React never hydrates.
  allowedDevOrigins: ["app.local.pollar.studio"],
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
