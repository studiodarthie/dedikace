import type { Metadata } from "next";
import { OccasionScreen, occasionMetadata, occasionParams } from "./OccasionScreen";

// Une page par occasion, fabriquée au déploiement ; adresse inconnue → 404 (référencement : « chanson d'anniversaire avec prénom »…).
export function generateStaticParams() {
  return occasionParams();
}

export async function generateMetadata({ params }: PageProps<"/chanson/[slug]">): Promise<Metadata> {
  return occasionMetadata((await params).slug, "fr");
}

export default function Page({ params }: PageProps<"/chanson/[slug]">) {
  return <OccasionScreen params={params} locale="fr" />;
}
