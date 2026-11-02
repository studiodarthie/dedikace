import { existsSync } from "node:fs";
import path from "node:path";
import Link from "next/link";
import { env } from "@/lib/env";
import { formatXaf } from "@/lib/format";

// Exemples audio de l'accueil : déposer les MP3 dans public/examples/ (Jour 0).
const EXAMPLES = [
  { file: "anniversaire-makossa.mp3", title: "Joyeux anniversaire Mireille", meta: "Anniversaire · Makossa" },
  { file: "dot-bikutsi.mp3", title: "Ngono, ma future épouse", meta: "Dot · Bikutsi" },
  { file: "bac-afrobeats.mp3", title: "Brenda, la future docteur", meta: "Réussite au Bac · Afrobeats" },
  { file: "hommage-acoustique.mp3", title: "Papa Emmanuel, ta lumière", meta: "Hommage · Acoustique" },
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

function CreateButton({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/creer"
      className={`flex h-14 items-center justify-center rounded-2xl bg-brand px-6 text-lg font-bold text-white shadow-md shadow-brand/30 transition active:scale-[0.98] ${className}`}
    >
      Créer ma chanson
    </Link>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col gap-12 pt-4">
      <section className="flex flex-col gap-5">
        <p className="w-fit rounded-full bg-sand px-3 py-1 text-sm font-semibold text-brand-dark">
          Makossa · Bikutsi · Rumba · Afrobeats…
        </p>
        <h1 className="text-[2.6rem] leading-[1.05] font-extrabold tracking-tight">
          Ton nom dans <span className="text-brand">une chanson.</span>
        </h1>
        <p className="text-lg text-muted">
          Anniversaire, mariage, dot, hommage, réussite… Offre une chanson unique, créée en quelques minutes sur des
          rythmes d&apos;Afrique centrale.
        </p>
        <CreateButton />
        <p className="text-center text-sm text-muted">
          Paroles gratuites · {formatXaf(env.PRICE_MOMO_XAF)} la chanson · MTN MoMo, Orange Money, carte
        </p>
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="exemples">
        <h2 id="exemples" className="text-2xl font-bold">
          Écoute des exemples
        </h2>
        <ul className="flex flex-col gap-3">
          {EXAMPLES.map((ex) => (
            <li key={ex.file} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-sand">
              <p className="font-semibold">{ex.title}</p>
              <p className="mb-3 text-sm text-muted">{ex.meta}</p>
              {hasExample(ex.file) ? (
                <audio controls preload="none" src={`/examples/${ex.file}`} className="w-full">
                  Ton navigateur ne peut pas lire cet extrait.
                </audio>
              ) : (
                <p className="rounded-xl bg-sand/60 px-3 py-2 text-sm text-muted">Extrait bientôt disponible</p>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="etapes">
        <h2 id="etapes" className="text-2xl font-bold">
          Comment ça marche
        </h2>
        <ol className="flex flex-col gap-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-sand">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sand text-2xl" aria-hidden="true">
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

      <section className="flex flex-col gap-3" aria-labelledby="faq">
        <h2 id="faq" className="text-2xl font-bold">
          Questions fréquentes
        </h2>
        {FAQ.map((item) => (
          <details key={item.q} className="group rounded-2xl bg-white p-4 shadow-sm ring-1 ring-sand">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold">
              {item.q}
              <span className="text-brand transition group-open:rotate-45" aria-hidden="true">
                +
              </span>
            </summary>
            <p className="mt-2 text-muted">{item.a}</p>
          </details>
        ))}
      </section>

      <section className="flex flex-col gap-4 rounded-3xl bg-ink p-6 text-cream">
        <h2 className="text-2xl font-bold">Prêt à faire plaisir ?</h2>
        <p className="text-cream/80">Les paroles sont gratuites. Tu décides ensuite.</p>
        <CreateButton />
      </section>
    </div>
  );
}
