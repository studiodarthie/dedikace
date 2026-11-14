"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Checkout, clearDraft } from "@/app/(site)/creer/CreateWizard";
import type { OrderStatus } from "@/lib/db/schema";
import { whatsappLink } from "@/lib/format";
import { rememberOrder } from "@/lib/my-orders";
import { trackPurchaseOnce } from "@/lib/pixels";

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
    if (snap.status === "delivered" && snap.publicCode) router.replace(`/s/${snap.publicCode}`);
  }, [snap.status, snap.publicCode, router]);

  const name = snap.recipientName;
  const support = /^\+\d{8,15}$/.test(supportPhone) ? supportPhone : null;
  const helpLink = support && (
    <a
      href={whatsappLink(support, `Bonjour, j'ai besoin d'aide pour ma commande ${orderId.slice(0, 8)}.`)}
      target="_blank"
      rel="noopener noreferrer"
      className="text-center text-sm text-muted underline"
    >
      Besoin d’aide ? Écris-nous sur WhatsApp
    </a>
  );

  let content;
  switch (snap.status) {
    case "pending_payment": {
      const momo = snap.channel === "mtn" || snap.channel === "orange";
      content = (
        <Panel icon="📱" title={momo ? "Valide le paiement sur ton téléphone" : "On attend la confirmation du paiement"}>
          {momo ? (
            <>
              <p>Une demande de paiement est arrivée sur ton téléphone. Tape ton code secret pour la valider.</p>
              <p className="rounded-2xl bg-sand/60 p-4 text-sm">
                Rien reçu ? Compose <strong>{snap.channel === "mtn" ? "*126#" : "#150*50#"}</strong> pour voir les paiements en
                attente.
              </p>
            </>
          ) : (
            <p>Termine le paiement sur la page de ta banque. Cette page se met à jour toute seule.</p>
          )}
          {startedAt > 0 && now - startedAt > SLOW_PAYMENT_MS && (
            <Link href="/creer" className="font-semibold text-brand underline">
              Ça ne marche pas ? Réessayer le paiement
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
            <Panel icon={snap.status === "payment_failed" ? "😕" : "✍️"} title={snap.status === "payment_failed" ? "Le paiement n'a pas abouti" : `Les paroles pour ${name} sont prêtes`}>
              {snap.status === "payment_failed" && <p>Aucun montant n’a été débité. Vérifie ton solde ou ton numéro, puis réessaie.</p>}
            </Panel>
            <details className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-sand">
              <summary className="cursor-pointer font-bold">{pay.title || "Voir les paroles"}</summary>
              <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-muted">{pay.lyrics}</p>
            </details>
            <Checkout orderId={orderId} whatsappPhone={pay.whatsappPhone} priceMomo={pay.priceMomo} priceCard={pay.priceCard} />
          </div>
        );
        break;
      }
      content = (
        <Panel icon="😕" title="Le paiement n'a pas abouti">
          <p>Aucun montant n’a été débité. Vérifie ton solde ou ton numéro, puis réessaie.</p>
          <Link
            href="/creer"
            className="flex h-14 items-center justify-center rounded-2xl bg-brand px-6 text-lg font-bold text-white shadow-md shadow-brand/30"
          >
            Réessayer le paiement
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
          <Panel icon={snap.status === "delivered" ? "🎉" : "🎶"} title={snap.status === "delivered" ? `La chanson de ${name} est prête !` : `On crée la chanson de ${name}`}>
            <p>{snap.status === "delivered" ? "On l’ouvre…" : "Paiement reçu, merci ! 2 versions de ta chanson sont en préparation."}</p>
          </Panel>
          <CreationSteps status={snap.status} progress={Math.min(95, 8 + (elapsed / USUAL_CREATION_MS) * 87)} />
          {late ? (
            <p role="alert" className="rounded-2xl bg-gold/25 p-4 text-sm font-medium text-ink">
              ⏳ Petit retard de notre côté. Notre équipe est prévenue et s’en occupe : ta chanson arrive, et si on n’y arrive
              pas, on te rembourse. Tu peux nous écrire sur WhatsApp à tout moment.
            </p>
          ) : (
            <p className="text-center text-sm text-muted">
              Ça prend en général 2 à 4 minutes. Tu peux fermer cette page : ta chanson t’attendra sur son lien et dans Mon espace.
            </p>
          )}
          {snap.publicCode && <SongLink url={`${appUrl.replace(/\/$/, "")}/s/${snap.publicCode}`} name={name} />}
        </div>
      );
      break;
    }
    case "generation_failed":
      content = (
        <div className="flex flex-col gap-5">
          <Panel icon="🛠️" title="On a eu un souci avec ta chanson">
            <p>Ton paiement est bien reçu. Notre équipe est prévenue et s’en occupe : ta chanson arrive, sinon on te rembourse.</p>
          </Panel>
          {support && (
            <a
              href={whatsappLink(support, `Bonjour, ma chanson pour ${name} a un souci (commande ${orderId.slice(0, 8)}).`)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-14 items-center justify-center rounded-2xl bg-[#25d366] px-6 text-lg font-bold text-white shadow-md"
            >
              Écrire à l’équipe sur WhatsApp
            </a>
          )}
        </div>
      );
      break;
    case "refunded":
      content = (
        <Panel icon="↩️" title="Commande remboursée">
          <p>Cette commande a été remboursée.</p>
        </Panel>
      );
      break;
    default:
      content = (
        <Panel icon="✍️" title="Le paiement n'a pas encore commencé">
          <Link href="/creer" className="font-semibold text-brand underline">
            Retourner à mes paroles
          </Link>
        </Panel>
      );
  }

  return (
    <div className="flex flex-col gap-6 py-10" role="status" aria-live="polite">
      {content}
      {offline && <p className="text-center text-sm text-muted">Connexion instable… on réessaie.</p>}
      {!signedIn && (
        <Link
          href={`/connexion?suite=${encodeURIComponent("/compte")}`}
          className="flex items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-sand"
        >
          <span className="text-2xl" aria-hidden="true">
            💾
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold">Garde tes chansons dans ton espace</span>
            <span className="block text-sm text-muted">Connexion en 1 clic avec Google ou ton e-mail.</span>
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
function CreationSteps({ status, progress }: { status: OrderStatus; progress: number }) {
  const ready = status === "delivered";
  const steps = [
    { label: "Paiement reçu", state: "done" },
    { label: "Création des 2 versions", state: ready ? "done" : "active" },
    { label: "Ta chanson est prête", state: ready ? "done" : "todo" },
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
            <span className="sr-only">{s.state === "done" ? "(fait)" : s.state === "active" ? "(en cours)" : "(à venir)"}</span>
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
function SongLink({ url, name }: { url: string; name: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-col gap-2 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-sand">
      <p className="font-semibold">🔗 Le lien de ta chanson</p>
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
          {copied ? "Copié ✓" : "Copier le lien"}
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`Ma chanson Dédikace pour ${name} 🎶 ${url}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-11 items-center justify-center rounded-full bg-[#25d366] text-sm font-bold text-white"
        >
          Me l’envoyer
        </a>
      </div>
    </div>
  );
}
