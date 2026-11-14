import type { ReactNode } from "react";
import type { Dashboard } from "@/lib/admin-stats";
import { formatXaf } from "@/lib/format";

// Briques visuelles du tableau de bord (rendu serveur, sans bibliothèque de graphiques : léger en 3G).

const pct = (v: number | null) => (v === null ? "—" : `${Math.round(v * 100)} %`);

export function Card({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-sand ${className}`}>
      {title && <h2 className="font-bold">{title}</h2>}
      {children}
    </section>
  );
}

/** Évolution par rapport à la période précédente : ▲ 20 % / ▼ 10 %. */
function Delta({ now, before }: { now: number; before: number | undefined }) {
  if (before === undefined) return null;
  if (before === 0) return now > 0 ? <span className="text-xs font-bold text-leaf">nouveau</span> : null;
  const change = (now - before) / before;
  const up = change >= 0;
  return (
    <span className={`text-xs font-bold ${up ? "text-leaf" : "text-brand-dark"}`}>
      {up ? "▲" : "▼"} {Math.abs(Math.round(change * 100))} %
    </span>
  );
}

export function KpiTiles({ data }: { data: Dashboard }) {
  const conversion = data.funnel.formStarted ? data.sales.orders / data.funnel.formStarted : null;
  const tiles = [
    { label: "Chiffre d’affaires", value: formatXaf(data.sales.revenueXaf), delta: <Delta now={data.sales.revenueXaf} before={data.previous?.revenueXaf} /> },
    { label: "Ventes", value: String(data.sales.orders), delta: <Delta now={data.sales.orders} before={data.previous?.orders} /> },
    { label: "Panier moyen", value: data.sales.orders ? formatXaf(data.sales.averageXaf) : "—" },
    { label: "Visiteur → vente", value: pct(conversion), hint: "ventes ÷ formulaires commencés" },
  ];
  return (
    <dl className="grid grid-cols-2 gap-2 md:grid-cols-4">
      {tiles.map((t) => (
        <div key={t.label} className="flex flex-col gap-0.5 rounded-2xl bg-white p-3 ring-1 ring-sand">
          <dt className="text-sm text-muted">{t.label}</dt>
          <dd className="text-2xl font-extrabold">{t.value}</dd>
          {t.delta}
          {t.hint && <span className="text-xs text-muted">{t.hint}</span>}
        </div>
      ))}
    </dl>
  );
}

export function GoalCard({ goal }: { goal: Dashboard["goal"] }) {
  const ratio = Math.min(1, goal.totalXaf / goal.goalXaf);
  const left = Math.max(0, goal.goalXaf - goal.totalXaf);
  return (
    <Card>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-bold">🎯 Objectif {formatXaf(goal.goalXaf)}</h2>
        <span className="text-sm font-bold text-brand-dark">{Math.floor(ratio * 100)} %</span>
      </div>
      <div className="h-4 overflow-hidden rounded-full bg-sand" role="progressbar" aria-valuemin={0} aria-valuemax={goal.goalXaf} aria-valuenow={goal.totalXaf}>
        <div className="h-full rounded-full bg-gradient-to-r from-brand to-gold" style={{ width: `${Math.max(2, ratio * 100)}%` }} />
      </div>
      <p className="text-sm text-muted">
        {formatXaf(goal.totalXaf)} encaissés{left > 0 ? `, il reste ${formatXaf(left)}` : " : objectif atteint 🎉"}.
        {goal.perDayXaf > 0 && ` Rythme des 7 derniers jours : ${formatXaf(goal.perDayXaf)} par jour`}
        {goal.daysLeft ? `, soit environ ${goal.daysLeft} jour${goal.daysLeft > 1 ? "s" : ""} pour y arriver.` : goal.perDayXaf > 0 ? "." : ""}
      </p>
    </Card>
  );
}

const dayFormat = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" });

export function DailyChart({ daily }: { daily: Dashboard["daily"] }) {
  const max = Math.max(1, ...daily.map((d) => d.revenueXaf));
  const best = daily.reduce((a, b) => (b.revenueXaf > a.revenueXaf ? b : a), daily[0]);
  return (
    <Card title={`Chiffre d’affaires par jour (${daily.length} jours)`}>
      <div className="flex h-36 items-end gap-[3px]" role="img" aria-label="Chiffre d'affaires par jour">
        {daily.map((d) => (
          <div key={d.day} className="group relative flex h-full flex-1 flex-col justify-end">
            <div
              className={`w-full rounded-t ${d.revenueXaf > 0 ? "bg-brand" : "bg-sand"}`}
              style={{ height: `${Math.max(3, (d.revenueXaf / max) * 100)}%` }}
              title={`${dayFormat.format(new Date(d.day))} : ${formatXaf(d.revenueXaf)} (${d.orders} vente${d.orders > 1 ? "s" : ""})`}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted">
        <span>{daily[0] && dayFormat.format(new Date(daily[0].day))}</span>
        {best && best.revenueXaf > 0 && (
          <span>
            Meilleur jour : {dayFormat.format(new Date(best.day))} ({formatXaf(best.revenueXaf)})
          </span>
        )}
        <span>aujourd’hui</span>
      </div>
    </Card>
  );
}

export function FunnelCard({ funnel }: { funnel: Dashboard["funnel"] }) {
  const steps = [
    { label: "Formulaires commencés", n: funnel.formStarted },
    { label: "Paroles créées", n: funnel.lyricsGenerated },
    { label: "Paiements lancés", n: funnel.paymentStarted },
    { label: "Paiements réussis", n: funnel.paymentSucceeded },
  ];
  const max = Math.max(1, steps[0].n);
  return (
    <Card title="Parcours des visiteurs">
      <ol className="flex flex-col gap-2">
        {steps.map((s, i) => {
          const prev = i > 0 ? steps[i - 1].n : null;
          return (
            <li key={s.label} className="flex flex-col gap-1">
              <div className="flex justify-between text-sm">
                <span>{s.label}</span>
                <span className="font-bold">
                  {s.n}
                  {prev ? <span className="ml-2 font-normal text-muted">({pct(s.n / prev)})</span> : null}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-sand">
                <div className="h-full rounded-full bg-ink" style={{ width: `${(s.n / max) * 100}%` }} />
              </div>
            </li>
          );
        })}
      </ol>
      <p className="text-xs text-muted">
        Le plus gros écart montre où les clients décrochent. Paroles créées → paiement lancé faible : travaille le prix ou
        la confiance. Paiement lancé → réussi faible : souci Mobile Money, relance-les.
      </p>
    </Card>
  );
}

export function Breakdown({
  title,
  items,
  label,
  extra,
}: {
  title: string;
  items: { key: string; orders: number; revenueXaf: number }[];
  label: (key: string) => string;
  extra?: (key: string) => string | null;
}) {
  const max = Math.max(1, ...items.map((i) => i.revenueXaf));
  return (
    <Card title={title}>
      {items.length === 0 ? (
        <p className="text-sm text-muted">Pas encore de vente sur la période.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.slice(0, 8).map((item) => (
            <li key={item.key} className="flex flex-col gap-1">
              <div className="flex justify-between gap-2 text-sm">
                <span className="truncate">{label(item.key)}</span>
                <span className="shrink-0 font-bold">
                  {formatXaf(item.revenueXaf)} <span className="font-normal text-muted">· {item.orders}</span>
                  {extra?.(item.key) && <span className="ml-1 font-normal text-muted">· {extra(item.key)}</span>}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-sand">
                <div className="h-full rounded-full bg-gold" style={{ width: `${(item.revenueXaf / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function HoursCard({ hours }: { hours: Dashboard["hours"] }) {
  const byHour = Array.from({ length: 24 }, (_, h) => hours.find((x) => x.hour === h)?.orders ?? 0);
  const max = Math.max(1, ...byHour);
  const top = byHour
    .map((n, h) => ({ n, h }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 3);
  return (
    <Card title="Heures des ventes (Douala)">
      <div className="flex h-20 items-end gap-[2px]" role="img" aria-label="Ventes par heure">
        {byHour.map((n, h) => (
          <div
            key={h}
            className={`flex-1 rounded-t ${n > 0 ? "bg-leaf" : "bg-sand"}`}
            style={{ height: `${Math.max(4, (n / max) * 100)}%` }}
            title={`${h} h : ${n} vente${n > 1 ? "s" : ""}`}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted">
        <span>0 h</span>
        <span>12 h</span>
        <span>23 h</span>
      </div>
      {top.length > 0 && (
        <p className="text-sm text-muted">
          Meilleurs créneaux : {top.map((t) => `${t.h} h`).join(", ")}. Publie tes vidéos et lance tes pubs juste avant.
        </p>
      )}
    </Card>
  );
}

export function QualityCard({ quality }: { quality: Dashboard["quality"] }) {
  const items = [
    { label: "Chansons livrées", value: String(quality.delivered) },
    { label: "Refaites gratuitement", value: pct(quality.regenRate), hint: "au-dessus de 20 % : écoute les styles concernés" },
    { label: "Vidéos statut créées", value: String(quality.videos) },
    { label: "Clients revenus", value: String(quality.repeatCustomers), hint: "même numéro, au moins 2 achats (depuis le début)" },
  ];
  return (
    <Card title="Qualité et fidélité">
      <dl className="grid grid-cols-2 gap-3">
        {items.map((i) => (
          <div key={i.label}>
            <dt className="text-sm text-muted">{i.label}</dt>
            <dd className="text-xl font-extrabold">{i.value}</dd>
            {i.hint && <span className="text-xs text-muted">{i.hint}</span>}
          </div>
        ))}
      </dl>
    </Card>
  );
}
