import type { Metadata } from "next";
import { HomePage } from "@/components/home/HomePage";
import { alternates } from "@/lib/i18n";

// Canonique et adresse de partage propres à l'accueil (les autres pages ont les leurs).
export const metadata: Metadata = {
  alternates: alternates("fr", "/"),
  openGraph: { url: "/", siteName: "Dédikace", locale: "fr_CM", type: "website" },
};

export default function Home() {
  return <HomePage locale="fr" />;
}
