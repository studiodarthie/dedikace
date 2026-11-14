import type { Metadata } from "next";
import { alternates } from "@/lib/i18n";
import { CreatePage } from "./CreatePage";

export const metadata: Metadata = {
  title: "Créer ma chanson personnalisée",
  description:
    "Raconte-nous l'occasion et le prénom : on écrit les paroles de ta chanson gratuitement en quelques secondes. Tu paies seulement si elles te plaisent.",
  alternates: alternates("fr", "/creer"),
};

export default function Page({ searchParams }: PageProps<"/creer">) {
  return <CreatePage searchParams={searchParams} locale="fr" />;
}
