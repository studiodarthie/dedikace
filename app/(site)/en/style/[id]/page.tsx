import type { Metadata } from "next";
import { StyleScreen, styleMetadata, styleParams } from "../../../style/[id]/StyleScreen";

export function generateStaticParams() {
  return styleParams();
}

export async function generateMetadata({ params }: PageProps<"/en/style/[id]">): Promise<Metadata> {
  return styleMetadata((await params).id, "en");
}

export default function Page({ params }: PageProps<"/en/style/[id]">) {
  return <StyleScreen params={params} locale="en" />;
}
