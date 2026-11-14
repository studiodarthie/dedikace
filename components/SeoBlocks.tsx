import Link from "next/link";
import type { ReactNode } from "react";
import { formatXaf } from "@/lib/format";
import type { Faq } from "@/lib/seo-pages";
import { currentPrices } from "@/lib/pricing";
import type { Locale } from "@/lib/i18n";

// Briques communes des pages de présentation (/chanson/…, /style/…) : bouton, étapes, FAQ, liens.

export function CtaButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f07a1a] to-brand px-6 text-center text-lg font-bold text-white shadow-lg ring-4 shadow-brand/30 ring-brand/15 transition active:scale-[0.98]"
    >
      {children}
      <span aria-hidden="true">→</span>
    </Link>
  );
}

export async function Promises({ locale = "fr" }: { locale?: Locale }) {
  const prices = await currentPrices();
  const en = locale === "en";
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium text-muted">
      <li>{en ? "✓ Free lyrics" : "✓ Paroles gratuites"}</li>
      <li>{en ? "✓ Ready in 3 min" : "✓ Prête en 3 min"}</li>
      <li>✓ 2 versions</li>
      <li>
        ✓ {formatXaf(prices.momo, locale)} {en ? "with MoMo or Orange Money" : "par MoMo ou Orange Money"}
        {en
          ? prices.launchEndsEn && ` (launch price until ${prices.launchEndsEn})`
          : prices.launchEnds && ` (prix de lancement jusqu’au ${prices.launchEnds})`}
      </li>
    </ul>
  );
}

const STEPS: Record<Locale, { icon: string; title: string; text: string }[]> = {
  fr: [
    { icon: "💬", title: "Raconte", text: "Le prénom et 1 à 3 souvenirs. 2 minutes, sans compte." },
    { icon: "✍️", title: "Valide les paroles", text: "Elles sont gratuites : modifie-les ou fais-les réécrire." },
    { icon: "🎶", title: "Reçois ta chanson", text: "2 versions d’environ 3 minutes, à partager sur WhatsApp." },
  ],
  en: [
    { icon: "💬", title: "Tell us", text: "The name and 1 to 3 memories. 2 minutes, no account." },
    { icon: "✍️", title: "Approve the lyrics", text: "They are free: edit them or have them rewritten." },
    { icon: "🎶", title: "Get your song", text: "2 versions of about 3 minutes, to share on WhatsApp." },
  ],
};

export function Steps({ locale = "fr" }: { locale?: Locale }) {
  return (
    <section aria-labelledby="etapes" className="flex flex-col gap-3">
      <h2 id="etapes" className="text-xl font-extrabold">
        {locale === "en" ? "How it works" : "Comment ça marche"}
      </h2>
      <ol className="flex flex-col gap-2">
        {STEPS[locale].map((s, i) => (
          <li key={s.title} className="flex gap-3 rounded-2xl bg-white p-3 ring-1 ring-sand">
            <span className="text-2xl" aria-hidden="true">
              {s.icon}
            </span>
            <span>
              <strong className="block">
                {i + 1}. {s.title}
              </strong>
              <span className="text-sm text-muted">{s.text}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function FaqList({ items, locale = "fr" }: { items: Faq[]; locale?: Locale }) {
  return (
    <section aria-labelledby="questions" className="flex flex-col gap-3">
      <h2 id="questions" className="text-xl font-extrabold">
        {locale === "en" ? "Frequently asked questions" : "Questions fréquentes"}
      </h2>
      {items.map((f) => (
        <details key={f.q} className="group rounded-2xl bg-white p-4 ring-1 ring-sand">
          <summary className="cursor-pointer list-none font-bold marker:hidden">
            <span className="flex items-center justify-between gap-2">
              {f.q}
              <span className="text-brand transition group-open:rotate-45" aria-hidden="true">
                +
              </span>
            </span>
          </summary>
          <p className="mt-2 text-muted">{f.a}</p>
        </details>
      ))}
    </section>
  );
}

export function LinkCloud({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <nav aria-label={title} className="flex flex-col gap-2">
      <h2 className="text-lg font-extrabold">{title}</h2>
      <ul className="flex flex-wrap gap-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="block rounded-full bg-white px-3 py-1.5 text-sm font-semibold ring-1 ring-sand active:bg-sand/50">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Breadcrumb({ items, locale = "fr" }: { items: { href?: string; label: string }[]; locale?: Locale }) {
  return (
    <nav aria-label={locale === "en" ? "Breadcrumb" : "Fil d’Ariane"} className="text-sm text-muted">
      <ol className="flex flex-wrap gap-1">
        {items.map((item, i) => (
          <li key={item.label} className="flex gap-1">
            {i > 0 && <span aria-hidden="true">›</span>}
            {item.href ? (
              <Link href={item.href} className="underline">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
