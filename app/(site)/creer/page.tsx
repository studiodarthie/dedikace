import type { Metadata } from "next";
import { Suspense } from "react";
import { getProfile } from "@/lib/account";
import { getCurrentUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { OCCASION_IDS } from "@/lib/occasions";
import { STYLE_IDS } from "@/lib/styles";
import { CreateWizard } from "./CreateWizard";

export const metadata: Metadata = {
  title: "Créer ma chanson personnalisée",
  description:
    "Raconte-nous l'occasion et le prénom : on écrit les paroles de ta chanson gratuitement en quelques secondes. Tu paies seulement si elles te plaisent.",
  alternates: { canonical: "/creer" },
};

export default function CreatePage({ searchParams }: PageProps<"/creer">) {
  return (
    <Suspense fallback={<div className="mt-6 h-64 animate-pulse rounded-3xl bg-sand/60" aria-label="Chargement" />}>
      <Create searchParams={searchParams} />
    </Suspense>
  );
}

const pick = <T extends string>(list: readonly T[], value: unknown): T | undefined =>
  list.find((item) => item === value);

// Client connecté : son prénom et son numéro WhatsApp sont déjà remplis.
// ?occasion=… et ?style=… (pages de présentation) : l'occasion est déjà choisie.
async function Create({ searchParams }: { searchParams: PageProps<"/creer">["searchParams"] }) {
  const params = await searchParams;
  const occasion = pick(OCCASION_IDS, params.occasion);
  const styleId = pick(STYLE_IDS, params.style);
  const user = await getCurrentUser();
  const profile = user ? await getProfile(user.id) : undefined;
  return (
    <CreateWizard
      priceMomo={env.PRICE_MOMO_XAF}
      priceCard={env.PRICE_CARD_XAF}
      defaults={{
        senderName: profile?.name?.slice(0, 40) ?? undefined,
        whatsappPhone: profile?.phone ?? undefined,
        occasion,
        styleId,
      }}
    />
  );
}
