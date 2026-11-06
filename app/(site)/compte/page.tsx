import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { listMyOrders, getProfile, type MyOrder } from "@/lib/account";
import { isAdminEmail, requireUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { whatsappLink } from "@/lib/format";
import { OCCASIONS } from "@/lib/occasions";
import { ClaimOrders } from "./ClaimOrders";

export const metadata: Metadata = { title: "Mon espace", robots: { index: false, follow: false } };

const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "";

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="mt-6 h-96 animate-pulse rounded-3xl bg-sand/60" aria-label="Chargement" />}>
      <AccountContent />
    </Suspense>
  );
}

async function AccountContent() {
  const user = await requireUser("/compte");
  const [profile, myOrders] = await Promise.all([getProfile(user.id), listMyOrders(user.id)]);
  const firstName = (profile?.name ?? user.name ?? "").trim().split(/\s+/)[0];
  const inviteText = `🎶 J'ai offert une chanson personnalisée avec Dédikace. Fais-en une pour quelqu'un que tu aimes : ${env.NEXT_PUBLIC_APP_URL}`;

  return (
    <div className="flex flex-col gap-6 pt-4">
      <ClaimOrders />
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Salut{firstName ? `, ${firstName}` : ""} 👋</h1>
          <p className="text-muted">Ton espace Dédikace</p>
        </div>
        <Link
          href="/compte/parametres"
          aria-label="Paramètres"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-xl shadow-sm ring-1 ring-sand"
        >
          ⚙️
        </Link>
      </header>

      <Link
        href="/creer"
        className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-sm ring-2 ring-brand/70 transition active:scale-[0.98]"
      >
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gold to-brand text-3xl font-bold text-white shadow-md shadow-brand/30" aria-hidden="true">
          +
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-extrabold text-brand">
            {myOrders.length ? "Créer une nouvelle chanson" : "Créer ma première chanson"}
          </span>
          <span className="block text-sm text-muted">Paroles gratuites, tu paies seulement si elles te plaisent</span>
        </span>
        <span className="text-xl text-brand" aria-hidden="true">
          ›
        </span>
      </Link>

      <section aria-labelledby="mes-chansons" className="flex flex-col gap-3">
        <h2 id="mes-chansons" className="text-xl font-extrabold">
          Mes chansons
        </h2>
        {myOrders.length ? (
          <ul className="flex flex-col gap-2">
            {myOrders.map((o) => (
              <OrderRow key={o.id} order={o} />
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-sand">
            <span className="text-4xl" aria-hidden="true">
              🎵
            </span>
            <p className="font-bold">Pas encore de chanson ici</p>
            <p className="text-sm text-muted">
              Les chansons créées sur ce téléphone apparaissent ici toutes seules. Pour une autre, ouvre le lien reçu sur
              WhatsApp pendant que tu es connecté.
            </p>
          </div>
        )}
      </section>

      <a
        href={`https://wa.me/?text=${encodeURIComponent(inviteText)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-4 rounded-3xl bg-gold/15 p-4 ring-1 ring-gold/50 transition active:scale-[0.98]"
      >
        <span className="text-3xl" aria-hidden="true">
          🎁
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-extrabold text-brand-dark">Fais découvrir Dédikace</span>
          <span className="block text-sm text-muted">Envoie le lien à un proche sur WhatsApp</span>
        </span>
        <span className="text-xl text-brand-dark" aria-hidden="true">
          ›
        </span>
      </a>

      <nav aria-label="Aide" className="flex flex-col gap-2 text-sm">
        {SUPPORT_PHONE && (
          <a
            href={whatsappLink(SUPPORT_PHONE, "Bonjour, j'ai une question sur ma chanson Dédikace :")}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-leaf"
          >
            💬 Une question ? Écris-nous sur WhatsApp
          </a>
        )}
        {isAdminEmail(user.email) && (
          <Link href="/admin" className="font-semibold text-muted underline">
            Back-office
          </Link>
        )}
      </nav>
    </div>
  );
}

const STATUS: Record<MyOrder["status"], { label: string; tone: string }> = {
  draft: { label: "Brouillon", tone: "bg-sand text-muted" },
  lyrics_ready: { label: "À finaliser", tone: "bg-gold/20 text-brand-dark" },
  payment_failed: { label: "Paiement à refaire", tone: "bg-gold/20 text-brand-dark" },
  pending_payment: { label: "Paiement en cours", tone: "bg-sand text-ink" },
  paid: { label: "En création…", tone: "bg-sand text-ink" },
  generating: { label: "En création…", tone: "bg-sand text-ink" },
  delivered: { label: "Prête 🎶", tone: "bg-leaf/15 text-leaf" },
  generation_failed: { label: "On s'en occupe", tone: "bg-sand text-ink" },
  refunded: { label: "Remboursée", tone: "bg-sand text-muted" },
};

function OrderRow({ order }: { order: MyOrder }) {
  const emoji = OCCASIONS.find((o) => o.id === order.occasion)?.emoji ?? "🎵";
  const status = STATUS[order.status];
  const toPay = order.status === "lyrics_ready" || order.status === "payment_failed";
  const href = order.status === "delivered" ? `/s/${order.publicCode}` : `/commande/${order.id}`;
  const date = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(order.createdAt);
  return (
    <li>
      <Link href={href} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-sand transition active:scale-[0.99]">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sand/70 text-2xl" aria-hidden="true">
          {emoji}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-bold">{order.title || `Pour ${order.recipientName}`}</span>
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <span className={`rounded-full px-2 py-0.5 font-bold ${status.tone}`}>{status.label}</span>
            <span className="text-muted">
              {order.recipientName} · {date}
            </span>
          </span>
        </span>
        <span className={`shrink-0 text-sm font-bold ${toPay ? "rounded-full bg-brand px-3 py-1.5 text-white" : "text-brand"}`}>
          {toPay ? "Finaliser" : order.status === "delivered" ? "Écouter" : "Voir"}
        </span>
      </Link>
    </li>
  );
}
