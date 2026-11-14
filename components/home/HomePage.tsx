import { existsSync } from "node:fs";
import path from "node:path";
import Link from "next/link";
import type { ReactNode } from "react";
import { ExamplePlayer, type ExampleTrack } from "@/components/ExamplePlayer";
import { formatXaf } from "@/lib/format";
import { JsonLd } from "@/components/JsonLd";
import { faqSchema, organization, serviceSchema, SITE_NAME, SITE_URL } from "@/lib/seo";
import { STYLE_PAGES } from "@/lib/seo-pages";
import { styleLabel } from "@/lib/styles";
import { currentPrices, type Prices } from "@/lib/pricing";
import { localePath, type Locale } from "@/lib/i18n";

// Accueil, en français (/) et en anglais (/en). Les textes des deux langues sont côte à côte.

// Exemples audio de l'accueil : extraits de 80 s créés par npm run make:examples (public/examples/).
const EXAMPLES: (Omit<ExampleTrack, "image"> & { en: Pick<ExampleTrack, "title" | "style" | "tags"> })[] = [
  {
    file: "anniversaire-makossa.mp3",
    title: "Maman Marie, joyeux anniversaire",
    style: "Makossa",
    emoji: "🎂",
    tags: ["Anniversaire", "Fête"],
    length: "1:20",
    scene: "anniversaire",
    cover: "from-gold to-brand",
    en: { title: "Mama Marie, happy birthday", style: "Makossa · sung in French", tags: ["Birthday", "Party"] },
  },
  {
    file: "mariage-jeff.mp3",
    title: "Jeff, c’est ton grand jour",
    style: "Afrobeats · voix féminine · chanson en anglais · refrain en français",
    emoji: "💍",
    tags: ["Mariage", "Fête"],
    length: "1:20",
    scene: "dot",
    cover: "from-brand to-gold",
    en: { title: "Jeff, c’est ton grand jour", style: "Afrobeats · female voice · sung in English · chorus in French", tags: ["Wedding", "Party"] },
  },
  {
    file: "hommage-acoustique.mp3",
    title: "Papa Emmanuel, ta lumière",
    style: "Acoustique",
    emoji: "🕊️",
    tags: ["Hommage", "Souvenir"],
    length: "1:20",
    scene: "hommage",
    cover: "from-muted to-ink",
    en: { title: "Papa Emmanuel, your light", style: "Acoustic · sung in French", tags: ["Tribute", "Memory"] },
  },
];

// Autocollants décoratifs. Ordinateur : sur les côtés de l'écran. Téléphone : collés aux coins du titre.
const STICKERS = [
  { emoji: "🎂", label: "Anniversaire", labelEn: "Birthday", desktop: "top-[22%] left-[8%] -rotate-6", mobile: "top-0 left-0 -rotate-6", narrow: true },
  { emoji: "💍", label: "Dot", labelEn: "Dowry", desktop: "top-[26%] right-[9%] rotate-6 [animation-delay:1.2s]", mobile: "top-0 right-1 rotate-6 [animation-delay:1.2s]", narrow: false },
  { emoji: "🎓", label: "Bac", labelEn: "Exams", desktop: "bottom-[30%] left-[12%] rotate-3 [animation-delay:2.4s]", mobile: "-bottom-1 left-3 rotate-3 [animation-delay:2.4s]", narrow: false },
  { emoji: "❤️", label: "Mariage", labelEn: "Wedding", desktop: "bottom-[38%] right-[6%] -rotate-3 [animation-delay:3.1s]", mobile: "-bottom-1 right-0 -rotate-3 [animation-delay:3.1s]", narrow: true },
];

