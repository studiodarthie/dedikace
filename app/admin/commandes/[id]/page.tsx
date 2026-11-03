import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { z } from "zod";
import { canRelaunch, getOrderDetail } from "@/lib/admin";
import { requireAdmin } from "@/lib/auth";
import { formatXaf, whatsappLink } from "@/lib/format";
import { occasionLabel } from "@/lib/occasions";
import { getSignedSongUrl } from "@/lib/storage";
import { getStyle } from "@/lib/styles";
import { CHANNEL_LABELS, formatDate, STATUS_COLORS, STATUS_LABELS } from "../../labels";
import { OrderActions } from "./OrderActions";

export const metadata: Metadata = { title: "Commande" };

export default function AdminOrderPage({ params }: PageProps<"/admin/commandes/[id]">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-sand/60" aria-label="Chargement" />}>
      <OrderDetail params={params} />
    </Suspense>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2 rounded-2xl bg-white p-4 ring-1 ring-sand">
      <h2 className="font-bold">{title}</h2>
      {children}
    </section>
  );
}

async function OrderDetail({ params }: { params: PageProps<"/admin/commandes/[id]">["params"] }) {
  await requireAdmin();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const detail = await getOrderDetail(id);
  if (!detail) notFound();
  const { order } = detail;

  // URL signées valables 1 h (CLAUDE.md règle 9).
  const songs = await Promise.all(
    detail.songs.map(async (s) => ({
      ...s,
      url: s.status === "ready" && s.storagePath ? await getSignedSongUrl(s.storagePath, 3600) : undefined,
    })),
  );
  const payable = ["lyrics_ready", "pending_payment", "payment_failed"].includes(order.status);
  const refundable = ["paid", "generating", "delivered", "generation_failed"].includes(order.status);

  return (
    <>
      <Link href="/admin" className="w-fit text-sm font-semibold text-muted underline">
        ← Toutes les commandes
      </Link>
      <header className="flex flex-col gap-2">
        <span className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ${STATUS_COLORS[order.status] ?? "bg-sand"}`}>
          {STATUS_LABELS[order.status]}
        </span>
        <h1 className="text-2xl font-extrabold tracking-tight">
          {order.title ?? "Sans titre"} · {order.recipientName}
        </h1>
        <p className="text-sm text-muted">
          Code {order.publicCode} · créée le {formatDate(order.createdAt)} · mise à jour le {formatDate(order.updatedAt)}
        </p>
      </header>

      <OrderActions
        orderId={order.id}
        canRelaunch={canRelaunch(order)}
        canRefund={refundable}
        canValidatePayment={payable && !!order.lyrics}
        defaultAmount={order.priceXaf}
      />

      <Section title="Client">
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="text-muted">WhatsApp</dt>
          <dd>
            <a href={whatsappLink(order.whatsappPhone)} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand">
              {order.whatsappPhone}
            </a>
          </dd>
          <dt className="text-muted">Occasion</dt>
          <dd>{occasionLabel(order.occasion)}</dd>
          <dt className="text-muted">Style</dt>
          <dd>
            {getStyle(order.styleId)?.label ?? order.styleId} · voix {order.voice === "female" ? "féminine" : "masculine"} · refrain{" "}
            {order.chorusLanguage}
          </dd>
          <dt className="text-muted">De la part de</dt>
          <dd>{order.senderName ?? "—"}</dd>
          <dt className="text-muted">Lien</dt>
          <dd>{order.relation ?? "—"}</dd>
          <dt className="text-muted">Prix</dt>
          <dd>{formatXaf(order.priceXaf)}</dd>
          <dt className="text-muted">Réécritures</dt>
          <dd>
            {order.rewriteCount} · régénération gratuite {order.freeRegenUsed ? "utilisée" : "disponible"}
          </dd>
        </dl>
        {order.anecdotes && <p className="text-sm whitespace-pre-wrap text-muted">« {order.anecdotes} »</p>}
        {order.moderationNote && (
          <p className="rounded-xl bg-brand/10 p-2 text-sm whitespace-pre-wrap text-brand-dark">
            Modération : {order.moderationNote}
          </p>
        )}
      </Section>

      <Section title="Paiements">
        {detail.payments.length === 0 ? (
          <p className="text-sm text-muted">Aucun paiement.</p>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {detail.payments.map((p) => {
              const manual = p.channel === "manual" ? (p.rawNotification as { reference?: string; validatedBy?: string } | null) : null;
              return (
                <li key={p.id} className="rounded-xl bg-cream p-2">
                  <p className="font-semibold">
                    {formatXaf(p.amountXaf)} · {CHANNEL_LABELS[p.channel] ?? p.channel} · {p.status}
                  </p>
                  <p className="break-all text-muted">
                    {formatDate(p.createdAt)} · réf. {p.merchantRef}
                    {p.providerRequestId ? ` · Tranzak ${p.providerRequestId}` : ""}
                    {p.verifiedAt ? ` · vérifié le ${formatDate(p.verifiedAt)}` : ""}
                    {p.rawNotification && !manual ? " · notification reçue" : ""}
                  </p>
                  {manual && (
                    <p className="text-muted">
                      Validé à la main par {manual.validatedBy} (réf. {manual.reference})
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Section title="Versions créées">
        {songs.length === 0 ? (
          <p className="text-sm text-muted">Aucune version pour l’instant.</p>
        ) : (
          <ul className="flex flex-col gap-3 text-sm">
            {songs.map((s) => (
              <li key={s.id} className="flex flex-col gap-1 rounded-xl bg-cream p-2">
                <p className="font-semibold">
                  Création {s.generation} · version {s.version} · {s.status} · {s.attempts} essai{s.attempts > 1 ? "s" : ""}
                  {s.durationSeconds ? ` · ${s.durationSeconds} s` : ""}
                </p>
                {s.url && <audio controls preload="none" src={s.url} className="w-full" />}
                {s.error && <p className="break-words text-brand-dark">Erreur : {s.error}</p>}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Paroles">
        <p className="text-sm whitespace-pre-wrap">{order.lyrics ?? "Pas encore de paroles."}</p>
      </Section>

      <Section title="Historique">
        <ul className="text-sm text-muted">
          {detail.events.map((e) => (
            <li key={e.id}>
              {formatDate(e.createdAt)} · {e.type}
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
