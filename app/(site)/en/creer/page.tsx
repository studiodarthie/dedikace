import type { Metadata } from "next";
import { alternates } from "@/lib/i18n";
import { CreatePage } from "../../creer/CreatePage";

export const metadata: Metadata = {
  title: "Create my personalised song",
  description:
    "Tell us the occasion and the name: we write your song’s lyrics for free in a few seconds. You only pay if you like them.",
  alternates: alternates("en", "/creer"),
  openGraph: { url: "/en/creer", locale: "en_GB", images: ["/en/opengraph-image"] },
};

export default function Page({ searchParams }: PageProps<"/en/creer">) {
  return <CreatePage searchParams={searchParams} locale="en" />;
}
