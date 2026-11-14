import type { MetadataRoute } from "next";

// « Ajouter à l'écran d'accueil » sur Android : nom, couleurs et icônes Dédikace.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dédikace — Ton nom dans une chanson",
    short_name: "Dédikace",
    description: "Une chanson personnalisée en quelques minutes, sur des rythmes de chez nous.",
    start_url: "/",
    display: "standalone",
    background_color: "#fff8ee",
    theme_color: "#d9401a",
    lang: "fr",
    icons: [
      { src: "/brand/icone-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icone-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/icone-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
