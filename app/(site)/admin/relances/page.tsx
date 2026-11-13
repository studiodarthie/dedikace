import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { whatsappLink } from "@/lib/format";
import { OCCASIONS } from "@/lib/occasions";
import { getReminderStats, listToRemind, reminderMessage, type ReminderRow } from "@/lib/reminders";
import { formatDate } from "../labels";
import { RemindButton } from "./RemindButton";

export const metadata: Metadata = { title: "À relancer" };

export default function RemindersPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-sand/60" aria-label="Chargement" />}>
      <Reminders />
    </Suspense>
  );
}

function ago(date: Date): string {
  const h = Math.floor((Date.now() - date.getTime()) / 3_600_000);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  return `il y a ${d} jour${d > 1 ? "s" : ""}`;
}

function Row({ o }: { o: ReminderRow }) {
  const occasion = OCCASIONS.find((x) => x.id === o.occasion);
  return (
    <li className="flex flex-col gap-3 rounded-2xl bg-white p-3 ring-1 ring-sand">
      <div className="flex items-start justify-between gap-2">
        <Link href={`/admin/commandes/${o.id}`} className="min-w-0">
          <strong className="block truncate">
            {occasion?.emoji} {o.recipientName}
            {o.senderName && <span className="font-normal text-muted"> · de {o.senderName}</span>}
          </strong>
          <span className="block text-sm text-muted">
            {o.status === "payment_failed" ? "Paiement échoué" : "Paroles prêtes"} {ago(o.updatedAt)} · {o.whatsappPhone}
          </span>
          {o.remindedAt && <span className="block text-sm text-leaf">Relancé le {formatDate(o.remindedAt)}</span>}
        </Link>
      </div>
      <RemindButton orderId={o.id} href={whatsappLink(o.whatsappPhone, reminderMessage(o))} done={!!o.remindedAt} />
    </li>
  );
}

async function Reminders() {
  await requireAdmin();
  const [{ todo, done }, stats] = await Promise.all([listToRemind(), getReminderStats()]);

  return (
    <>
      <header className="flex flex-col gap-1">
        <Link href="/admin" className="text-sm font-semibold text-muted underline">
          ← Back-office
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight">À relancer</h1>
        <p className="text-sm text-muted">
          Paroles prêtes depuis plus d’1 h, sans paiement (7 derniers jours). Le bouton ouvre WhatsApp avec un message
          prêt : tu n’as plus qu’à l’envoyer. Les clients qui ont un espace reçoivent aussi un e-mail automatique.
        </p>
      </header>

      <dl className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-white p-3 ring-1 ring-sand">
          <dt className="text-sm text-muted">Relancées (30 j)</dt>
          <dd className="text-2xl font-extrabold">{stats.reminded}</dd>
        </div>
        <div className="rounded-2xl bg-white p-3 ring-1 ring-sand">
          <dt className="text-sm text-muted">Payées ensuite</dt>
          <dd className="text-2xl font-extrabold text-leaf">{stats.paidAfter}</dd>
        </div>
      </dl>

      <section aria-labelledby="todo" className="flex flex-col gap-2">
        <h2 id="todo" className="font-bold">
          Pas encore relancées ({todo.length})
        </h2>
        {todo.length === 0 ? (
          <p className="rounded-2xl bg-white p-4 text-muted ring-1 ring-sand">Personne à relancer pour l’instant 🎉</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {todo.map((o) => (
              <Row key={o.id} o={o} />
            ))}
          </ul>
        )}
      </section>

      {done.length > 0 && (
        <section aria-labelledby="done" className="flex flex-col gap-2">
          <h2 id="done" className="font-bold">
            Déjà relancées ({done.length})
          </h2>
          <ul className="flex flex-col gap-2">
            {done.map((o) => (
              <Row key={o.id} o={o} />
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
