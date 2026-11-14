import type { Metadata } from "next";
import { SongPage, songMetadata } from "./SongPage";

export async function generateMetadata({ params }: PageProps<"/s/[code]">): Promise<Metadata> {
  return songMetadata((await params).code, "fr");
}

export default function Page({ params }: PageProps<"/s/[code]">) {
  return <SongPage params={params} locale="fr" />;
}
