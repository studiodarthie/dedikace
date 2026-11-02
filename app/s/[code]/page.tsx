import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { whatsappLink } from "@/lib/format";
import { occasionLabel } from "@/lib/occasions";
import { getOrderByPublicCode } from "@/lib/orders";
import { getDeliveredSongs } from "@/lib/songs";
import { getSignedSongUrl } from "@/lib/storage";
import { getStyle } from "@/lib/styles";
import { AutoRefresh, RegenerateButton } from "./SongActions";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "";

// Aperçu WhatsApp (Open Graph) : WhatsApp fait partie des robots pour lesquels
// Next.js place ces balises directement dans le <head>.
export async function generateMetadata({ params }: PageProps<"/s/[code]">): Promise<Metadata> {
  const { code } = await params;
  const order = await getOrderByPublicCode(code);
  if (!order) return { title: "Chanson introuvable", robots: { index: false } };
  const title = `🎶 Une chanson pour ${order.recipientName}`;
  const description = `${order.title ?? "Une chanson personnalisée"} · ${getStyle(order.styleId)?.label ?? ""}. Écoute-la et crée la tienne sur Dédikace.`;
  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: { title, description, images: ["/opengraph-image"], url: `${APP_URL}/s/${order.publicCode}`, siteName: "Dédikace", type: "music.song", locale: "fr_FR" },
    twitter: { card: "summary_large_image", title, description, images: ["/opengraph-image"] },
  };
}

export default function SongPage({ params }: PageProps<"/s/[code]">) {
  return (
    <Suspense fallback={<div className="mt-6 h-96 animate-pulse rounded-3xl bg-sand/60" aria-label="Chargement" />}>
      <SongContent params={params} />
    </Suspense>
  );
}

/** Nom de fichier sans accents ni espaces : « Dedikace-Mireille-v1.mp3 ». */
function fileName(name: string, version: number) {
  const safe = name.normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `Dedikace-${safe || "chanson"}-v${version}.mp3`;
}

async function SongContent({ params }: { params: PageProps<"/s/[code]">["params"] }) {
  const { code } = await params;
  const order = await getOrderByPublicCode(code);
  if (!order) notFound();

  const songs = await getDeliveredSongs(order.id);
  const style = getStyle(order.styleId)?.label ?? order.styleId;
  const pageUrl = `${APP_URL}/s/${order.publicCode}`;

  if (songs.length === 0) {
    const failed = order.status === "generation_failed";
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20 text-center" role="status">
        {!failed && <AutoRefresh />}
        <p className="text-5xl" aria-hidden="true">
          {failed ? "🛠️" : "🎶"}
        </p>
        <h1 className="text-2xl font-bold">
          {failed ? "On a eu un souci avec ta chanson" : `La chanson de ${order.recipientName} est en préparation`}
        </h1>
        <p className="text-muted">
          {failed
            ? "Notre équipe est prévenue et s'en occupe. Tu peux aussi nous écrire sur WhatsApp."
            : "Environ 2 minutes. Cette page se met à jour toute seule."}
        </p>
      </div>
    );
  }

  // URL signées valables 1 h, régénérées à chaque visite (CLAUDE.md règle 9).
  const players = await Promise.all(
    songs.map(async (s) => ({
      version: s.version,
      listen: await getSignedSongUrl(s.storagePath!, 3600),
      download: await getSignedSongUrl(s.storagePath!, 3600, fileName(order.recipientName, s.version)),
    })),
  );

  const shareText = `🎶 Une chanson rien que pour toi, ${order.recipientName} ! Écoute-la ici : ${pageUrl}`;
  const regenerating = order.status === "generating";

  return (
    <div className="flex flex-col gap-6 pt-4">
      {regenerating && <AutoRefresh />}
      <header className="flex flex-col gap-2">
        <p className="w-fit rounded-full bg-sand px-3 py-1 text-sm font-semibold text-brand-dark">
          {occasionLabel(order.occasion)} · {style}
        </p>
        <h1 className="text-4xl leading-tight font-extrabold tracking-tight">{order.title}</h1>
        <p className="text-lg text-muted">
          Pour <strong className="text-ink">{order.recipientName}</strong>
          {order.senderName ? `, de la part de ${order.senderName}` : ""}
        </p>
      </header>

      {regenerating && (
        <p role="status" className="rounded-2xl bg-sand/60 p-4 font-medium">
          Une nouvelle version est en préparation (environ 2 minutes). En attendant, voici la précédente.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {players.map((p) => (
          <li key={p.version} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-sand">
            <p className="mb-3 font-bold">Version {p.version}</p>
            <audio controls preload="metadata" src={p.listen} className="w-full">
              Ton navigateur ne peut pas lire ce fichier.
            </audio>
            <a href={p.download} className="mt-3 inline-block font-semibold text-brand">
              ⬇ Télécharger le MP3
            </a>
          </li>
        ))}
      </ul>

      <a
        href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-14 items-center justify-center rounded-2xl bg-[#25d366] px-6 text-lg font-bold text-white shadow-md transition active:scale-[0.98]"
      >
        Partager sur WhatsApp
      </a>
      <Link
        href="/creer"
        className="flex h-14 items-center justify-center rounded-2xl bg-brand px-6 text-lg font-bold text-white shadow-md shadow-brand/30 transition active:scale-[0.98]"
      >
        Créer la mienne
      </Link>

      {!order.freeRegenUsed && order.status === "delivered" && <RegenerateButton code={order.publicCode} />}

      {/^\+\d{8,15}$/.test(SUPPORT_PHONE) && (
        <a
          href={whatsappLink(SUPPORT_PHONE, `Bonjour, je signale un problème avec ma chanson ${order.publicCode} :`)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-center text-sm text-muted underline"
        >
          Signaler un problème
        </a>
      )}
    </div>
  );
}
