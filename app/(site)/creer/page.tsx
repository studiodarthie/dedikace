import type { Metadata } from "next";
import { Suspense } from "react";
import { getProfile } from "@/lib/account";
import { getCurrentUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { CreateWizard } from "./CreateWizard";

export const metadata: Metadata = {
  title: "Créer ma chanson",
  description: "Raconte-nous l'occasion : on écrit les paroles gratuitement en quelques secondes.",
};

export default function CreatePage() {
  return (
    <Suspense fallback={<div className="mt-6 h-64 animate-pulse rounded-3xl bg-sand/60" aria-label="Chargement" />}>
      <Create />
    </Suspense>
  );
}

// Client connecté : son prénom et son numéro WhatsApp sont déjà remplis.
async function Create() {
  const user = await getCurrentUser();
  const profile = user ? await getProfile(user.id) : undefined;
  return (
    <CreateWizard
      priceMomo={env.PRICE_MOMO_XAF}
      priceCard={env.PRICE_CARD_XAF}
      defaults={{ senderName: profile?.name?.slice(0, 40) ?? undefined, whatsappPhone: profile?.phone ?? undefined }}
    />
  );
}
