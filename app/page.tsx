import { existsSync } from "node:fs";
import path from "node:path";
import Link from "next/link";
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

// Autocollants autour du titre (décoratifs).
const STICKERS = [
  { label: "🎂 Anniversaire", className: "-top-2 left-0 -rotate-6" },
  { label: "💍 Dot", className: "top-6 right-0 rotate-6 [animation-delay:1.2s]" },
  { label: "🎓 Bac", className: "bottom-2 left-2 rotate-3 [animation-delay:2.4s]" },
  { label: "❤️ Mariage", className: "-bottom-2 right-3 -rotate-3 [animation-delay:3.1s]" },
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
      className={`flex h-14 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand to-[#f07a1a] px-6 text-lg font-bold text-white shadow-lg shadow-brand/30 transition active:scale-[0.98] ${className}`}
    >
      {label}
      <span aria-hidden="true">→</span>
    </Link>
  );
}

function SectionTitle({ id, kicker, title, text }: { id: string; kicker: string; title: string; text?: string }) {
  return (
    <div className="flex flex-col gap-1 text-center">
      <p className="text-sm font-bold tracking-wide text-brand uppercase">{kicker}</p>
      <h2 id={id} className="text-3xl leading-tight font-extrabold tracking-tight">
        {title}
      </h2>
      {text && <p className="text-muted">{text}</p>}
    </div>
  );
}

export default function Home() {
  const tracks = EXAMPLES.filter((ex) => hasExample(ex.file));

  return (
    <div className="flex flex-col gap-14 pt-2">
      {/* Accroche */}
      <section className="relative flex flex-col items-center gap-5 pt-4 text-center">
        <div
          className="pointer-events-none absolute inset-x-0 -top-10 -z-10 h-80 bg-[radial-gradient(ellipse_at_center,var(--color-gold)_0%,transparent_65%)] opacity-25"
          aria-hidden="true"
        />
        <p className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold tracking-wide text-muted uppercase shadow-sm ring-1 ring-sand">
          <span className="h-2 w-2 rounded-full bg-brand" aria-hidden="true" />
          Makossa · Bikutsi · Afrobeats · Rumba
        </p>

        <div className="relative w-full px-2 py-10">
          {STICKERS.map((s) => (
            <span
              key={s.label}
              aria-hidden="true"
              className={`absolute animate-float rounded-xl bg-white px-2.5 py-1 text-sm font-bold shadow-md ring-1 ring-sand motion-reduce:animate-none ${s.className}`}
            >
              {s.label}
            </span>
          ))}
          <h1 className="text-[2.7rem] leading-[1.02] font-extrabold tracking-tight">
            Ton nom dans
            <br />
            <span className="bg-gradient-to-r from-brand to-gold bg-clip-text text-transparent">une chanson.</span>
          </h1>
        </div>

        <p className="max-w-sm text-lg text-muted">
          Raconte tes souvenirs, on en fait une vraie chanson sur des rythmes d&apos;Afrique centrale. Prête en quelques
          minutes.
        </p>
        <CreateButton className="w-full" />
        <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm font-medium text-muted">
          <li>✓ Paroles gratuites</li>
          <li>✓ Prête en 2 min</li>
          <li>✓ MoMo · Orange Money · carte</li>
        </ul>
      </section>

      {/* Bandeau d'occasions */}
      <div className="-mx-4 -rotate-1 overflow-hidden bg-ink py-3" aria-hidden="true">
        <div className="flex w-max animate-marquee gap-6 motion-reduce:animate-none">
          {[...OCCASIONS, ...OCCASIONS].map((o, i) => (
            <span key={i} className="flex items-center gap-6 text-sm font-extrabold tracking-widest text-cream uppercase">
              {o}
              <span className="text-gold">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* Exemples */}
      <section className="flex flex-col gap-6" aria-labelledby="exemples">
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
        <CreateButton label="Créer la mienne" />
      </section>

      {/* Occasions */}
      <section className="flex flex-col gap-6" aria-labelledby="occasions">
        <SectionTitle id="occasions" kicker="Pour qui ?" title="Pour tous les moments qui comptent" />
        <ul className="grid grid-cols-2 gap-3">
          {OCCASION_CARDS.map((o) => (
            <li key={o.title} className="flex flex-col gap-1 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-sand">
              <span className="text-3xl" aria-hidden="true">
                {o.emoji}
              </span>
              <p className="font-bold">{o.title}</p>
              <p className="text-sm text-muted">{o.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Étapes */}
      <section className="flex flex-col gap-6" aria-labelledby="etapes">
        <SectionTitle id="etapes" kicker="Simple" title="Comment ça marche" />
        <ol className="relative flex flex-col gap-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-sand">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold/40 to-brand/20 text-2xl"
                aria-hidden="true"
              >
                {step.icon}
              </span>
              <div>
                <p className="font-bold">
                  {i + 1}. {step.title}
                </p>
                <p className="text-muted">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Questions */}
      <section className="flex flex-col gap-6" aria-labelledby="faq">
        <SectionTitle id="faq" kicker="Questions" title="Tout ce qu’il faut savoir" />
        <div className="flex flex-col gap-3">
          {FAQ.map((item) => (
            <details key={item.q} className="group rounded-2xl bg-white p-4 shadow-sm ring-1 ring-sand">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold">
                {item.q}
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sand text-brand transition group-open:rotate-45"
                  aria-hidden="true"
                >
                  +
                </span>
              </summary>
              <p className="mt-2 text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Dernier appel */}
      <section className="relative flex flex-col items-center gap-4 overflow-hidden rounded-3xl bg-ink p-7 text-center text-cream">
        <div
          className="pointer-events-none absolute -top-20 -right-16 h-56 w-56 rounded-full bg-brand/40 blur-3xl"
          aria-hidden="true"
        />
        <p className="text-4xl" aria-hidden="true">
          🎁
        </p>
        <h2 className="text-3xl leading-tight font-extrabold">Le cadeau dont on se souvient</h2>
        <p className="text-cream/80">Les paroles sont gratuites. Tu ne paies que si elles te plaisent.</p>
        <CreateButton className="w-full" />
      </section>
    </div>
  );
}
