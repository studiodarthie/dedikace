import { existsSync } from "node:fs";
import path from "node:path";
import Link from "next/link";
import type { ReactNode } from "react";
import { ExamplePlayer, type ExampleTrack } from "@/components/ExamplePlayer";
import { env } from "@/lib/env";
import { formatXaf } from "@/lib/format";

// Exemples audio de l'accueil : extraits de 80 s créés par npm run make:examples (public/examples/).
const EXAMPLES: ExampleTrack[] = [
  {
    file: "anniversaire-makossa.mp3",
    title: "Maman Mireille en fête",
    occasion: "Anniversaire",
    style: "Makossa",
    emoji: "🎂",
    cover: "from-gold to-brand",
  },
  {
    file: "dot-bikutsi.mp3",
    title: "Ngono, ma reine de la dot",
    occasion: "Dot",
    style: "Bikutsi",
    emoji: "💍",
    cover: "from-brand to-brand-dark",
  },
  {
    file: "bac-afrobeats.mp3",
    title: "Brenda la Docteur",
    occasion: "Réussite au Bac",
    style: "Afrobeats · refrain en pidgin",
    emoji: "🎓",
    cover: "from-leaf to-gold",
  },
  {
    file: "hommage-acoustique.mp3",
    title: "Papa Emmanuel, ta lumière",
    occasion: "Hommage",
    style: "Acoustique",
    emoji: "🕊️",
    cover: "from-muted to-ink",
  },
];

// Autocollants autour du titre (décoratifs) : près du titre sur téléphone, sur les côtés sur ordinateur.
const STICKERS = [
  { emoji: "🎂", label: "Anniversaire", className: "top-[3%] left-[3%] -rotate-6 md:top-[22%] md:left-[8%]" },
  { emoji: "💍", label: "Dot", className: "top-[7%] right-[3%] rotate-6 [animation-delay:1.2s] md:top-[26%] md:right-[9%]" },
  { emoji: "🎓", label: "Bac", className: "bottom-[30%] left-[1%] rotate-3 [animation-delay:2.4s] max-md:hidden md:bottom-[30%] md:left-[12%]" },
  { emoji: "❤️", label: "Mariage", className: "bottom-[34%] right-[2%] -rotate-3 [animation-delay:3.1s] max-md:hidden md:bottom-[38%] md:right-[6%]" },
];

const OCCASIONS = [
  "Anniversaire",
  "Mariage",
  "Dot",
  "Hommage",
  "Bac & BEPC",
  "Déclaration",
  "Excuses",
  "Encouragement",
];

const OCCASION_CARDS = [
  { emoji: "🎂", title: "Anniversaire", text: "Son prénom au refrain, toute la salle qui chante." },
  { emoji: "💍", title: "Dot & mariage", text: "Pour l’entrée des mariés ou la remise de la dot." },
  { emoji: "🎓", title: "Réussite", text: "BEPC, Bac, diplôme : fête le travail accompli." },
  { emoji: "🕊️", title: "Hommage", text: "Un chant doux pour honorer ceux qui sont partis." },
  { emoji: "❤️", title: "Déclaration", text: "Dis-lui enfin ce que tu ressens, en musique." },
  { emoji: "🤝", title: "Excuses", text: "Quand les mots seuls ne suffisent pas." },
];

const STEPS = [
  { icon: "💬", title: "Raconte", text: "L'occasion, le prénom, 1 à 3 souvenirs. 2 minutes, pas de compte." },
  { icon: "✍️", title: "Valide les paroles", text: "Elles sont gratuites. Tu peux les modifier ou les faire réécrire." },
  { icon: "🎶", title: "Reçois ta chanson", text: "2 versions d'environ 3 minutes, à partager sur WhatsApp." },
];

