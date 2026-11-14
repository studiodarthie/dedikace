import "server-only";
import { sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";

// Chiffres du tableau de bord (/admin). Tout est calculé en heure de Douala, à partir des paiements
// vérifiés (status successful) : un paiement remboursé passe en « refunded » et sort des chiffres.

/** Objectif de chiffre d'affaires depuis le lancement, affiché en barre de progression. */
export const GOAL_XAF = 600_000;

export const PERIODS = {
  jour: { label: "Aujourd’hui", days: 1 },
  "7j": { label: "7 jours", days: 7 },
  "30j": { label: "30 jours", days: 30 },
  tout: { label: "Depuis le début", days: null },
} as const;
export type PeriodId = keyof typeof PERIODS;

export function parsePeriod(value: unknown): PeriodId {
  return typeof value === "string" && value in PERIODS ? (value as PeriodId) : "7j";
}

const TZ = "Africa/Douala";
// Minuit à Douala, il y a n-1 jours (n = 1 : aujourd'hui).
const midnight = (daysAgo: number) =>
  sql`(date_trunc('day', now() at time zone ${TZ}) - make_interval(days => ${daysAgo})) at time zone ${TZ}`;

type Range = { from: SQL; to: SQL };

function ranges(period: PeriodId): { current: Range; previous: Range | null } {
  const days = PERIODS[period].days;
  if (days === null) return { current: { from: sql`'-infinity'::timestamptz`, to: sql`now()` }, previous: null };
  const start = midnight(days - 1);
  return {
    current: { from: start, to: sql`now()` },
    // Même durée juste avant (ex. hier à la même heure pour « aujourd'hui »).
    previous: { from: midnight(2 * days - 1), to: sql`now() - make_interval(days => ${days})` },
  };
}

async function rows<T>(query: SQL): Promise<T[]> {
  const result = await db.execute(query);
  return result.rows as T[];
}

const num = (v: unknown) => Number(v ?? 0);

async function sales(range: Range) {
  const [r] = await rows<{ n: string; total: string }>(sql`
    select count(*) as n, coalesce(sum(amount_xaf), 0) as total from payments
    where status = 'successful' and verified_at >= ${range.from} and verified_at < ${range.to}`);
  return { orders: num(r?.n), revenueXaf: num(r?.total) };
}

async function funnel(range: Range) {
  const list = await rows<{ type: string; n: string }>(sql`
    select type, count(*) as n from events
    where created_at >= ${range.from} and created_at < ${range.to} group by type`);
  const get = (t: string) => num(list.find((r) => r.type === t)?.n);
  return {
    formStarted: get("form_started"),
    lyricsGenerated: get("lyrics_generated"),
    paymentStarted: get("payment_started"),
    paymentSucceeded: get("payment_succeeded"),
  };
}

/** Ventes payées regroupées par une colonne (occasion, style, moyen de paiement). */
async function breakdown(range: Range, column: SQL) {
  const list = await rows<{ key: string; n: string; total: string }>(sql`
    select ${column} as key, count(*) as n, coalesce(sum(p.amount_xaf), 0) as total
    from payments p join orders o on o.id = p.order_id
    where p.status = 'successful' and p.verified_at >= ${range.from} and p.verified_at < ${range.to}
    group by 1 order by 3 desc, 2 desc`);
  return list.map((r) => ({ key: r.key, orders: num(r.n), revenueXaf: num(r.total) }));
}

export async function getDashboard(period: PeriodId) {
  const { current, previous } = ranges(period);
  const chartDays = period === "30j" || period === "tout" ? 30 : 14;

  const [now, before, steps, byOccasion, byStyle, byChannel, hours, channelRates, daily, totals, pace, quality, repeat, live] =
    await Promise.all([
      sales(current),
      previous ? sales(previous) : Promise.resolve(null),
      funnel(current),
      breakdown(current, sql`o.occasion`),
      breakdown(current, sql`o.style_id`),
      breakdown(current, sql`p.channel::text`),
      rows<{ h: string; n: string }>(sql`
        select extract(hour from verified_at at time zone ${TZ})::int as h, count(*) as n from payments
        where status = 'successful' and verified_at >= ${current.from} and verified_at < ${current.to}
        group by 1 order by 1`),
      rows<{ channel: string; ok: string; ko: string }>(sql`
        select channel::text as channel,
          count(*) filter (where status = 'successful') as ok,
          count(*) filter (where status in ('failed', 'cancelled')) as ko
        from payments where created_at >= ${current.from} and created_at < ${current.to} and channel <> 'manual'
        group by 1 order by 1`),
      rows<{ day: string; n: string; total: string }>(sql`
        select to_char(d, 'YYYY-MM-DD') as day, count(p.id) as n, coalesce(sum(p.amount_xaf), 0) as total
        from generate_series(date_trunc('day', now() at time zone ${TZ}) - make_interval(days => ${chartDays - 1}),
                             date_trunc('day', now() at time zone ${TZ}), interval '1 day') d
        left join payments p on p.status = 'successful' and date_trunc('day', p.verified_at at time zone ${TZ}) = d
        group by d order by d`),
      rows<{ total: string; first: Date | null }>(sql`
        select coalesce(sum(amount_xaf), 0) as total, min(verified_at) as first from payments where status = 'successful'`),
      rows<{ total: string }>(sql`
        select coalesce(sum(amount_xaf), 0) as total from payments
        where status = 'successful' and verified_at >= ${midnight(6)}`),
      rows<{ delivered: string; regen: string; videos: string }>(sql`
        select
          (select count(*) from orders where status in ('delivered', 'refunded') and created_at >= ${current.from}) as delivered,
          (select count(*) from orders where free_regen_used and created_at >= ${current.from}) as regen,
          (select count(*) from videos where status = 'ready' and created_at >= ${current.from}) as videos`),
      rows<{ n: string }>(sql`
        select count(*) as n from (
          select o.whatsapp_phone from payments p join orders o on o.id = p.order_id
          where p.status = 'successful' group by 1 having count(distinct o.id) > 1) t`),
      rows<{ working: string; failed: string; waiting: string }>(sql`
        select
          count(*) filter (where status in ('paid', 'generating')) as working,
          count(*) filter (where status = 'generation_failed') as failed,
          count(*) filter (where status = 'pending_payment' and updated_at < now() - interval '30 minutes'
                                 and updated_at > now() - interval '2 days') as waiting
        from orders`),
    ]);

  const totalXaf = num(totals[0]?.total);
  const perDay = Math.round(num(pace[0]?.total) / 7);
  const left = Math.max(0, GOAL_XAF - totalXaf);
  const delivered = num(quality[0]?.delivered);

  return {
    sales: { ...now, averageXaf: now.orders ? Math.round(now.revenueXaf / now.orders) : 0 },
    previous: before,
    funnel: steps,
    byOccasion,
    byStyle,
    byChannel,
    hours: hours.map((h) => ({ hour: num(h.h), orders: num(h.n) })),
    channelRates: channelRates.map((c) => {
      const ok = num(c.ok);
      const ko = num(c.ko);
      return { channel: c.channel, ok, ko, rate: ok + ko ? ok / (ok + ko) : null };
    }),
    daily: daily.map((d) => ({ day: d.day, orders: num(d.n), revenueXaf: num(d.total) })),
    goal: {
      goalXaf: GOAL_XAF,
      totalXaf,
      firstSale: totals[0]?.first ? new Date(totals[0].first) : null,
      perDayXaf: perDay,
      daysLeft: left === 0 ? 0 : perDay > 0 ? Math.ceil(left / perDay) : null,
    },
    quality: {
      delivered,
      regenRate: delivered ? num(quality[0]?.regen) / delivered : null,
      videos: num(quality[0]?.videos),
      repeatCustomers: num(repeat[0]?.n),
    },
    live: { working: num(live[0]?.working), failed: num(live[0]?.failed), waitingPayment: num(live[0]?.waiting) },
  };
}

export type Dashboard = Awaited<ReturnType<typeof getDashboard>>;

/** Ventes payées de la période, pour l'export CSV (comptabilité). */
export async function exportSales(period: PeriodId) {
  const { current } = ranges(period);
  return rows<{
    paid_at: Date;
    code: string;
    occasion: string;
    style: string;
    channel: string;
    amount: number;
    phone: string;
    recipient: string;
    reference: string;
  }>(sql`
    select p.verified_at as paid_at, o.public_code as code, o.occasion, o.style_id as style, p.channel::text as channel,
      p.amount_xaf as amount, o.whatsapp_phone as phone, o.recipient_name as recipient, p.merchant_ref as reference
    from payments p join orders o on o.id = p.order_id
    where p.status = 'successful' and p.verified_at >= ${current.from} and p.verified_at < ${current.to}
    order by p.verified_at desc`);
}
