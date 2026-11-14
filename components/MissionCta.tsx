import Link from "next/link";
import { localePath, type Locale } from "@/lib/i18n";

// Bloc de fin de page : rappelle la mission de Dédikace et mène au formulaire.
// À mettre sous les textes et descriptions (pages légales, occasions, styles, chanson, 404).

const T = {
  fr: {
    title: "Prêt à faire chanter son prénom ?",
    text: "Raconte tes souvenirs, on en fait une belle chanson sur des rythmes de chez nous. Les paroles sont gratuites.",
    button: "Créer ma chanson",
  },
  en: {
    title: "Ready to make their name sing?",
    text: "Share your memories, we turn them into a beautiful song on rhythms from home. The lyrics are free.",
    button: "Create my song",
  },
};

export function MissionCta({
  locale = "fr",
  href,
  title,
  text,
  button,
  className = "",
}: {
  locale?: Locale;
  /** Par défaut /creer (ou /en/creer) ; une page occasion ou style peut pré-remplir le formulaire. */
  href?: string;
  title?: string;
  text?: string;
  button?: string;
  className?: string;
}) {
  const t = T[locale];
  return (
    <section className={`flex flex-col items-center gap-4 border-t border-sand py-10 text-center md:gap-5 md:py-14 ${className}`}>
      <h2 className="!mt-0 !text-2xl leading-tight !font-extrabold tracking-tight text-balance md:!text-3xl">{title ?? t.title}</h2>
      <p className="max-w-md text-muted text-balance md:text-lg">{text ?? t.text}</p>
      <Link
        href={href ?? localePath(locale, "/creer")}
        className="mt-2 flex min-h-14 w-full max-w-sm items-center justify-center gap-3 rounded-full bg-ink px-8 py-3 text-lg font-bold text-cream shadow-lg shadow-ink/20 transition hover:bg-ink/90 active:scale-[0.98] md:w-auto"
      >
        {button ?? t.button}
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </Link>
    </section>
  );
}
