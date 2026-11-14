import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumb, CtaButton, FaqList, LinkCloud, Promises, Steps } from "@/components/SeoBlocks";
import { breadcrumbSchema, faqSchema, serviceSchema, SITE_URL } from "@/lib/seo";
import { occasionPageFor, STYLE_PAGES, stylePage, type Faq } from "@/lib/seo-pages";
import { getStyle, STYLE_TAGLINES } from "@/lib/styles";
import { currentPrices } from "@/lib/pricing";

// Une page par style musical (« chanson makossa personnalisée »…), fabriquée au déploiement.
export function generateStaticParams() {
  return STYLE_PAGES.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: PageProps<"/style/[id]">): Promise<Metadata> {
  const page = stylePage((await params).id);
  if (!page) return {};
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: `/style/${page.id}` },
    openGraph: { title: page.title, description: page.description, url: `/style/${page.id}`, type: "website" },
  };
}

// Les adresses connues sont fabriquées au déploiement ; params est lu sous Suspense (Cache Components).
export default function StyleLandingPage({ params }: PageProps<"/style/[id]">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-sand/60" aria-label="Chargement" />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/style/[id]">["params"] }) {
  const page = stylePage((await params).id);
  const style = page && getStyle(page.id);
  if (!page || !style) notFound();
  const href = `/creer?style=${page.id}`;
  const faq: Faq[] = [
    {
      q: `On entend vraiment le prénom dans la chanson ${style.label.toLowerCase()} ?`,
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
  ];

  return (
    <article className="flex flex-col gap-8 pt-2">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            serviceSchema(page.title, page.description, `${SITE_URL}/style/${page.id}`, (await currentPrices()).momo),
            faqSchema(faq),
            breadcrumbSchema([
              { name: "Accueil", path: "/" },
              { name: style.label, path: `/style/${page.id}` },
            ]),
          ],
        }}
      />
      <Breadcrumb items={[{ href: "/", label: "Accueil" }, { label: style.label }]} />

      <header className="flex flex-col gap-4">
        <h1 className="text-4xl leading-[1.05] font-extrabold tracking-tight">{page.h1}</h1>
        <p className="text-lg text-muted">{page.intro}</p>
        <section aria-labelledby="extrait" className="flex flex-col gap-2 rounded-3xl bg-white p-4 ring-1 ring-sand">
          <h2 id="extrait" className="font-extrabold">
            🎧 Écoute le style {style.label} (15 s)
          </h2>
          <p className="text-sm text-muted">{STYLE_TAGLINES[page.id]}</p>
          <audio controls preload="none" src={`/styles/${page.id}.mp3`} className="w-full" />
        </section>
        <CtaButton href={href}>Créer ma chanson {style.label.toLowerCase()}</CtaButton>
        <Promises />
      </header>

      <Steps />

      <LinkCloud
        title={`Le ${style.label.toLowerCase()}, parfait pour…`}
        links={page.occasions.flatMap((id) => {
          const o = occasionPageFor(id);
          return o ? [{ href: `/chanson/${o.slug}`, label: `${o.emoji} ${o.name}` }] : [];
        })}
      />

      <FaqList items={faq} />

      <CtaButton href={href}>Créer ma chanson {style.label.toLowerCase()}</CtaButton>

      <LinkCloud
        title="Découvre les autres rythmes"
        links={STYLE_PAGES.filter((p) => p.id !== page.id).map((p) => ({ href: `/style/${p.id}`, label: getStyle(p.id)?.label ?? p.id }))}
      />
    </article>
  );
}
