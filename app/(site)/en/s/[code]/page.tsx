import type { Metadata } from "next";
import { SongPage, songMetadata } from "../../../s/[code]/SongPage";

export async function generateMetadata({ params }: PageProps<"/en/s/[code]">): Promise<Metadata> {
  return songMetadata((await params).code, "en");
}

export default function Page({ params }: PageProps<"/en/s/[code]">) {
  return <SongPage params={params} locale="en" />;
}
