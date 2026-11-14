"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Checkout, clearDraft } from "@/app/(site)/creer/CreateWizard";
import type { OrderStatus } from "@/lib/db/schema";
import { whatsappLink } from "@/lib/format";
import { rememberOrder } from "@/lib/my-orders";
import { trackPurchaseOnce } from "@/lib/pixels";
import { localePath } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

const T = {
  fr: {
    help: (ref: string) => `Bonjour, j'ai besoin d'aide pour ma commande ${ref}.`,
    helpLink: "Besoin d’aide ? Écris-nous sur WhatsApp",
    confirmOnPhone: "Valide le paiement sur ton téléphone",
    waitingConfirm: "On attend la confirmation du paiement",
    requestArrived: "Une demande de paiement est arrivée sur ton téléphone. Tape ton code secret pour la valider.",
    nothing: ["Rien reçu ? Compose ", " pour voir les paiements en attente."],
    bank: "Termine le paiement sur la page de ta banque. Cette page se met à jour toute seule.",
    retryPay: "Ça ne marche pas ? Réessayer le paiement",
    payFailed: "Le paiement n'a pas abouti",
    lyricsReady: (n: string) => `Les paroles pour ${n} sont prêtes`,
    notCharged: "Aucun montant n’a été débité. Vérifie ton solde ou ton numéro, puis réessaie.",
    seeLyrics: "Voir les paroles",
    retry: "Réessayer le paiement",
    songReady: (n: string) => `La chanson de ${n} est prête !`,
    creating: (n: string) => `On crée la chanson de ${n}`,
    opening: "On l’ouvre…",
    received: "Paiement reçu, merci ! 2 versions de ta chanson sont en préparation.",
    late: "⏳ Petit retard de notre côté. Notre équipe est prévenue et s’en occupe : ta chanson arrive, et si on n’y arrive pas, on te rembourse. Tu peux nous écrire sur WhatsApp à tout moment.",
    usual: "Ça prend en général 2 à 4 minutes. Tu peux fermer cette page : ta chanson t’attendra sur son lien et dans Mon espace.",
    problem: "On a eu un souci avec ta chanson",
    problemText: "Ton paiement est bien reçu. Notre équipe est prévenue et s’en occupe : ta chanson arrive, sinon on te rembourse.",
    problemMessage: (n: string, ref: string) => `Bonjour, ma chanson pour ${n} a un souci (commande ${ref}).`,
    writeTeam: "Écrire à l’équipe sur WhatsApp",
    refunded: "Commande remboursée",
    refundedText: "Cette commande a été remboursée.",
    notStarted: "Le paiement n'a pas encore commencé",
    backToLyrics: "Retourner à mes paroles",
    offline: "Connexion instable… on réessaie.",
    keep: "Garde tes chansons dans ton espace",
    keepHint: "Connexion en 1 clic avec Google ou ton e-mail.",
    steps: ["Paiement reçu", "Création des 2 versions", "Ta chanson est prête"],
    state: { done: "(fait)", active: "(en cours)", todo: "(à venir)" },
    linkTitle: "🔗 Le lien de ta chanson",
    copied: "Copié ✓",
    copy: "Copier le lien",
    share: (n: string, url: string) => `Ma chanson Dédikace pour ${n} 🎶 ${url}`,
    sendMe: "Me l’envoyer",
  },
  en: {
    help: (ref: string) => `Hello, I need help with my order ${ref}.`,
    helpLink: "Need help? Message us on WhatsApp",
    confirmOnPhone: "Confirm the payment on your phone",
    waitingConfirm: "Waiting for payment confirmation",
    requestArrived: "A payment request has arrived on your phone. Enter your PIN to confirm it.",
    nothing: ["Nothing received? Dial ", " to see pending payments."],
    bank: "Finish the payment on your bank’s page. This page updates by itself.",
    retryPay: "Not working? Try the payment again",
    payFailed: "The payment didn’t go through",
    lyricsReady: (n: string) => `The lyrics for ${n} are ready`,
    notCharged: "Nothing was charged. Check your balance or your number, then try again.",
    seeLyrics: "See the lyrics",
    retry: "Try the payment again",
    songReady: (n: string) => `${n}’s song is ready!`,
    creating: (n: string) => `We’re creating ${n}’s song`,
    opening: "Opening it…",
    received: "Payment received, thank you! 2 versions of your song are being made.",
    late: "⏳ A small delay on our side. Our team has been alerted and is on it: your song is coming, and if we can’t make it, we refund you. You can message us on WhatsApp at any time.",
    usual: "It usually takes 2 to 4 minutes. You can close this page: your song will wait for you on its link and in My space.",
    problem: "We had a problem with your song",
    problemText: "Your payment was received. Our team has been alerted and is on it: your song is coming, otherwise we refund you.",
    problemMessage: (n: string, ref: string) => `Hello, my song for ${n} has a problem (order ${ref}).`,
    writeTeam: "Message the team on WhatsApp",
    refunded: "Order refunded",
    refundedText: "This order has been refunded.",
    notStarted: "The payment hasn’t started yet",
    backToLyrics: "Back to my lyrics",
    offline: "Unstable connection… retrying.",
    keep: "Keep your songs in your space",
    keepHint: "1-click sign-in with Google or your email.",
    steps: ["Payment received", "Creating the 2 versions", "Your song is ready"],
    state: { done: "(done)", active: "(in progress)", todo: "(next)" },
    linkTitle: "🔗 Your song’s link",
    copied: "Copied ✓",
    copy: "Copy the link",
    share: (n: string, url: string) => `My Dédikace song for ${n} 🎶 ${url}`,
    sendMe: "Send it to me",
  },
};
type Text = (typeof T)["fr"];

