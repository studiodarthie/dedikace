import type { Metadata } from "next";
import { env } from "@/lib/env";
import { CreateWizard } from "./CreateWizard";

export const metadata: Metadata = {
  title: "Créer ma chanson",
  description: "Raconte-nous l'occasion : on écrit les paroles gratuitement en quelques secondes.",
};

export default function CreatePage() {
  return <CreateWizard priceMomo={env.PRICE_MOMO_XAF} priceCard={env.PRICE_CARD_XAF} />;
}
