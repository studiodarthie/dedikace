import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumb, CtaButton, FaqList, LinkCloud, Promises, Steps } from "@/components/SeoBlocks";
import { MEMORY_IDEAS } from "@/lib/occasions";
import { breadcrumbSchema, faqSchema, serviceSchema, SITE_URL } from "@/lib/seo";
import { OCCASION_PAGES, occasionPage, stylePage } from "@/lib/seo-pages";
import { getStyle, STYLE_TAGLINES } from "@/lib/styles";
import { currentPrices } from "@/lib/pricing";

// Une page par occasion, fabriquée au déploiement ; adresse inconnue → 404 (référencement : « chanson d'anniversaire avec prénom »…).
export function generateStaticParams() {
  return OCCASION_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/chanson/[slug]">): Promise<Metadata> {
  const page = occasionPage((await params).slug);
  if (!page) return {};
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: `/chanson/${page.slug}` },
    openGraph: { title: page.title, description: page.description, url: `/chanson/${page.slug}`, type: "website" },
  };
}

// Les adresses connues sont fabriquées au déploiement ; params est lu sous Suspense (Cache Components).
export default function OccasionLandingPage({ params }: PageProps<"/chanson/[slug]">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-sand/60" aria-label="Chargement" />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/chanson/[slug]">["params"] }) {
  const page = occasionPage((await params).slug);
  if (!page) notFound();
  const href = `/creer?occasion=${page.occasion}`;
  const url = `${SITE_URL}/chanson/${page.slug}`;

  return (
    <article className="flex flex-col gap-8 pt-2">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            serviceSchema(page.title, page.description, url, (await currentPrices()).momo),
            faqSchema(page.faq),
            breadcrumbSchema([
              { name: "Accueil", path: "/" },
              { name: `Chanson ${page.name.toLowerCase()}`, path: `/chanson/${page.slug}` },
            ]),
          ],
        }}
      />
      <Breadcrumb items={[{ href: "/", label: "Accueil" }, { label: page.name }]} />

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
        <Promises />
      </header>

      {page.example && (
        <section aria-labelledby="ecoute" className="flex flex-col gap-2 rounded-3xl bg-white p-4 ring-1 ring-sand">
          <h2 id="ecoute" className="text-xl font-extrabold">
            🎧 Écoute un exemple
          </h2>
          <p className="text-sm text-muted">
            « {page.example.title} » · {page.example.style}. Extrait d’1 min 20, la chanson complète dure environ 3 minutes.
          </p>
          <audio controls preload="none" src={`/examples/${page.example.file}`} className="w-full" />
        </section>
      )}

      <Steps />

      <section aria-labelledby="idees" className="flex flex-col gap-3">
        <h2 id="idees" className="text-xl font-extrabold">
          Des idées de souvenirs à raconter
        </h2>
        <ul className="flex flex-col gap-2">
          {MEMORY_IDEAS[page.occasion].map((idea) => (
            <li key={idea} className="rounded-2xl bg-sand/50 px-4 py-2 font-medium">
              « {idea} »
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="styles" className="flex flex-col gap-3">
        <h2 id="styles" className="text-xl font-extrabold">
          Les rythmes qu’on te conseille
        </h2>
        <ul className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
          {page.styles.map((id) => {
            const style = getStyle(id);
            if (!style) return null;
            return (
              <li key={id}>
                <a
                  href={stylePage(id) ? `/style/${id}` : href}
                  className="block h-full rounded-2xl bg-white p-3 ring-1 ring-sand active:bg-sand/40"
                >
                  <strong className="block">{style.label}</strong>
                  <span className="text-sm text-muted">{STYLE_TAGLINES[id]}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </section>

      <FaqList items={page.faq} />

      <CtaButton href={href}>{page.cta}</CtaButton>

      <LinkCloud
        title="Une chanson pour une autre occasion"
        links={OCCASION_PAGES.filter((p) => p.slug !== page.slug).map((p) => ({
          href: `/chanson/${p.slug}`,
          label: `${p.emoji} ${p.name}`,
        }))}
      />
    </article>
  );
}
