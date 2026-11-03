import Link from "next/link";
import { Suspense } from "react";
import { getTodayStats, listOrders } from "@/lib/admin";
import { requireAdmin } from "@/lib/auth";
import { orderStatus, type OrderStatus } from "@/lib/db/schema";
import { formatXaf } from "@/lib/format";
import { logout } from "./actions";
import { CHANNEL_LABELS, formatDate, STATUS_COLORS, STATUS_LABELS } from "./labels";

export default function AdminPage({ searchParams }: PageProps<"/admin">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-sand/60" aria-label="Chargement" />}>
      <Dashboard searchParams={searchParams} />
    </Suspense>
  );
}

const FILTERS: (OrderStatus | undefined)[] = [
  undefined,
  "pending_payment",
  "paid",
  "generating",
  "delivered",
  "payment_failed",
  "generation_failed",
  "refunded",
  "lyrics_ready",
  "draft",
];

async function Dashboard({ searchParams }: { searchParams: PageProps<"/admin">["searchParams"] }) {
  const { email } = await requireAdmin();
  const { statut } = await searchParams;
  const status = orderStatus.enumValues.find((s) => s === statut);
  const [stats, rows] = await Promise.all([getTodayStats(), listOrders(status)]);

  const tiles = [
    { label: "Formulaires commencés", value: String(stats.formsStarted) },
    { label: "Commandes payées", value: String(stats.paidOrders) },
    { label: "Chiffre d’affaires", value: formatXaf(stats.revenueXaf) },
    { label: "Échecs", value: String(stats.failures), alert: stats.failures > 0 },
  ];

  return (
    <>
      <header className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-extrabold tracking-tight">Back-office</h1>
        <form action={logout}>
          <button type="submit" className="text-sm font-semibold text-muted underline" title={email}>
            Me déconnecter
          </button>
        </form>
      </header>

      <section aria-labelledby="today">
        <h2 id="today" className="mb-2 font-bold">
          Aujourd’hui
        </h2>
        <dl className="grid grid-cols-2 gap-2">
          {tiles.map((t) => (
            <div key={t.label} className={`rounded-2xl p-3 ${t.alert ? "bg-brand/10" : "bg-white ring-1 ring-sand"}`}>
              <dt className="text-sm text-muted">{t.label}</dt>
              <dd className={`text-2xl font-extrabold ${t.alert ? "text-brand-dark" : ""}`}>{t.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="orders" className="flex flex-col gap-3">
        <h2 id="orders" className="font-bold">
          Commandes {status ? `· ${STATUS_LABELS[status]}` : ""}
        </h2>
        <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" aria-label="Filtrer par statut">
          {FILTERS.map((f) => (
            <Link
              key={f ?? "all"}
              href={f ? `/admin?statut=${f}` : "/admin"}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ${
                f === status ? "bg-ink text-white" : "bg-white ring-1 ring-sand"
              }`}
            >
              {f ? STATUS_LABELS[f] : "Toutes"}
            </Link>
          ))}
        </nav>

        {rows.length === 0 ? (
          <p className="rounded-2xl bg-white p-4 text-muted ring-1 ring-sand">Aucune commande ici.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {rows.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/admin/commandes/${o.id}`}
                  className="flex flex-col gap-1 rounded-2xl bg-white p-3 ring-1 ring-sand active:bg-sand/40"
                >
                  <span className="flex items-center justify-between gap-2">
                    <strong className="truncate">{o.recipientName}</strong>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[o.status] ?? "bg-sand"}`}>
                      {STATUS_LABELS[o.status]}
                    </span>
                  </span>
                  <span className="flex flex-wrap gap-x-3 text-sm text-muted">
                    <span>{formatDate(o.createdAt)}</span>
                    <span>{formatXaf(o.priceXaf)}</span>
                    {o.channel && <span>{CHANNEL_LABELS[o.channel] ?? o.channel}</span>}
                    <span>{o.whatsappPhone}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {rows.length === 100 && <p className="text-sm text-muted">Seules les 100 dernières commandes sont affichées.</p>}
      </section>
    </>
  );
}
