import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Locally the dev server sits behind Caddy as studio.local.pollar.xyz, the
  // origin where passkeys work (rpID pollar.xyz). Without it Next blocks the dev
  // resources and React never hydrates.
  allowedDevOrigins: ["studio.local.pollar.xyz"],
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
