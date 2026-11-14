import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumb, CtaButton, FaqList, LinkCloud, Promises, Steps } from "@/components/SeoBlocks";
import { breadcrumbSchema, faqSchema, serviceSchema, SITE_URL } from "@/lib/seo";
import { occasionPageFor, STYLE_PAGES, stylePage, type Faq } from "@/lib/seo-pages";
import { getStyle, styleLabel, STYLE_TAGLINES, STYLE_TAGLINES_EN } from "@/lib/styles";
import { alternates, localePath, type Locale } from "@/lib/i18n";
import { localizeStylePage } from "@/lib/seo-pages-en";
import { currentPrices } from "@/lib/pricing";
import { MissionCta } from "@/components/MissionCta";

// Page de présentation d'un style, partagée par /style/[id] et /en/style/[id].

const T = {
  fr: {
    home: "Accueil",
    faq: (label: string): Faq[] => [
      {
        q: `On entend vraiment le prénom dans la chanson ${label.toLowerCase()} ?`,
        a: "Oui : le prénom est chanté au refrain, et tes souvenirs dans les couplets. Tu relis les paroles avant de payer.",
      },
      {
        q: "Je peux choisir une voix d’homme ou de femme ?",
        a: "Oui, tu choisis la voix, la langue de la chanson et celle du refrain (français, anglais ou pidgin).",
      },
      {
        q: "Et si le résultat ne me plaît pas ?",
        a: "Tu reçois 2 versions, et tu as droit à une nouvelle création gratuite depuis la page de ta chanson.",
      },
    ],
    listen: (label: string) => `🎧 Écoute le style ${label} (15 s)`,
    create: (label: string) => `Créer ma chanson ${label.toLowerCase()}`,
    perfectFor: (label: string) => `Le ${label.toLowerCase()}, parfait pour…`,
    others: "Découvre les autres rythmes",
  },
  en: {
    home: "Home",
    faq: (label: string): Faq[] => [
      {
        q: `Do we really hear the name in the ${label} song?`,
        a: "Yes: the name is sung in the chorus, and your memories in the verses. You read the lyrics before paying.",
      },
      {
        q: "Can I choose a male or female voice?",
        a: "Yes, you choose the voice, the song’s language and the chorus language (English, French or pidgin).",
      },
      {
        q: "What if I don’t like the result?",
        a: "You get 2 versions, and one free new creation from your song’s page.",
      },
    ],
    listen: (label: string) => `🎧 Listen to the ${label} style (15 s)`,
    create: (label: string) => `Create my ${label} song`,
    perfectFor: (label: string) => `${label}, perfect for…`,
    others: "Discover the other rhythms",
  },
};

export function styleParams() {
  return STYLE_PAGES.map((p) => ({ id: p.id }));
}

export async function styleMetadata(id: string, locale: Locale): Promise<Metadata> {
  const base = stylePage(id);
  if (!base) return {};
  const page = localizeStylePage(base, locale);
  return {
    title: page.title,
    description: page.description,
    alternates: alternates(locale, `/style/${page.id}`),
    openGraph: {
      title: page.title,
      description: page.description,
      url: localePath(locale, `/style/${page.id}`),
      type: "website",
      locale: locale === "en" ? "en_GB" : "fr_CM",
      ...(locale === "en" && { images: ["/en/opengraph-image"] }),
    },
  };
}

// Les adresses connues sont fabriquées au déploiement ; params est lu sous Suspense (Cache Components).
export function StyleScreen({ params, locale }: { params: Promise<{ id: string }>; locale: Locale }) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-sand/60" aria-label="…" />}>
      <Content params={params} locale={locale} />
    </Suspense>
  );
}

async function Content({ params, locale }: { params: Promise<{ id: string }>; locale: Locale }) {
  const base = stylePage((await params).id);
  if (!base || !getStyle(base.id)) notFound();
  const page = localizeStylePage(base, locale);
  const t = T[locale];
  const en = locale === "en";
  const to = (p: string) => localePath(locale, p);
  const label = styleLabel(page.id, locale);
  const href = to(`/creer?style=${page.id}`);
  const faq = t.faq(label);

  return (
    <article className="flex flex-col gap-8 pt-2">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            serviceSchema(page.title, page.description, `${SITE_URL}${to(`/style/${page.id}`)}`, (await currentPrices()).momo),
            faqSchema(faq),
            breadcrumbSchema([
              { name: t.home, path: to("/") },
              { name: label, path: to(`/style/${page.id}`) },
            ]),
          ],
        }}
      />
      <Breadcrumb locale={locale} items={[{ href: to("/"), label: t.home }, { label }]} />

      <header className="flex flex-col gap-4">
        <h1 className="text-4xl leading-[1.05] font-extrabold tracking-tight">{page.h1}</h1>
        <p className="text-lg text-muted">{page.intro}</p>
        <section aria-labelledby="extrait" className="flex flex-col gap-2 rounded-3xl bg-white p-4 ring-1 ring-sand">
          <h2 id="extrait" className="font-extrabold">
            {t.listen(label)}
          </h2>
          <p className="text-sm text-muted">{(en ? STYLE_TAGLINES_EN : STYLE_TAGLINES)[page.id]}</p>
          <audio controls preload="none" src={`/styles/${page.id}.mp3`} className="w-full" />
        </section>
        <CtaButton href={href}>{t.create(label)}</CtaButton>
        <Promises locale={locale} />
      </header>

      <Steps locale={locale} />

      <LinkCloud
        title={t.perfectFor(label)}
        links={page.occasions.flatMap((id) => {
          const o = occasionPageFor(id);
          return o ? [{ href: to(`/chanson/${o.slug}`), label: `${o.emoji} ${en ? o.nameEn : o.name}` }] : [];
        })}
      />

      <FaqList items={faq} locale={locale} />

      <MissionCta locale={locale} href={href} button={t.create(label)} />

      <LinkCloud
        title={t.others}
        links={STYLE_PAGES.filter((p) => p.id !== page.id).map((p) => ({ href: to(`/style/${p.id}`), label: styleLabel(p.id, locale) }))}
      />
    </article>
  );
}
