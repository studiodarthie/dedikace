import { existsSync } from "node:fs";
import path from "node:path";
import Link from "next/link";
import type { ReactNode } from "react";
import { ExamplePlayer, type ExampleTrack } from "@/components/ExamplePlayer";
import { env } from "@/lib/env";
import { formatXaf } from "@/lib/format";

// Exemples audio de l'accueil : extraits de 80 s créés par npm run make:examples (public/examples/).
const EXAMPLES: Omit<ExampleTrack, "image">[] = [
  {
    file: "anniversaire-makossa.mp3",
    title: "Maman Mireille en fête",
    style: "Makossa",
    emoji: "🎂",
    tags: ["Anniversaire", "Fête"],
    length: "1:20",
    scene: "anniversaire",
    cover: "from-gold to-brand",
  },
  {
    file: "dot-bikutsi.mp3",
    title: "Ngono, ma reine de la dot",
    style: "Bikutsi",
    emoji: "💍",
    tags: ["Dot", "Mariage"],
    length: "1:20",
    scene: "dot",
    cover: "from-brand to-brand-dark",
  },
  {
    file: "bac-afrobeats.mp3",
    title: "Brenda la Docteur",
    style: "Afrobeats · refrain en pidgin",
    emoji: "🎓",
    tags: ["Réussite", "Bac"],
    length: "1:20",
    scene: "bac",
    cover: "from-leaf to-gold",
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
  },
];

// Autocollants décoratifs. Ordinateur : sur les côtés de l'écran. Téléphone : collés aux coins du titre.
const STICKERS = [
  { emoji: "🎂", label: "Anniversaire", desktop: "top-[22%] left-[8%] -rotate-6", mobile: "top-1 left-0 -rotate-6" },
  { emoji: "💍", label: "Dot", desktop: "top-[26%] right-[9%] rotate-6 [animation-delay:1.2s]", mobile: "top-1 right-1 rotate-6 [animation-delay:1.2s]" },
  { emoji: "🎓", label: "Bac", desktop: "bottom-[30%] left-[12%] rotate-3 [animation-delay:2.4s]", mobile: "-bottom-1 left-3 rotate-3 [animation-delay:2.4s]" },
  { emoji: "❤️", label: "Mariage", desktop: "bottom-[38%] right-[6%] -rotate-3 [animation-delay:3.1s]", mobile: "bottom-0 -right-1 -rotate-3 [animation-delay:3.1s]" },
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
  // Photo de pochette facultative : public/examples/<scene>.jpg (sinon, illustration animée).
  const tracks: ExampleTrack[] = EXAMPLES.filter((ex) => hasExample(ex.file)).map((ex) => ({
    ...ex,
    image: hasExample(`${ex.scene}.jpg`) ? `/examples/${ex.scene}.jpg` : undefined,
  }));

  return (
    <div className="flex flex-col gap-16 md:gap-32">
      {/* Accroche : tout l'écran sur ordinateur, compacte sur téléphone (le bandeau reste visible) */}
      <section className="relative flex flex-col md:min-h-[calc(100svh-4rem)]">
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(70%_45%_at_50%_45%,color-mix(in_oklab,var(--color-gold)_30%,transparent)_0%,transparent_70%),radial-gradient(40%_40%_at_85%_70%,color-mix(in_oklab,var(--color-brand)_14%,transparent)_0%,transparent_70%)]"
          aria-hidden="true"
        />
        {STICKERS.map((s) => (
          <Sticker key={s.label} emoji={s.emoji} label={s.label} className={`max-md:hidden ${s.desktop}`} />
        ))}

        <Container className="flex flex-1 flex-col items-center justify-center gap-5 pt-6 pb-8 text-center md:gap-8 md:py-16">
          <p className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-bold tracking-wide text-muted uppercase shadow-sm ring-1 ring-sand md:px-4 md:py-1.5 md:text-xs">
            <span className="h-2 w-2 rounded-full bg-brand" aria-hidden="true" />
            Makossa · Bikutsi · Afrobeats · Rumba
          </p>
          <div className="relative w-full py-10 md:py-0">
            {STICKERS.map((s) => (
              <Sticker key={s.label} emoji={s.emoji} label={s.label} className={`md:hidden ${s.mobile}`} />
            ))}
            <h1 className="text-[3.1rem] leading-[0.98] font-extrabold tracking-tight min-[400px]:text-[3.4rem] md:text-7xl lg:text-8xl">
              Ton nom dans
              <br />
              <span className="bg-gradient-to-r from-brand to-gold bg-clip-text text-transparent">une chanson.</span>
            </h1>
          </div>
          <p className="max-w-xl text-base text-muted md:text-2xl md:leading-relaxed">
            Raconte tes souvenirs, on en fait une vraie chanson sur des rythmes d&apos;Afrique centrale.
          </p>
          <CreateButton className="w-full max-w-sm md:w-auto" />
          <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[13px] font-medium text-muted md:gap-x-5 md:text-base">
            <li>✓ Paroles gratuites</li>
            <li>✓ Prête en 2 min</li>
            <li>✓ MoMo · Orange Money · carte</li>
          </ul>
          <a href="#exemples" className="flex items-center gap-2 font-semibold text-brand-dark md:text-lg">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs text-brand shadow-sm ring-1 ring-sand" aria-hidden="true">
              ▶
            </span>
            Écouter un exemple
          </a>
        </Container>

        {/* Bandeau d'occasions */}
        <div className="overflow-hidden border-y border-sand bg-white/70 py-3 md:py-4" aria-hidden="true">
          <div className="flex w-max animate-marquee gap-8 motion-reduce:animate-none">
            {[...OCCASIONS, ...OCCASIONS].map((o, i) => (
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
                  <p className="text-sm font-bold tracking-wide text-brand uppercase">Écoute</p>
                  <h2 id="exemples" className="scroll-mt-24 text-4xl leading-[1.02] font-extrabold tracking-tight md:text-5xl lg:text-6xl">
                    Elles ont été créées avec{" "}
                    <span className="bg-gradient-to-r from-brand-dark via-brand to-gold bg-clip-text text-transparent">Dédikace</span>
                  </h2>
                  <p className="text-muted md:text-lg">
                    Des chansons d’exemple, faites exactement comme la tienne le sera : un prénom, des souvenirs, un rythme d’ici.
                  </p>
                </div>
              }
              cta={<CreateButton label="Créer la mienne" className="w-full md:w-fit" />}
            />
          ) : (
            <div className="flex flex-col gap-6">
              <SectionTitle id="exemples" kicker="Écoute" title="Créées avec Dédikace" />
              <p className="rounded-2xl bg-sand/60 p-4 text-center text-muted">Les extraits arrivent bientôt.</p>
            </div>
          )}
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
