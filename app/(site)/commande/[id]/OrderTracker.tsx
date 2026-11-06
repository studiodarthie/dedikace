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
  publicCode?: string;
};

const POLL_MS = 5_000;
const SLOW_PAYMENT_MS = 3 * 60_000;
const PAID_STATUSES: OrderStatus[] = ["paid", "generating", "delivered", "generation_failed"];

/** Prompt 11 : suit la commande toutes les 5 s et ouvre la chanson dès qu'elle est prête. */
export function OrderTracker({
  orderId,
  initial,
  priceXaf,
  supportPhone,
  pay,
  signedIn,
}: {
  orderId: string;
  initial: Snapshot;
  priceXaf: number;
  supportPhone: string;
  /** Paroles prêtes mais pas payées : de quoi finaliser ici (lien « Finaliser » de Mon espace). */
  pay?: { title: string; lyrics: string; whatsappPhone: string; priceMomo: number; priceCard: number };
  signedIn: boolean;
}) {
  const router = useRouter();
  const [snap, setSnap] = useState(initial);
  const [offline, setOffline] = useState(false);
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(startedAt);

  const toPay = snap.status === "lyrics_ready" || snap.status === "payment_failed";
  const done = toPay || snap.status === "generation_failed" || snap.status === "refunded";

  // Pour la rattacher au compte à la prochaine connexion (Mon espace).
  useEffect(() => rememberOrder(orderId), [orderId]);

  useEffect(() => {
    if (done || snap.publicCode) return;
    const id = setInterval(async () => {
      setNow(Date.now());
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
  }, [orderId, done, snap.publicCode]);

  // Paiement reçu (vérifié chez Tranzak côté serveur) : le brouillon ne sert plus, et on prévient les pixels.
  useEffect(() => {
    if (!PAID_STATUSES.includes(snap.status)) return;
    clearDraft();
    trackPurchaseOnce(orderId, priceXaf);
  }, [snap.status, orderId, priceXaf]);

  useEffect(() => {
    if (snap.publicCode) router.replace(`/s/${snap.publicCode}`);
  }, [snap.publicCode, router]);

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
          {now - startedAt > SLOW_PAYMENT_MS && (
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
      content = (
        <Panel icon="✅" title="Paiement reçu, merci !">
          <p>On lance la création de la chanson de {name}.</p>
        </Panel>
      );
      break;
    case "generating":
    case "delivered":
      content = (
        <Panel icon="🎶" title={`On crée la chanson de ${name}`}>
          <p>2 versions, environ 2 minutes. Garde cette page ouverte : elle s’ouvrira toute seule.</p>
          <Dots />
        </Panel>
      );
      break;
    case "generation_failed":
      content = (
        <Panel icon="🛠️" title="On a eu un souci avec ta chanson">
          <p>Ton paiement est bien reçu. Notre équipe est prévenue et s’en occupe très vite.</p>
        </Panel>
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

function Dots() {
  return (
    <div className="flex justify-center gap-2" aria-hidden="true">
      {[0, 1, 2].map((d) => (
        <span key={d} className="h-3 w-3 animate-bounce rounded-full bg-brand" style={{ animationDelay: `${d * 150}ms` }} />
      ))}
    </div>
  );
}