const FAQ = [
  {
    q: "Combien ça coûte ?",
    a: `${formatXaf(env.PRICE_MOMO_XAF)} par MTN MoMo ou Orange Money, ${formatXaf(env.PRICE_CARD_XAF)} par carte bancaire. Les paroles sont gratuites : tu ne paies que si elles te plaisent.`,
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

function hasExample(file: string) {
  return existsSync(path.join(process.cwd(), "public", "examples", file));
}

function CreateButton({ label = "Créer ma chanson", className = "" }: { label?: string; className?: string }) {
  return (
    <Link
      href="/creer"
      className={`flex h-14 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f07a1a] to-brand px-8 text-lg font-bold text-white shadow-lg ring-4 shadow-brand/30 ring-brand/15 transition hover:shadow-xl active:scale-[0.98] ${className}`}
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

export default function Home() {
  const tracks = EXAMPLES.filter((ex) => hasExample(ex.file));

  return (
    <div className="flex flex-col gap-20 md:gap-32">
      {/* Accroche : occupe tout l'écran, bandeau d'occasions en bas */}
      <section className="relative flex min-h-[calc(100svh-4rem)] flex-col">
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_40%,color-mix(in_oklab,var(--color-gold)_30%,transparent)_0%,transparent_70%),radial-gradient(40%_40%_at_85%_70%,color-mix(in_oklab,var(--color-brand)_14%,transparent)_0%,transparent_70%)]"
          aria-hidden="true"
        />
        {STICKERS.map((s) => (
          <span
            key={s.label}
            aria-hidden="true"
            className={`absolute z-10 flex animate-float items-center gap-1.5 rounded-2xl bg-white px-3 py-1.5 text-sm font-extrabold shadow-lg ring-1 shadow-ink/10 ring-sand motion-reduce:animate-none md:px-4 md:py-2 md:text-xl ${s.className}`}
          >
            <span className="text-lg md:text-2xl">{s.emoji}</span>
            {s.label}
          </span>
        ))}

        <Container className="flex flex-1 flex-col items-center justify-center gap-6 pt-24 pb-12 text-center md:gap-8 md:py-16">
          <p className="flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-bold tracking-wide text-muted uppercase shadow-sm ring-1 ring-sand">
            <span className="h-2 w-2 rounded-full bg-brand" aria-hidden="true" />
            Makossa · Bikutsi · Afrobeats · Rumba
          </p>
          <h1 className="text-[2.9rem] leading-[1] font-extrabold tracking-tight md:text-7xl lg:text-8xl">
            Ton nom dans
            <br />
            <span className="bg-gradient-to-r from-brand to-gold bg-clip-text text-transparent">une chanson.</span>
          </h1>
          <p className="max-w-xl text-lg text-muted md:text-2xl md:leading-relaxed">
            Anniversaire, dot, mariage, hommage… Raconte tes souvenirs, on en fait une vraie chanson sur des rythmes
            d&apos;Afrique centrale.
          </p>
          <CreateButton className="w-full max-w-sm md:w-auto" />
          <ul className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm font-medium text-muted md:text-base">
            <li>✓ Paroles gratuites</li>
            <li>✓ Prête en 2 min</li>
            <li>✓ MoMo · Orange Money · carte</li>
          </ul>
        </Container>

        {/* Bandeau d'occasions */}
        <div className="overflow-hidden border-y border-sand bg-white/70 py-4" aria-hidden="true">
          <div className="flex w-max animate-marquee gap-8 motion-reduce:animate-none">
            {[...OCCASIONS, ...OCCASIONS].map((o, i) => (
              <span key={i} className="flex items-center gap-8 text-base font-extrabold tracking-[0.2em] text-ink/70 uppercase md:text-xl">
                {o}
                <span className="text-brand">✦</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Exemples */}
      <Container>
        <section className="flex flex-col gap-8 md:gap-12" aria-labelledby="exemples">
          <SectionTitle
            id="exemples"
            kicker="Écoute"
            title="Créées avec Dédikace"
            text="Des chansons d’exemple, faites exactement comme la tienne le sera."
          />
          {tracks.length > 0 ? (
            <ExamplePlayer tracks={tracks} />
          ) : (
            <p className="rounded-2xl bg-sand/60 p-4 text-center text-muted">Les extraits arrivent bientôt.</p>
          )}
          <CreateButton label="Créer la mienne" className="w-full max-w-sm self-center md:w-auto" />
        </section>
      </Container>

      {/* Occasions */}
      <Container>
        <section className="flex flex-col gap-8 md:gap-12" aria-labelledby="occasions">
          <SectionTitle id="occasions" kicker="Pour qui ?" title="Pour tous les moments qui comptent" />
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
            {OCCASION_CARDS.map((o) => (
              <li
                key={o.title}
                className="flex flex-col gap-1 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-sand transition md:gap-2 md:p-7 md:hover:-translate-y-1 md:hover:shadow-md"
              >
                <span className="text-3xl md:text-5xl" aria-hidden="true">
                  {o.emoji}
                </span>
                <p className="font-bold md:text-xl">{o.title}</p>
                <p className="text-sm text-muted md:text-base">{o.text}</p>
              </li>
            ))}
          </ul>
        </section>
      </Container>

      {/* Étapes */}
      <Container>
        <section className="flex flex-col gap-8 md:gap-12" aria-labelledby="etapes">
          <SectionTitle id="etapes" kicker="Simple" title="Comment ça marche" />
          <ol className="grid gap-3 md:grid-cols-3 md:gap-5">
            {STEPS.map((step, i) => (
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
          <SectionTitle id="faq" kicker="Questions" title="Tout ce qu’il faut savoir" />
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
          <h2 className="text-3xl leading-tight font-extrabold md:text-5xl">Le cadeau dont on se souvient</h2>
          <p className="text-cream/80 md:text-xl">Les paroles sont gratuites. Tu ne paies que si elles te plaisent.</p>
          <CreateButton className="relative w-full max-w-sm md:w-auto" />
        </section>
      </Container>
    </div>
  );
}
