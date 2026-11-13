import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Vidéo statut (lib/video.ts) : binaire ffmpeg et rendu des textes, gardés hors du bundle,
  // et fichiers à embarquer dans la fonction Inngest qui fabrique la vidéo.
  serverExternalPackages: ["ffmpeg-static", "@resvg/resvg-js"],
  outputFileTracingIncludes: {
    "/api/inngest": ["./node_modules/ffmpeg-static/ffmpeg", "./assets/fonts/*.ttf"],
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
