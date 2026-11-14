import type { Metadata } from "next";
import { OccasionScreen, occasionMetadata, occasionParams } from "../../../chanson/[slug]/OccasionScreen";

export function generateStaticParams() {
  return occasionParams();
}

export async function generateMetadata({ params }: PageProps<"/en/chanson/[slug]">): Promise<Metadata> {
  return occasionMetadata((await params).slug, "en");
}

export default function Page({ params }: PageProps<"/en/chanson/[slug]">) {
  return <OccasionScreen params={params} locale="en" />;
}
