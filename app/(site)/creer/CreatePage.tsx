import { connection } from "next/server";
import { Suspense } from "react";
import { CreateSkeleton } from "@/components/Skeletons";
import { getProfile } from "@/lib/account";
import { getCurrentUser } from "@/lib/auth";
import type { Locale } from "@/lib/i18n";
import { OCCASION_IDS } from "@/lib/occasions";
import { pricesAt } from "@/lib/pricing";
import { STYLE_IDS } from "@/lib/styles";
import { CreateWizard } from "./CreateWizard";

// Parcours de création, partagé par /creer et /en/creer.

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export function CreatePage({ searchParams, locale }: { searchParams: SearchParams; locale: Locale }) {
  return (
    <Suspense fallback={<CreateSkeleton />}>
      <Create searchParams={searchParams} locale={locale} />
    </Suspense>
  );
}

const pick = <T extends string>(list: readonly T[], value: unknown): T | undefined =>
  list.find((item) => item === value);

// Client connecté : son prénom et son numéro WhatsApp sont déjà remplis.
// ?occasion=… et ?style=… (pages de présentation) : l'occasion est déjà choisie.
async function Create({ searchParams, locale }: { searchParams: SearchParams; locale: Locale }) {
  await connection(); // prix du jour et profil : calculés à chaque visite
  const params = await searchParams;
  const occasion = pick(OCCASION_IDS, params.occasion);
  const styleId = pick(STYLE_IDS, params.style);
  const prices = pricesAt(new Date());
  const user = await getCurrentUser();
  const profile = user ? await getProfile(user.id) : undefined;
  return (
    <CreateWizard
      priceMomo={prices.momo}
      priceCard={prices.card}
      launchEnds={locale === "en" ? prices.launchEndsEn : prices.launchEnds}
      defaults={{
        senderName: profile?.name?.slice(0, 40) ?? undefined,
        whatsappPhone: profile?.phone ?? undefined,
        occasion,
        styleId,
      }}
    />
  );
}
