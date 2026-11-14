import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { env } from "@/lib/env";
import { whatsappLink } from "@/lib/format";
import { alternates, localePath, type Locale } from "@/lib/i18n";
import { occasionLabel } from "@/lib/occasions";
import { getOrderByPublicCode } from "@/lib/orders";
import { getDeliveredSongs } from "@/lib/songs";
import { getSignedSongUrl } from "@/lib/storage";
import { styleLabel } from "@/lib/styles";
import { AutoRefresh, RegenerateButton, SongPlayer } from "./SongActions";
import { SurprisePanel } from "./SurprisePanel";
import { VideoPanel } from "./VideoPanel";
import { SongSkeleton } from "@/components/Skeletons";
import { MissionCta } from "@/components/MissionCta";

const APP_URL = env.NEXT_PUBLIC_APP_URL;
const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "";

// Page publique d'une chanson, partagée par /s/[code] et /en/s/[code].

const T = {
  fr: {
    notFound: "Chanson introuvable",
    ogTitle: (n: string) => `🎶 Une chanson pour ${n}`,
    ogDescription: (title: string | null, style: string) =>
      `${title ?? "Une chanson personnalisée"} · ${style}. Écoute-la et crée la tienne sur Dédikace.`,
    failedTitle: "On a eu un souci avec ta chanson",
    preparing: (n: string) => `La chanson de ${n} est en préparation`,
    failedText: "Notre équipe est prévenue et s'en occupe. Tu peux aussi nous écrire sur WhatsApp.",
    preparingText: "2 à 3 minutes. Cette page se met à jour toute seule.",
    for: "Pour ",
    from: (n: string) => `, de la part de ${n}`,
    regenerating: "Une nouvelle version est en préparation (2 à 3 minutes). En attendant, voici la précédente.",
    version: (v: number) => `Version ${v}`,
    download: "Télécharger le MP3",
    createMine: "Créer la mienne",
    report: (code: string) => `Bonjour, je signale un problème avec ma chanson ${code} :`,
    reportLink: "Signaler un problème",
    fileFallback: "chanson",
  },
  en: {
    notFound: "Song not found",
    ogTitle: (n: string) => `🎶 A song for ${n}`,
    ogDescription: (title: string | null, style: string) =>
      `${title ?? "A personalised song"} · ${style}. Listen to it and create yours on Dédikace.`,
    failedTitle: "We had a problem with your song",
    preparing: (n: string) => `${n}’s song is being made`,
    failedText: "Our team has been alerted and is on it. You can also message us on WhatsApp.",
    preparingText: "2 to 3 minutes. This page updates by itself.",
    for: "For ",
    from: (n: string) => `, from ${n}`,
    regenerating: "A new version is being made (2 to 3 minutes). Meanwhile, here is the previous one.",
    version: (v: number) => `Version ${v}`,
    download: "Download the MP3",
    createMine: "Create mine",
    report: (code: string) => `Hello, I want to report a problem with my song ${code}:`,
    reportLink: "Report a problem",
    fileFallback: "song",
  },
};

// Aperçu WhatsApp (Open Graph) : WhatsApp fait partie des robots pour lesquels
// Next.js place ces balises directement dans le <head>.
export async function songMetadata(code: string, locale: Locale): Promise<Metadata> {
  const t = T[locale];
  const order = await getOrderByPublicCode(code);
  if (!order) return { title: t.notFound, robots: { index: false } };
  const title = t.ogTitle(order.recipientName);
  const description = t.ogDescription(order.title, styleLabel(order.styleId, locale));
  return {
    title,
    description,
    robots: { index: false, follow: false },
    alternates: alternates(locale, `/s/${order.publicCode}`),
    openGraph: {
      title,
      description,
      images: [locale === "en" ? "/en/opengraph-image" : "/opengraph-image"],
      url: `${APP_URL}${localePath(locale, `/s/${order.publicCode}`)}`,
      siteName: "Dédikace",
      type: "music.song",
      locale: locale === "en" ? "en_GB" : "fr_FR",
    },
    twitter: { card: "summary_large_image", title, description, images: [locale === "en" ? "/en/opengraph-image" : "/opengraph-image"] },
  };
}

