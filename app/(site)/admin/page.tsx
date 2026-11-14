import Link from "next/link";
import { Suspense } from "react";
import { listOrders } from "@/lib/admin";
import { getDashboard, parsePeriod, PERIODS, type PeriodId } from "@/lib/admin-stats";
import { missingProductionSettings } from "@/lib/notifications";
import { listToRemind } from "@/lib/reminders";
import { requireAdmin } from "@/lib/auth";
import { orderStatus, type OrderStatus } from "@/lib/db/schema";
import { formatXaf } from "@/lib/format";
import { occasionLabel } from "@/lib/occasions";
import { getStyle } from "@/lib/styles";
import { Breakdown, DailyChart, FunnelCard, GoalCard, HoursCard, KpiTiles, QualityCard } from "./DashboardBlocks";
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

// Raccourcis vers les outils externes (s'ouvrent dans un nouvel onglet, aucune clé dans l'adresse).
const TOOLS = [
  { href: "https://vercel.com/darthie/dedikace/analytics", label: "📈 Visites" },
  { href: "https://app.inngest.com", label: "⚙️ Créations (Inngest)" },
  { href: "https://search.google.com/search-console", label: "🔎 Google" },
  { href: "https://business.facebook.com/events_manager2", label: "📣 Pixel Meta" },
];

async function Dashboard({ searchParams }: { searchParams: PageProps<"/admin">["searchParams"] }) {
  const { email } = await requireAdmin();
  const params = await searchParams;
  const status = orderStatus.enumValues.find((s) => s === params.statut);
  const period = parsePeriod(params.periode);
  const q = typeof params.q === "string" ? params.q.slice(0, 60) : "";
  const [data, rows, reminders] = await Promise.all([getDashboard(period), listOrders(status, q), listToRemind()]);
  const missing = missingProductionSettings();
  const link = (next: { periode?: PeriodId; statut?: OrderStatus }) => {
    const sp = new URLSearchParams();
    const p = next.periode ?? period;
    if (p !== "7j") sp.set("periode", p);
    const st = "statut" in next ? next.statut : status;
    if (st) sp.set("statut", st);
    if (q) sp.set("q", q);
    const qs = sp.toString();
    return qs ? `/admin?${qs}` : "/admin";
  };
  const rate = (channel: string) => {
    const r = data.channelRates.find((c) => c.channel === channel);
    return r?.rate == null ? null : `${Math.round(r.rate * 100)} % réussis`;
  };

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-extrabold tracking-tight">Tableau de bord</h1>
        <form action={logout}>
          <button type="submit" className="text-sm font-semibold text-muted underline" title={email}>
            Me déconnecter
          </button>
        </form>
      </header>

      {missing.length > 0 && (
        <p role="alert" className="rounded-2xl bg-brand p-4 font-semibold text-white">
          ⚠️ Réglage manquant sur Vercel (Production) : {missing.join(", ")}. Les commandes peuvent rester bloquées tant que
          ce n’est pas corrigé.
        </p>
      )}

      <div className="grid gap-2 md:grid-cols-3">
        <Link
          href="/admin/relances"
          className={`flex items-center justify-between rounded-2xl p-4 font-bold ${
            reminders.todo.length > 0 ? "bg-[#25d366] text-white" : "bg-white ring-1 ring-sand"
          }`}
        >
          <span>💬 À relancer</span>
          <span className="rounded-full bg-white/25 px-2.5 py-0.5">{reminders.todo.length}</span>
        </Link>
        <Link
          href={link({ statut: "generation_failed" })}
          className={`flex items-center justify-between rounded-2xl p-4 font-bold ${
            data.live.failed > 0 ? "bg-brand text-white" : "bg-white ring-1 ring-sand"
          }`}
        >
          <span>🚨 Créations en échec</span>
          <span className="rounded-full bg-white/25 px-2.5 py-0.5">{data.live.failed}</span>
        </Link>
        <Link href={link({ statut: "generating" })} className="flex items-center justify-between rounded-2xl bg-white p-4 font-bold ring-1 ring-sand">
          <span>🎶 En création</span>
          <span className="rounded-full bg-sand px-2.5 py-0.5">{data.live.working}</span>
        </Link>
      </div>
      {data.live.waitingPayment > 0 && (
        <Link href={link({ statut: "pending_payment" })} className="rounded-2xl bg-gold/25 p-3 text-sm font-semibold">
          ⏳ {data.live.waitingPayment} paiement{data.live.waitingPayment > 1 ? "s" : ""} lancé
          {data.live.waitingPayment > 1 ? "s" : ""} sans réponse depuis plus de 30 min (2 derniers jours). Vérifie chez
          Tranzak ou relance le client.
        </Link>
      )}

      <nav aria-label="Période" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {(Object.keys(PERIODS) as PeriodId[]).map((p) => (
          <Link
            key={p}
            href={link({ periode: p })}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ${p === period ? "bg-ink text-white" : "bg-white ring-1 ring-sand"}`}
          >
            {PERIODS[p].label}
          </Link>
        ))}
      </nav>

      <KpiTiles data={data} />
      <GoalCard goal={data.goal} />
      <DailyChart daily={data.daily} />

      <div className="grid gap-4 md:grid-cols-2">
        <FunnelCard funnel={data.funnel} />
        <HoursCard hours={data.hours} />
        <Breakdown title="Occasions qui vendent" items={data.byOccasion} label={occasionLabel} />
        <Breakdown title="Styles qui vendent" items={data.byStyle} label={(id) => getStyle(id)?.label ?? id} />
        <Breakdown title="Moyens de paiement" items={data.byChannel} label={(c) => CHANNEL_LABELS[c] ?? c} extra={rate} />
        <QualityCard quality={data.quality} />
      </div>

      <section aria-labelledby="outils" className="flex flex-col gap-2">
        <h2 id="outils" className="font-bold">
          Outils
        </h2>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/admin/export?periode=${period}`}
            className="rounded-full bg-ink px-3 py-1.5 text-sm font-semibold text-white"
          >
            ⬇️ Export des ventes (CSV, {PERIODS[period].label.toLowerCase()})
          </a>
          {TOOLS.map((t) => (
            <a key={t.href} href={t.href} target="_blank" rel="noopener noreferrer" className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold ring-1 ring-sand">
              {t.label}
            </a>
          ))}
        </div>
      </section>

      <section aria-labelledby="orders" className="flex flex-col gap-3">
        <h2 id="orders" className="font-bold">
          Commandes {status ? `· ${STATUS_LABELS[status]}` : ""} {q ? `· « ${q} »` : ""}
        </h2>
        <form action="/admin" className="flex gap-2" role="search">
          {period !== "7j" && <input type="hidden" name="periode" value={period} />}
          {status && <input type="hidden" name="statut" value={status} />}
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Prénom, numéro ou code…"
            aria-label="Rechercher une commande"
            className="h-11 min-w-0 flex-1 rounded-xl bg-white px-3 ring-1 ring-sand focus:ring-2 focus:ring-brand focus:outline-none"
          />
          <button type="submit" className="h-11 rounded-xl bg-ink px-4 font-semibold text-white">
            Chercher
          </button>
        </form>
        <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" aria-label="Filtrer par statut">
          {FILTERS.map((f) => (
            <Link
              key={f ?? "all"}
              href={link({ statut: f })}
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