function Sticker({ emoji, label, className }: { emoji: string; label: string; className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute z-10 flex animate-float items-center gap-1 rounded-xl bg-white px-2 py-1 text-xs font-extrabold shadow-md ring-1 shadow-ink/10 ring-sand motion-reduce:animate-none md:gap-1.5 md:rounded-2xl md:px-4 md:py-2 md:text-xl md:shadow-lg ${className}`}
    >
      <span className="text-sm md:text-2xl">{emoji}</span>
      {label}
    </span>
  );
}

const OCCASIONS: Record<Locale, string[]> = {
  fr: ["Anniversaire", "Mariage", "Dot", "Hommage", "Bac & BEPC", "Déclaration", "Excuses", "Encouragement"],
  en: ["Birthday", "Wedding", "Dowry", "Tribute", "Graduation", "Love", "Apology", "Encouragement"],
};

const OCCASION_CARDS: Record<Locale, { emoji: string; title: string; slug: string; text: string }[]> = {
  fr: [
    { emoji: "🎂", title: "Anniversaire", slug: "anniversaire", text: "Son prénom au refrain, toute la salle qui chante." },
    { emoji: "💍", title: "Dot", slug: "dot", text: "Pour la remise de la dot, devant toute la famille." },
    { emoji: "💒", title: "Mariage", slug: "mariage", text: "Pour l’entrée des mariés ou la première danse." },
    { emoji: "🎓", title: "Réussite", slug: "reussite-examen", text: "BEPC, Bac, diplôme : fête le travail accompli." },
    { emoji: "🕊️", title: "Hommage", slug: "hommage", text: "Un chant doux pour honorer ceux qui sont partis." },
    { emoji: "❤️", title: "Déclaration", slug: "declaration-amour", text: "Dis-lui enfin ce que tu ressens, en musique." },
    { emoji: "🤝", title: "Excuses", slug: "excuses", text: "Quand les mots seuls ne suffisent pas." },
    { emoji: "💪🏾", title: "Encouragement", slug: "encouragement", text: "Avant un examen, un nouveau départ ou un moment dur." },
  ],
  en: [
    { emoji: "🎂", title: "Birthday", slug: "anniversaire", text: "Their name in the chorus, the whole room singing." },
    { emoji: "💍", title: "Dowry", slug: "dot", text: "For the traditional wedding, in front of the whole family." },
    { emoji: "💒", title: "Wedding", slug: "mariage", text: "For the couple’s entrance or the first dance." },
    { emoji: "🎓", title: "Success", slug: "reussite-examen", text: "Exams, graduation: celebrate the hard work." },
    { emoji: "🕊️", title: "Tribute", slug: "hommage", text: "A gentle song to honour those who are gone." },
    { emoji: "❤️", title: "Love", slug: "declaration-amour", text: "Finally tell them how you feel, in music." },
    { emoji: "🤝", title: "Apology", slug: "excuses", text: "When words alone are not enough." },
    { emoji: "💪🏾", title: "Encouragement", slug: "encouragement", text: "Before an exam, a new start or a hard moment." },
  ],
};

const STEPS: Record<Locale, { icon: string; title: string; text: string }[]> = {
  fr: [
    { icon: "💬", title: "Raconte", text: "L'occasion, le prénom, 1 à 3 souvenirs. 2 minutes, pas de compte." },
    { icon: "✍️", title: "Valide les paroles", text: "Elles sont gratuites. Tu peux les modifier ou les faire réécrire." },
    { icon: "🎶", title: "Reçois ta chanson", text: "2 versions d'environ 3 minutes, à partager sur WhatsApp." },
  ],
  en: [
    { icon: "💬", title: "Tell us", text: "The occasion, the name, 1 to 3 memories. 2 minutes, no account." },
    { icon: "✍️", title: "Approve the lyrics", text: "They are free. You can edit them or have them rewritten." },
    { icon: "🎶", title: "Get your song", text: "2 versions of about 3 minutes, to share on WhatsApp." },
  ],
};

const faq = (prices: Prices, locale: Locale) =>
  locale === "en"
    ? [
        {
          q: "How much does it cost?",
          a: `${formatXaf(prices.momo, "en")} with MTN MoMo or Orange Money, ${formatXaf(prices.card, "en")} by bank card${prices.launchEndsEn ? ` (launch price, until ${prices.launchEndsEn})` : ""}. The lyrics are free: you only pay if you like them.`,
        },
        { q: "How long do I wait?", a: "About 2 minutes after payment. You get a link to open and share." },
        { q: "Do we really hear the name?", a: "Yes, that’s the whole point: the name is sung, with your memories. You read the lyrics before paying." },
        {
          q: "What if I don’t like the song?",
          a: "You get one free new creation, from your song’s page. Beyond that, message us on WhatsApp.",
        },
        { q: "I live abroad, does it work?", a: "Yes. From Nigeria, Europe, the US or Canada, you pay by bank card." },
        { q: "Can I share it?", a: "Yes, as much as you like: WhatsApp, status, social media. The song is for personal use." },
      ]
    : [
        {
          q: "Combien ça coûte ?",
          a: `${formatXaf(prices.momo)} par MTN MoMo ou Orange Money, ${formatXaf(prices.card)} par carte bancaire${prices.launchEnds ? ` (prix de lancement, jusqu’au ${prices.launchEnds})` : ""}. Les paroles sont gratuites : tu ne paies que si elles te plaisent.`,
        },
        { q: "Combien de temps faut-il attendre ?", a: "Environ 2 minutes après le paiement. Tu reçois un lien à ouvrir et à partager." },
        {
          q: "On entend vraiment le prénom ?",
          a: "Oui, c’est tout l’intérêt : le prénom est chanté, avec tes souvenirs. Tu relis les paroles avant de payer.",
        },
        {
          q: "Et si la chanson ne me plaît pas ?",
          a: "Tu as droit à une nouvelle création gratuite, depuis la page de ta chanson. Au-delà, écris-nous sur WhatsApp.",
        },
        { q: "Je suis à l'étranger, ça marche ?", a: "Oui. Depuis la France, la Belgique ou le Canada, tu paies par carte bancaire." },
        {
          q: "Je peux la partager ?",
          a: "Oui, autant que tu veux : WhatsApp, statut, réseaux sociaux. La chanson est pour un usage personnel.",
        },
      ];

// Textes de la page.
const T = {
  fr: {
    serviceName: "Chanson personnalisée avec ton prénom",
    serviceDescription:
      "Une chanson unique avec le prénom au refrain, sur des rythmes d'Afrique centrale, pour un anniversaire, un mariage, une dot ou un hommage.",
    launch: (price: string, end: string) => `🎉 Prix de lancement : ${price} jusqu’au ${end}`,
    h1a: "Ton nom dans",
    h1b: "une chanson.",
    lead: "Raconte tes souvenirs, on en fait une vraie chanson sur des rythmes de chez nous.",
    promises: ["✓ Paroles gratuites", "✓ Prête en 2 min", "✓ Refaite gratuitement 1 fois", "✓ MoMo · Orange Money · carte"],
    listen: "Écouter un exemple",
    create: "Créer ma chanson",
    createMine: "Créer la mienne",
    examplesKicker: "Écoute",
    examplesTitle: "Elles ont été créées avec",
    examplesText:
      "Des extraits d’1 min 20, faits exactement comme la tienne le sera : un prénom, des souvenirs, un rythme d’ici. Ta chanson complète dure environ 3 minutes.",
    examplesFallbackTitle: "Créées avec Dédikace",
    examplesSoon: "Les extraits arrivent bientôt.",
    forWhoKicker: "Pour qui ?",
    forWhoTitle: "Pour tous les moments qui comptent",
    rhythms: "Tous nos rythmes",
    stepsKicker: "Simple",
    stepsTitle: "Comment ça marche",
    faqKicker: "Questions",
    faqTitle: "Tout ce qu’il faut savoir",
    lastTitle: "Le cadeau dont on se souvient",
    lastText: "Les paroles sont gratuites. Tu ne paies que si elles te plaisent.",
  },
  en: {
    serviceName: "Personalised song with your name",
    serviceDescription:
      "A unique song with the name in the chorus, on Central African rhythms, for a birthday, a wedding, a traditional wedding or a tribute.",
    launch: (price: string, end: string) => `🎉 Launch price: ${price} until ${end}`,
    h1a: "Your name in",
    h1b: "a song.",
    lead: "Share your memories, we turn them into a real song on rhythms from home.",
    promises: ["✓ Free lyrics", "✓ Ready in 2 min", "✓ 1 free redo", "✓ MoMo · Orange Money · card"],
    listen: "Listen to an example",
    create: "Create my song",
    createMine: "Create mine",
    examplesKicker: "Listen",
    examplesTitle: "These were made with",
    examplesText:
      "1 min 20 excerpts, made exactly the way yours will be: a name, memories, a rhythm from home. Your full song lasts about 3 minutes.",
    examplesFallbackTitle: "Made with Dédikace",
    examplesSoon: "Examples are coming soon.",
    forWhoKicker: "For whom?",
    forWhoTitle: "For every moment that matters",
    rhythms: "All our rhythms",
    stepsKicker: "Simple",
    stepsTitle: "How it works",
    faqKicker: "Questions",
    faqTitle: "Everything you need to know",
    lastTitle: "The gift they will remember",
    lastText: "The lyrics are free. You only pay if you like them.",
  },
};

function hasExample(file: string) {
  return existsSync(path.join(process.cwd(), "public", "examples", file));
}

function CreateButton({ href, label, className = "" }: { href: string; label: string; className?: string }) {
  return (
    <Link
      href={href}
      className={`flex min-h-14 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f07a1a] to-brand px-5 py-2 text-lg leading-tight font-bold text-balance max-[359px]:text-base min-[400px]:px-8 text-white shadow-lg ring-4 shadow-brand/30 ring-brand/15 transition hover:shadow-xl active:scale-[0.98] ${className}`}
    >
      {label}
      <span aria-hidden="true">→</span>
    </Link>
  );
}

function SectionTitle({ id, kicker, title, text }: { id: string; kicker: string; title: string; text?: string }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-2 text-center">
      <p className="text-sm font-bold tracking-wide text-brand uppercase">{kicker}</p>
      <h2 id={id} className="scroll-mt-24 text-3xl leading-tight font-extrabold tracking-tight md:text-5xl">
        {title}
      </h2>
      {text && <p className="text-muted md:text-lg">{text}</p>}
    </div>
  );
}

/** Contenu centré et large sur ordinateur. */
function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-4 md:px-8 ${className}`}>{children}</div>;
}

