import type { Metadata } from "next";
import { StyleScreen, styleMetadata, styleParams } from "./StyleScreen";

// Une page par style musical (« chanson makossa personnalisée »…), fabriquée au déploiement.
export function generateStaticParams() {
  return styleParams();
}

export async function generateMetadata({ params }: PageProps<"/style/[id]">): Promise<Metadata> {
  return styleMetadata((await params).id, "fr");
}

export default function Page({ params }: PageProps<"/style/[id]">) {
  return <StyleScreen params={params} locale="fr" />;
}
