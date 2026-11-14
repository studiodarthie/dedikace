import type { Metadata } from "next";
import { HomePage } from "@/components/home/HomePage";
import { alternates } from "@/lib/i18n";

export const metadata: Metadata = {
  title: { absolute: "Dédikace — Personalised song with your name" },
  description:
    "Give a personalised song with the name in the chorus: birthday, wedding, traditional wedding, tribute, graduation. Makossa, bikutsi, afrobeats, rumba. Free lyrics, ready in 2 minutes, Mobile Money payment.",
  alternates: alternates("en", "/"),
  openGraph: { url: "/en", siteName: "Dédikace", locale: "en_GB", type: "website" },
};

export default function HomeEn() {
  return <HomePage locale="en" />;
}