type Snapshot = {
  status: OrderStatus;
  recipientName: string;
  channel?: "mtn" | "orange" | "card" | "manual";
  /** Code de la page de la chanson : connu dès le paiement (la page attend puis affiche la chanson). */
  publicCode?: string;
  /** Heure de confirmation du paiement (ISO), pour la barre d'avancement. */
  paidAt?: string;
};

const POLL_MS = 5_000;
const SLOW_PAYMENT_MS = 3 * 60_000;
/** Durée habituelle d'une création (2 versions) et seuil au-delà duquel on annonce un retard. */
const USUAL_CREATION_MS = 3 * 60_000;
const LATE_CREATION_MS = 10 * 60_000;
const PAID_STATUSES: OrderStatus[] = ["paid", "generating", "delivered", "generation_failed"];

/** Prompt 11 : suit la commande toutes les 5 s et ouvre la chanson dès qu'elle est prête. */
export function OrderTracker({
  orderId,
  initial,
  priceXaf,
  supportPhone,
  pay,
  signedIn,
  appUrl,
}: {
  orderId: string;
  initial: Snapshot;
  priceXaf: number;
  supportPhone: string;
  /** Paroles prêtes mais pas payées : de quoi finaliser ici (lien « Finaliser » de Mon espace). */
  pay?: { title: string; lyrics: string; whatsappPhone: string; priceMomo: number; priceCard: number };
  signedIn: boolean;
  /** Adresse du site (dedikace.app), pour le lien de la chanson. */
  appUrl: string;
}) {
  const router = useRouter();
  const locale = useLocale();
  const t = T[locale];
  const to = (p: string) => localePath(locale, p);
  const [snap, setSnap] = useState(initial);
  const [offline, setOffline] = useState(false);
  // Horloge lancée seulement dans le navigateur (le serveur n'a pas la même heure : pas d'écart à l'affichage).
  const [startedAt, setStartedAt] = useState(0);
  const [now, setNow] = useState(0);
  useEffect(() => {
    const tick = () => {
      const t = Date.now();
      setStartedAt((s) => s || t);
      setNow(t);
    };
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const toPay = snap.status === "lyrics_ready" || snap.status === "payment_failed";
  const done = toPay || snap.status === "generation_failed" || snap.status === "refunded";

  // Pour la rattacher au compte à la prochaine connexion (Mon espace).
  useEffect(() => rememberOrder(orderId), [orderId]);

  useEffect(() => {
    if (done || snap.status === "delivered") return;
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/commande/${orderId}`, { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        setSnap((await res.json()) as Snapshot);
        setOffline(false);
      } catch {
        setOffline(true);
      }
    }, POLL_MS);
    return () => clearInterval(id);
  }, [orderId, done, snap.status]);

  // Paiement reçu (vérifié chez Tranzak côté serveur) : le brouillon ne sert plus, et on prévient les pixels.
  useEffect(() => {
    if (!PAID_STATUSES.includes(snap.status)) return;
    clearDraft();
    trackPurchaseOnce(orderId, priceXaf);
  }, [snap.status, orderId, priceXaf]);

  // Chanson prête : on ouvre sa page toute seule.
  useEffect(() => {
    if (snap.status === "delivered" && snap.publicCode) router.replace(to(`/s/${snap.publicCode}`));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `to` ne dépend que de la langue
  }, [snap.status, snap.publicCode, router, locale]);

  const name = snap.recipientName;
  const support = /^\+\d{8,15}$/.test(supportPhone) ? supportPhone : null;
  const helpLink = support && (
    <a
      href={whatsappLink(support, t.help(orderId.slice(0, 8)))}
      target="_blank"
      rel="noopener noreferrer"
      className="text-center text-sm text-muted underline"
    >
      {t.helpLink}
    </a>
  );

  let content;
  switch (snap.status) {
    case "pending_payment": {
      const momo = snap.channel === "mtn" || snap.channel === "orange";
      content = (
        <Panel icon="📱" title={momo ? t.confirmOnPhone : t.waitingConfirm}>
          {momo ? (
            <>
              <p>{t.requestArrived}</p>
              <p className="rounded-2xl bg-sand/60 p-4 text-sm">
                {t.nothing[0]}
                <strong>{snap.channel === "mtn" ? "*126#" : "#150*50#"}</strong>
                {t.nothing[1]}
              </p>
            </>
          ) : (
            <p>{t.bank}</p>
          )}
          {startedAt > 0 && now - startedAt > SLOW_PAYMENT_MS && (
            <Link href={to("/creer")} className="font-semibold text-brand underline">
              {t.retryPay}
            </Link>
          )}
        </Panel>
      );
      break;
    }
    case "lyrics_ready":
    case "payment_failed":
      if (pay) {
        content = (
          <div className="flex flex-col gap-5 text-left">
            <Panel icon={snap.status === "payment_failed" ? "😕" : "✍️"} title={snap.status === "payment_failed" ? t.payFailed : t.lyricsReady(name)}>
              {snap.status === "payment_failed" && <p>{t.notCharged}</p>}
            </Panel>
            <details className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-sand">
              <summary className="cursor-pointer font-bold">{pay.title || t.seeLyrics}</summary>
              <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-muted">{pay.lyrics}</p>
            </details>
            <Checkout orderId={orderId} whatsappPhone={pay.whatsappPhone} priceMomo={pay.priceMomo} priceCard={pay.priceCard} />
          </div>
        );
        break;
      }
      content = (
        <Panel icon="😕" title={t.payFailed}>
          <p>{t.notCharged}</p>
          <Link
            href={to("/creer")}
            className="flex h-14 items-center justify-center rounded-2xl bg-brand px-6 text-lg font-bold text-white shadow-md shadow-brand/30"
          >
            {t.retry}
          </Link>
        </Panel>
      );
      break;
    case "paid":
    case "generating":
    case "delivered": {
      const since = snap.paidAt ? Date.parse(snap.paidAt) : startedAt;
      const elapsed = now && since ? Math.max(0, now - since) : 0;
      const late = elapsed > LATE_CREATION_MS && snap.status !== "delivered";
      content = (
        <div className="flex flex-col gap-5 text-left">
          <Panel icon={snap.status === "delivered" ? "🎉" : "🎶"} title={snap.status === "delivered" ? t.songReady(name) : t.creating(name)}>
            <p>{snap.status === "delivered" ? t.opening : t.received}</p>
          </Panel>
          <CreationSteps t={t} status={snap.status} progress={Math.min(95, 8 + (elapsed / USUAL_CREATION_MS) * 87)} />
          {late ? (
            <p role="alert" className="rounded-2xl bg-gold/25 p-4 text-sm font-medium text-ink">
              {t.late}
            </p>
          ) : (
            <p className="text-center text-sm text-muted">
              {t.usual}
            </p>
          )}
          {snap.publicCode && <SongLink t={t} url={`${appUrl.replace(/\/$/, "")}${to(`/s/${snap.publicCode}`)}`} name={name} />}
        </div>
      );
      break;
    }
    case "generation_failed":
      content = (
        <div className="flex flex-col gap-5">
          <Panel icon="🛠️" title={t.problem}>
            <p>{t.problemText}</p>
          </Panel>
          {support && (
            <a
              href={whatsappLink(support, t.problemMessage(name, orderId.slice(0, 8)))}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-14 items-center justify-center rounded-2xl bg-[#25d366] px-6 text-lg font-bold text-white shadow-md"
            >
              {t.writeTeam}
            </a>
          )}
        </div>
      );
      break;
    case "refunded":
      content = (
        <Panel icon="↩️" title={t.refunded}>
          <p>{t.refundedText}</p>
        </Panel>
      );
      break;
    default:
      content = (
        <Panel icon="✍️" title={t.notStarted}>
          <Link href={to("/creer")} className="font-semibold text-brand underline">
            {t.backToLyrics}
          </Link>
        </Panel>
      );
  }

  return (
    <div className="flex flex-col gap-6 py-10" role="status" aria-live="polite">
      {content}
      {offline && <p className="text-center text-sm text-muted">{t.offline}</p>}
      {!signedIn && (
        <Link
          href={`${to("/connexion")}?suite=${encodeURIComponent(to("/compte"))}`}
          className="flex items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-sand"
        >
          <span className="text-2xl" aria-hidden="true">
            💾
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold">{t.keep}</span>
            <span className="block text-sm text-muted">{t.keepHint}</span>
          </span>
          <span className="text-brand" aria-hidden="true">
            ›
          </span>
        </Link>
      )}
      {helpLink}
    </div>
  );
}

function Panel({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col items-center gap-4 text-center">
      <p className="text-5xl" aria-hidden="true">
        {icon}
      </p>
      <h1 className="text-2xl font-bold">{title}</h1>
      <div className="flex flex-col gap-4 text-muted">{children}</div>
    </section>
  );
}

/** Les 3 étapes après le paiement, avec une barre qui avance pendant la création (estimation honnête). */
function CreationSteps({ t, status, progress }: { t: Text; status: OrderStatus; progress: number }) {
  const ready = status === "delivered";
  const steps = [
    { label: t.steps[0], state: "done" },
    { label: t.steps[1], state: ready ? "done" : "active" },
    { label: t.steps[2], state: ready ? "done" : "todo" },
  ] as const;
  return (
    <ol className="flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-sand">
      {steps.map((s) => (
        <li key={s.label} className="flex flex-col gap-2">
          <span className="flex items-center gap-3 font-semibold">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm ${
                s.state === "done" ? "bg-leaf text-white" : s.state === "active" ? "bg-brand text-white" : "bg-sand text-muted"
              }`}
              aria-hidden="true"
            >
              {s.state === "done" ? "✓" : s.state === "active" ? "♪" : "·"}
            </span>
            <span className={s.state === "todo" ? "text-muted" : ""}>{s.label}</span>
            <span className="sr-only">{t.state[s.state]}</span>
          </span>
          {s.state === "active" && (
            <span className="ml-10 h-2 overflow-hidden rounded-full bg-sand" aria-hidden="true">
              <span className="block h-full rounded-full bg-brand transition-[width] duration-1000" style={{ width: `${progress}%` }} />
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

/** Lien de la chanson, à garder : il marche déjà (la page attend puis affiche la chanson). */
function SongLink({ t, url, name }: { t: Text; url: string; name: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-col gap-2 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-sand">
      <p className="font-semibold">{t.linkTitle}</p>
      <p className="truncate rounded-xl bg-cream px-3 py-2 text-sm text-muted">{url.replace(/^https?:\/\//, "")}</p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 2500);
            } catch {
              setCopied(false);
            }
          }}
          className="h-11 rounded-full bg-cream text-sm font-bold ring-1 ring-sand"
        >
          {copied ? t.copied : t.copy}
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(t.share(name, url))}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-11 items-center justify-center rounded-full bg-[#25d366] text-sm font-bold text-white"
        >
          {t.sendMe}
        </a>
      </div>
    </div>
  );
}