export async function HomePage({ locale }: { locale: Locale }) {
  const prices = await currentPrices();
  const FAQ = faq(prices, locale);
  const t = T[locale];
  const en = locale === "en";
  const to = (p: string) => localePath(locale, p);
  const createHref = to("/creer");
  // Photo de pochette facultative : public/examples/<scene>.jpg (sinon, illustration animée).
  const tracks: ExampleTrack[] = EXAMPLES.filter((ex) => hasExample(ex.file)).map(({ en: english, ...ex }) => ({
    ...ex,
    ...(en ? english : {}),
    image: hasExample(`${ex.scene}.jpg`) ? `/examples/${ex.scene}.jpg` : undefined,
  }));

  return (
    <div className="flex flex-col gap-16 md:gap-32">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            organization,
            { "@type": "WebSite", "@id": `${SITE_URL}/#site`, name: SITE_NAME, url: SITE_URL, inLanguage: ["fr", "en"], publisher: { "@id": `${SITE_URL}/#organisation` } },
            serviceSchema(t.serviceName, t.serviceDescription, `${SITE_URL}${en ? "/en" : ""}`, prices.momo),
            faqSchema(FAQ),
          ],
        }}
      />
      {/* Accroche : tout l'écran sur ordinateur, compacte sur téléphone (le bandeau reste visible) */}
      <section className="relative flex flex-col md:min-h-[calc(100svh-4rem)]">
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(70%_45%_at_50%_45%,color-mix(in_oklab,var(--color-gold)_30%,transparent)_0%,transparent_70%),radial-gradient(40%_40%_at_85%_70%,color-mix(in_oklab,var(--color-brand)_14%,transparent)_0%,transparent_70%)]"
          aria-hidden="true"
        />
        {STICKERS.map((s) => (
          <Sticker key={s.label} emoji={s.emoji} label={en ? s.labelEn : s.label} className={`max-lg:hidden ${s.desktop}`} />
        ))}

        <Container className="flex flex-1 flex-col items-center justify-center gap-5 pt-6 pb-8 text-center md:gap-8 md:py-16">
          {prices.launchEnds ? (
            <p className="flex items-center gap-2 rounded-full bg-gold/25 px-3 py-1 text-xs font-bold text-brand-dark shadow-sm ring-1 ring-gold/40 md:px-4 md:py-1.5 md:text-sm">
              {t.launch(formatXaf(prices.momo, locale), (en ? prices.launchEndsEn : prices.launchEnds) ?? "")}
            </p>
          ) : (
            <p className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-bold tracking-wide text-muted uppercase shadow-sm ring-1 ring-sand md:px-4 md:py-1.5 md:text-xs">
              <span className="h-2 w-2 rounded-full bg-brand" aria-hidden="true" />
              Makossa · Bikutsi · Afrobeats<span className="max-[399px]:hidden"> · Rumba</span>
            </p>
          )}
          <div className="relative w-full py-10 lg:py-0">
            {STICKERS.map((s) => (
              <Sticker key={s.label} emoji={s.emoji} label={en ? s.labelEn : s.label} className={`lg:hidden ${s.narrow ? "" : "max-[399px]:hidden"} ${s.mobile}`} />
            ))}
            <h1 className="text-[clamp(2.1rem,11.5vw,3.4rem)] leading-[1.02] font-extrabold tracking-tight md:text-7xl lg:text-8xl">
              {t.h1a}
              <br />
              <span className="bg-gradient-to-r from-brand to-gold bg-clip-text text-transparent">{t.h1b}</span>
            </h1>
          </div>
          <p className="max-w-xl text-base text-muted md:text-2xl md:leading-relaxed">
            {t.lead}
          </p>
          <CreateButton href={createHref} label={t.create} className="w-full max-w-sm md:w-auto" />
          <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[13px] font-medium text-muted md:gap-x-5 md:text-base">
            {t.promises.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <a href="#exemples" className="flex items-center gap-2 font-semibold text-brand-dark md:text-lg">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs text-brand shadow-sm ring-1 ring-sand" aria-hidden="true">
              ▶
            </span>
            {t.listen}
          </a>
        </Container>

        {/* Bandeau d'occasions */}
        <div className="overflow-hidden border-y border-sand bg-white/70 py-3 md:py-4" aria-hidden="true">
          <div className="flex w-max animate-marquee gap-8 motion-reduce:animate-none">
            {[...OCCASIONS[locale], ...OCCASIONS[locale]].map((o, i) => (
              <span key={i} className="flex items-center gap-8 text-sm font-extrabold tracking-[0.2em] text-ink/70 uppercase md:text-xl">
                {o}
                <span className="text-brand">✦</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Exemples */}
      <Container>
        <section aria-labelledby="exemples">
          {tracks.length > 0 ? (
            <ExamplePlayer
              tracks={tracks}
              header={
                <div className="flex flex-col gap-3 text-center md:text-left">
                  <p className="text-sm font-bold tracking-wide text-brand uppercase">{t.examplesKicker}</p>
                  <h2 id="exemples" className="scroll-mt-24 text-4xl leading-[1.02] font-extrabold tracking-tight md:text-5xl lg:text-6xl">
                    {t.examplesTitle}{" "}
                    <span className="bg-gradient-to-r from-brand-dark via-brand to-gold bg-clip-text text-transparent">Dédikace</span>
                  </h2>
                  <p className="text-muted md:text-lg">{t.examplesText}</p>
                </div>
              }
              cta={<CreateButton href={createHref} label={t.createMine} className="w-full md:w-fit" />}
            />
          ) : (
            <div className="flex flex-col gap-6">
              <SectionTitle id="exemples" kicker={t.examplesKicker} title={t.examplesFallbackTitle} />
              <p className="rounded-2xl bg-sand/60 p-4 text-center text-muted">{t.examplesSoon}</p>
            </div>
          )}
        </section>
      </Container>

      {/* Occasions */}
      <Container>
        <section className="flex flex-col gap-8 md:gap-12" aria-labelledby="occasions">
          <SectionTitle id="occasions" kicker={t.forWhoKicker} title={t.forWhoTitle} />
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
            {OCCASION_CARDS[locale].map((o) => (
              <li key={o.title}>
                <Link
                  href={to(`/chanson/${o.slug}`)}
                  className="flex h-full flex-col gap-1 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-sand transition active:bg-sand/40 md:gap-2 md:p-7 md:hover:-translate-y-1 md:hover:shadow-md"
                >
                  <span className="text-3xl md:text-5xl" aria-hidden="true">
                    {o.emoji}
                  </span>
                  <span className="font-bold md:text-xl">{o.title}</span>
                  <span className="text-sm text-muted md:text-base">{o.text}</span>
                </Link>
              </li>
            ))}
          </ul>
          <nav aria-label={t.rhythms} className="flex flex-col items-center gap-3">
            <p className="font-bold">{t.rhythms}</p>
            <ul className="flex flex-wrap justify-center gap-2">
              {STYLE_PAGES.map((p) => (
                <li key={p.id}>
                  <Link href={to(`/style/${p.id}`)} className="block rounded-full bg-white px-3 py-1.5 text-sm font-semibold ring-1 ring-sand">
                    {styleLabel(p.id, locale)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </section>
      </Container>

      {/* Étapes */}
      <Container>
        <section className="flex flex-col gap-8 md:gap-12" aria-labelledby="etapes">
          <SectionTitle id="etapes" kicker={t.stepsKicker} title={t.stepsTitle} />
          <ol className="grid gap-3 md:grid-cols-3 md:gap-5">
            {STEPS[locale].map((step, i) => (
              <li key={step.title} className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-sand md:flex-col md:p-7">
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold/40 to-brand/20 text-2xl md:h-16 md:w-16 md:text-3xl"
                  aria-hidden="true"
                >
                  {step.icon}
                </span>
                <div>
                  <p className="font-bold md:text-xl">
                    {i + 1}. {step.title}
                  </p>
                  <p className="text-muted md:mt-1">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </Container>

      {/* Questions */}
      <Container className="max-w-3xl">
        <section className="flex flex-col gap-8 md:gap-12" aria-labelledby="faq">
          <SectionTitle id="faq" kicker={t.faqKicker} title={t.faqTitle} />
          <div className="flex flex-col gap-3">
            {FAQ.map((item) => (
              <details key={item.q} className="group rounded-2xl bg-white p-4 shadow-sm ring-1 ring-sand md:p-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold md:text-lg">
                  {item.q}
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sand text-brand transition group-open:rotate-45"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-2 text-muted md:text-lg">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </Container>

      {/* Dernier appel */}
      <Container className="max-w-5xl">
        <section className="relative flex flex-col items-center gap-4 overflow-hidden rounded-3xl bg-ink p-7 text-center text-cream md:gap-6 md:p-16">
          <div
            className="pointer-events-none absolute -top-20 -right-16 h-56 w-56 rounded-full bg-brand/40 blur-3xl md:h-96 md:w-96"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-gold/25 blur-3xl md:h-80 md:w-80"
            aria-hidden="true"
          />
          <p className="text-4xl md:text-6xl" aria-hidden="true">
            🎁
          </p>
          <h2 className="text-3xl leading-tight font-extrabold md:text-5xl">{t.lastTitle}</h2>
          <p className="text-cream/80 md:text-xl">{t.lastText}</p>
          <CreateButton href={createHref} label={t.create} className="relative w-full max-w-sm md:w-auto" />
        </section>
      </Container>
    </div>
  );
}
