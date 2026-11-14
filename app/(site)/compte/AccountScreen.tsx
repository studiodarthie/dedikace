import Link from "next/link";
import { Suspense } from "react";
import { listMyOrders, getProfile, type MyOrder } from "@/lib/account";
import { isAdminEmail, requireUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { whatsappLink } from "@/lib/format";
import { OCCASIONS } from "@/lib/occasions";
import { intlLocale, localePath, type Locale } from "@/lib/i18n";
import { ClaimOrders } from "./ClaimOrders";
import { AccountSkeleton } from "@/components/Skeletons";

// « Mon espace », partagé par /compte et /en/compte.

const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "";

const T = {
  fr: {
    hello: (n: string) => `Salut${n ? `, ${n}` : ""} 👋`,
    space: "Ton espace Dédikace",
    settings: "Paramètres",
    createNew: "Créer une nouvelle chanson",
    createFirst: "Créer ma première chanson",
    createHint: "Paroles gratuites, tu paies seulement si elles te plaisent",
    mySongs: "Mes chansons",
    empty: "Pas encore de chanson ici",
    emptyHint:
      "Les chansons créées sur ce téléphone apparaissent ici toutes seules. Pour une autre, ouvre le lien reçu sur WhatsApp pendant que tu es connecté.",
    invite: (url: string) =>
      `🎶 J'ai offert une chanson personnalisée avec Dédikace. Fais-en une pour quelqu'un que tu aimes : ${url}`,
    share: "Fais découvrir Dédikace",
    shareHint: "Envoie le lien à un proche sur WhatsApp",
    help: "Aide",
    question: "Bonjour, j'ai une question sur ma chanson Dédikace :",
    questionLink: "💬 Une question ? Écris-nous sur WhatsApp",
    status: {
      draft: "Brouillon",
      lyrics_ready: "À finaliser",
      payment_failed: "Paiement à refaire",
      pending_payment: "Paiement en cours",
      paid: "En création…",
      generating: "En création…",
      delivered: "Prête 🎶",
      generation_failed: "On s'en occupe",
      refunded: "Remboursée",
    },
    for: (n: string) => `Pour ${n}`,
    finish: "Finaliser",
    listen: "Écouter",
    see: "Voir",
  },
  en: {
    hello: (n: string) => `Hi${n ? `, ${n}` : ""} 👋`,
    space: "Your Dédikace space",
    settings: "Settings",
    createNew: "Create a new song",
    createFirst: "Create my first song",
    createHint: "Free lyrics, you only pay if you like them",
    mySongs: "My songs",
    empty: "No songs here yet",
    emptyHint:
      "Songs created on this phone appear here by themselves. For another one, open the link you got on WhatsApp while signed in.",
    invite: (url: string) => `🎶 I gave a personalised song with Dédikace. Make one for someone you love: ${url}`,
    share: "Tell people about Dédikace",
    shareHint: "Send the link to a loved one on WhatsApp",
    help: "Help",
    question: "Hello, I have a question about my Dédikace song:",
    questionLink: "💬 A question? Message us on WhatsApp",
    status: {
      draft: "Draft",
      lyrics_ready: "To finish",
      payment_failed: "Payment to redo",
      pending_payment: "Payment in progress",
      paid: "Being created…",
      generating: "Being created…",
      delivered: "Ready 🎶",
      generation_failed: "We’re on it",
      refunded: "Refunded",
    },
    for: (n: string) => `For ${n}`,
    finish: "Finish",
    listen: "Listen",
    see: "View",
  },
};

export function AccountScreen({ locale }: { locale: Locale }) {
  return (
    <Suspense fallback={<AccountSkeleton />}>
      <AccountContent locale={locale} />
    </Suspense>
  );
}

async function AccountContent({ locale }: { locale: Locale }) {
  const t = T[locale];
  const to = (p: string) => localePath(locale, p);
  const user = await requireUser(to("/compte"));
  const [profile, myOrders] = await Promise.all([getProfile(user.id), listMyOrders(user.id)]);
  const firstName = (profile?.name ?? user.name ?? "").trim().split(/\s+/)[0];
  const inviteText = t.invite(`${env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}${locale === "en" ? "/en" : ""}`);

  return (
    <div className="flex flex-col gap-6 pt-4">
      <ClaimOrders />
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{t.hello(firstName)}</h1>
          <p className="text-muted">{t.space}</p>
        </div>
        <Link
          href={to("/compte/parametres")}
          aria-label={t.settings}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-xl shadow-sm ring-1 ring-sand"
        >
          ⚙️
        </Link>
      </header>

      <Link
        href={to("/creer")}
        className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-sm ring-2 ring-brand/70 transition active:scale-[0.98]"
      >
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gold to-brand text-3xl font-bold text-white shadow-md shadow-brand/30" aria-hidden="true">
          +
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-extrabold text-brand">
            {myOrders.length ? t.createNew : t.createFirst}
          </span>
          <span className="block text-sm text-muted">{t.createHint}</span>
        </span>
        <span className="text-xl text-brand" aria-hidden="true">
          ›
        </span>
      </Link>

      <section aria-labelledby="mes-chansons" className="flex flex-col gap-3">
        <h2 id="mes-chansons" className="text-xl font-extrabold">
          {t.mySongs}
        </h2>
        {myOrders.length ? (
          <ul className="flex flex-col gap-2">
            {myOrders.map((o) => (
              <OrderRow key={o.id} order={o} locale={locale} />
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-sand">
            <span className="text-4xl" aria-hidden="true">
              🎵
            </span>
            <p className="font-bold">{t.empty}</p>
            <p className="text-sm text-muted">{t.emptyHint}</p>
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
          <span className="block font-extrabold text-brand-dark">{t.share}</span>
          <span className="block text-sm text-muted">{t.shareHint}</span>
        </span>
        <span className="text-xl text-brand-dark" aria-hidden="true">
          ›
        </span>
      </a>

      <nav aria-label={t.help} className="flex flex-col gap-2 text-sm">
        {SUPPORT_PHONE && (
          <a
            href={whatsappLink(SUPPORT_PHONE, t.question)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-leaf"
          >
            {t.questionLink}
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

const TONE: Record<MyOrder["status"], string> = {
  draft: "bg-sand text-muted",
  lyrics_ready: "bg-gold/20 text-brand-dark",
  payment_failed: "bg-gold/20 text-brand-dark",
  pending_payment: "bg-sand text-ink",
  paid: "bg-sand text-ink",
  generating: "bg-sand text-ink",
  delivered: "bg-leaf/15 text-leaf",
  generation_failed: "bg-sand text-ink",
  refunded: "bg-sand text-muted",
};

function OrderRow({ order, locale }: { order: MyOrder; locale: Locale }) {
  const t = T[locale];
  const emoji = OCCASIONS.find((o) => o.id === order.occasion)?.emoji ?? "🎵";
  const status = { label: t.status[order.status], tone: TONE[order.status] };
  const toPay = order.status === "lyrics_ready" || order.status === "payment_failed";
  const href = localePath(locale, order.status === "delivered" ? `/s/${order.publicCode}` : `/commande/${order.id}`);
  const date = new Intl.DateTimeFormat(intlLocale(locale), { day: "numeric", month: "short" }).format(order.createdAt);
  return (
    <li>
      <Link href={href} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-sand transition active:scale-[0.99]">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sand/70 text-2xl" aria-hidden="true">
          {emoji}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-bold">{order.title || t.for(order.recipientName)}</span>
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <span className={`rounded-full px-2 py-0.5 font-bold ${status.tone}`}>{status.label}</span>
            <span className="text-muted">
              {order.recipientName} · {date}
            </span>
          </span>
        </span>
        <span className={`shrink-0 text-sm font-bold ${toPay ? "rounded-full bg-brand px-3 py-1.5 text-white" : "text-brand"}`}>
          {toPay ? t.finish : order.status === "delivered" ? t.listen : t.see}
        </span>
      </Link>
    </li>
  );
}
