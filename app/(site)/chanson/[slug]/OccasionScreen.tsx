import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumb, CtaButton, FaqList, LinkCloud, Promises, Steps } from "@/components/SeoBlocks";
import { MEMORY_IDEAS, MEMORY_IDEAS_EN } from "@/lib/occasions";
import { alternates, localePath, type Locale } from "@/lib/i18n";
import { localizeOccasionPage } from "@/lib/seo-pages-en";
import { breadcrumbSchema, faqSchema, serviceSchema, SITE_URL } from "@/lib/seo";
import { OCCASION_PAGES, occasionPage, stylePage } from "@/lib/seo-pages";
import { styleLabel, STYLE_TAGLINES, STYLE_TAGLINES_EN } from "@/lib/styles";
import { currentPrices } from "@/lib/pricing";

// Page de présentation d'une occasion, partagée par /chanson/[slug] et /en/chanson/[slug].

const T = {
  fr: {
    home: "Accueil",
    crumb: (n: string) => `Chanson ${n.toLowerCase()}`,
    listen: "🎧 Écoute un exemple",
    excerpt: (title: string, style: string) => `« ${title} » · ${style}. Extrait d’1 min 20, la chanson complète dure environ 3 minutes.`,
    ideas: "Des idées de souvenirs à raconter",
    quote: (s: string) => `« ${s} »`,
    styles: "Les rythmes qu’on te conseille",
    others: "Une chanson pour une autre occasion",
  },
  en: {
    home: "Home",
    crumb: (n: string) => `${n} song`,
    listen: "🎧 Listen to an example",
    excerpt: (title: string, style: string) => `“${title}” · ${style}. 1 min 20 excerpt, the full song lasts about 3 minutes.`,
    ideas: "Memory ideas to tell",
    quote: (s: string) => `“${s}”`,
    styles: "Rhythms we recommend",
    others: "A song for another occasion",
  },
};

export function occasionParams() {
  return OCCASION_PAGES.map((p) => ({ slug: p.slug }));
}

export async function occasionMetadata(slug: string, locale: Locale): Promise<Metadata> {
  const base = occasionPage(slug);
  if (!base) return {};
  const page = localizeOccasionPage(base, locale);
  const path = localePath(locale, `/chanson/${page.slug}`);
  return {
    title: page.title,
    description: page.description,
    alternates: alternates(locale, `/chanson/${page.slug}`),
    openGraph: {
      title: page.title,
      description: page.description,
      url: path,
      type: "website",
      locale: locale === "en" ? "en_GB" : "fr_CM",
      ...(locale === "en" && { images: ["/en/opengraph-image"] }),
    },
  };
}

// Les adresses connues sont fabriquées au déploiement ; params est lu sous Suspense (Cache Components).
export function OccasionScreen({ params, locale }: { params: Promise<{ slug: string }>; locale: Locale }) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-sand/60" aria-label="…" />}>
      <Content params={params} locale={locale} />
    </Suspense>
  );
}

async function Content({ params, locale }: { params: Promise<{ slug: string }>; locale: Locale }) {
  const base = occasionPage((await params).slug);
  if (!base) notFound();
  const page = localizeOccasionPage(base, locale);
  const t = T[locale];
  const en = locale === "en";
  const to = (p: string) => localePath(locale, p);
  const href = to(`/creer?occasion=${page.occasion}`);
  const url = `${SITE_URL}${to(`/chanson/${page.slug}`)}`;

  return (
    <article className="flex flex-col gap-8 pt-2">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            serviceSchema(page.title, page.description, url, (await currentPrices()).momo),
            faqSchema(page.faq),
            breadcrumbSchema([
              { name: t.home, path: to("/") },
              { name: t.crumb(page.name), path: to(`/chanson/${page.slug}`) },
            ]),
          ],
        }}
      />
      <Breadcrumb locale={locale} items={[{ href: to("/"), label: t.home }, { label: page.name }]} />

      <header className="flex flex-col gap-4">
        <p className="text-4xl" aria-hidden="true">
          {page.emoji}
        </p>
        <h1 className="text-4xl leading-[1.05] font-extrabold tracking-tight">{page.h1}</h1>
        {page.intro.map((p) => (
          <p key={p.slice(0, 20)} className="text-lg text-muted">
            {p}
          </p>
        ))}
        <CtaButton href={href}>{page.cta}</CtaButton>
        <Promises locale={locale} />
      </header>

      {page.example && (
        <section aria-labelledby="ecoute" className="flex flex-col gap-2 rounded-3xl bg-white p-4 ring-1 ring-sand">
          <h2 id="ecoute" className="text-xl font-extrabold">
            {t.listen}
          </h2>
          <p className="text-sm text-muted">{t.excerpt(page.example.title, page.example.style)}</p>
          <audio controls preload="none" src={`/examples/${page.example.file}`} className="w-full" />
        </section>
      )}

      <Steps locale={locale} />

      <section aria-labelledby="idees" className="flex flex-col gap-3">
        <h2 id="idees" className="text-xl font-extrabold">
          {t.ideas}
        </h2>
        <ul className="flex flex-col gap-2">
          {(en ? MEMORY_IDEAS_EN : MEMORY_IDEAS)[page.occasion].map((idea) => (
            <li key={idea} className="rounded-2xl bg-sand/50 px-4 py-2 font-medium">
              {t.quote(idea)}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="styles" className="flex flex-col gap-3">
        <h2 id="styles" className="text-xl font-extrabold">
          {t.styles}
        </h2>
        <ul className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
          {page.styles.map((id) => {
            return (
              <li key={id}>
                <a
                  href={stylePage(id) ? to(`/style/${id}`) : href}
                  className="block h-full rounded-2xl bg-white p-3 ring-1 ring-sand active:bg-sand/40"
                >
                  <strong className="block">{styleLabel(id, locale)}</strong>
                  <span className="text-sm text-muted">{(en ? STYLE_TAGLINES_EN : STYLE_TAGLINES)[id]}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </section>

      <FaqList items={page.faq} locale={locale} />

      <CtaButton href={href}>{page.cta}</CtaButton>

      <LinkCloud
        title={t.others}
        links={OCCASION_PAGES.filter((p) => p.slug !== page.slug).map((p) => ({
          href: to(`/chanson/${p.slug}`),
          label: `${p.emoji} ${en ? p.nameEn : p.name}`,
        }))}
      />
    </article>
  );
}