export function SongPage({ params, locale }: { params: Promise<{ code: string }>; locale: Locale }) {
  return (
    <Suspense fallback={<SongSkeleton />}>
      <SongContent params={params} locale={locale} />
    </Suspense>
  );
}

/** Nom de fichier sans accents ni espaces : « Dedikace-Mireille-v1.mp3 ». */
function fileName(name: string, version: number, fallback: string) {
  const safe = name.normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `Dedikace-${safe || fallback}-v${version}.mp3`;
}

async function SongContent({ params, locale }: { params: Promise<{ code: string }>; locale: Locale }) {
  const t = T[locale];
  const { code } = await params;
  const order = await getOrderByPublicCode(code);
  if (!order) notFound();

  const songs = await getDeliveredSongs(order.id);
  const style = styleLabel(order.styleId, locale);
  const pageUrl = `${APP_URL}${localePath(locale, `/s/${order.publicCode}`)}`;

  if (songs.length === 0) {
    const failed = order.status === "generation_failed";
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20 text-center" role="status">
        {!failed && <AutoRefresh />}
        <p className="text-5xl" aria-hidden="true">
          {failed ? "🛠️" : "🎶"}
        </p>
        <h1 className="text-2xl font-bold">
          {failed ? t.failedTitle : t.preparing(order.recipientName)}
        </h1>
        <p className="text-muted">
          {failed ? t.failedText : t.preparingText}
        </p>
      </div>
    );
  }

  // URL signées valables 1 h, régénérées à chaque visite (CLAUDE.md règle 9).
  const players = await Promise.all(
    songs.map(async (s) => ({
      version: s.version,
      listen: await getSignedSongUrl(s.storagePath!, 3600),
      download: await getSignedSongUrl(s.storagePath!, 3600, fileName(order.recipientName, s.version, t.fileFallback)),
    })),
  );

  const regenerating = order.status === "generating";

  return (
    <div className="flex flex-col gap-6 pt-4">
      {regenerating && <AutoRefresh />}
      <header className="flex flex-col gap-2">
        <p className="w-fit rounded-full bg-sand px-3 py-1 text-sm font-semibold text-brand-dark">
          {occasionLabel(order.occasion, locale)} · {style}
        </p>
        <h1 className="text-4xl leading-tight font-extrabold tracking-tight">{order.title}</h1>
        <p className="text-lg text-muted">
          {t.for}
          <strong className="text-ink">{order.recipientName}</strong>
          {order.senderName ? t.from(order.senderName) : ""}
        </p>
      </header>

      {regenerating && (
        <p role="status" className="rounded-2xl bg-sand/60 p-4 font-medium">
          {t.regenerating}
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {players.map((p) => (
          <li key={p.version} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-sand">
            <p className="mb-3 font-bold">{t.version(p.version)}</p>
            <SongPlayer src={p.listen} />
            <a
              href={p.download}
              className="mt-3 flex h-11 items-center justify-center gap-2 rounded-full bg-cream font-semibold text-ink ring-1 ring-sand transition active:scale-[0.98]"
            >
              <span aria-hidden="true">⬇️</span> {t.download}
            </a>
          </li>
        ))}
      </ul>

      <SurprisePanel recipientName={order.recipientName} senderName={order.senderName} pageUrl={pageUrl} />
      {order.status === "delivered" && <VideoPanel code={order.publicCode} recipientName={order.recipientName} />}
      <MissionCta locale={locale} title={locale === "en" ? "Your turn to give a song?" : "À ton tour d’offrir une chanson ?"} button={t.createMine} />

      {!order.freeRegenUsed && order.status === "delivered" && <RegenerateButton code={order.publicCode} />}

      {/^\+\d{8,15}$/.test(SUPPORT_PHONE) && (
        <a
          href={whatsappLink(SUPPORT_PHONE, t.report(order.publicCode))}
          target="_blank"
          rel="noopener noreferrer"
          className="text-center text-sm text-muted underline"
        >
          {t.reportLink}
        </a>
      )}
    </div>
  );
}
