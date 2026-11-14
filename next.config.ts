import type { NextConfig } from "next";

// En-têtes de sécurité sur toutes les pages. Pas de CSP stricte des scripts (pixel Meta, scripts de Next) :
// on bloque l'essentiel sans risque de casser le paiement ou la connexion.
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Micro : vocal des souvenirs (/creer). Rien d'autre n'est demandé au téléphone.
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), payment=(), usb=(), microphone=(self)" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; upgrade-insecure-requests" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Styles retirés : l'ancienne page renvoie vers le style qui la remplace (référencement conservé).
  async redirects() {
    return [
      { source: "/style/ndombolo", destination: "/style/zouklove", permanent: true },
      { source: "/en/style/ndombolo", destination: "/en/style/zouklove", permanent: true },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  /* config options here */
  cacheComponents: true,
  // Vidéo statut (lib/video.ts) : binaire ffmpeg et rendu des textes, gardés hors du bundle,
  // et fichiers à embarquer dans la fonction Inngest qui fabrique la vidéo.
  serverExternalPackages: ["ffmpeg-static", "@resvg/resvg-js"],
  outputFileTracingIncludes: {
    "/api/inngest": ["./node_modules/ffmpeg-static/ffmpeg", "./assets/fonts/*.ttf", "./assets/brand/*.svg"],
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
