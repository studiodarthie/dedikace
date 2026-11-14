// Occasions et langues des chansons (PRD §4, étapes 1 et 3).
export const OCCASIONS = [
  { id: "anniversaire", label: "Anniversaire", labelEn: "Birthday", emoji: "🎂" },
  { id: "mariage", label: "Mariage", labelEn: "Wedding", emoji: "💒" },
  { id: "dot", label: "Dot", labelEn: "Traditional wedding (dowry)", emoji: "💍" },
  { id: "deuil", label: "Deuil / hommage", labelEn: "Tribute / in memory", emoji: "🕊️" },
  { id: "reussite", label: "Réussite (BEPC, Bac, diplôme)", labelEn: "Success (exams, graduation)", emoji: "🎓" },
  { id: "amour", label: "Déclaration d'amour", labelEn: "Love declaration", emoji: "❤️" },
  { id: "excuses", label: "Excuses", labelEn: "Apology", emoji: "🙏🏾" },
  { id: "encouragement", label: "Encouragement", labelEn: "Encouragement", emoji: "💪🏾" },
] as const;

/** Langues proposées pour la chanson et pour le refrain. `sung` est envoyé au moteur musical (en anglais). */
export const LANGUAGES = [
  { id: "fr", label: "Français", labelEn: "French", sung: "French" },
  { id: "en", label: "Anglais", labelEn: "English", sung: "English" },
  { id: "pidgin", label: "Pidgin", labelEn: "Pidgin", sung: "Cameroonian Pidgin English" },
] as const;

export type OccasionId = (typeof OCCASIONS)[number]["id"];
export type LanguageId = (typeof LANGUAGES)[number]["id"];

export const OCCASION_IDS = OCCASIONS.map((o) => o.id) as [OccasionId, ...OccasionId[]];
export const LANGUAGE_IDS = LANGUAGES.map((l) => l.id) as [LanguageId, ...LanguageId[]];

export function occasionLabel(id: string, locale: "fr" | "en" = "fr"): string {
  const o = OCCASIONS.find((x) => x.id === id);
  return (locale === "en" ? o?.labelEn : o?.label) ?? id;
}

export function languageLabel(id: string, locale: "fr" | "en" = "fr"): string {
  const l = LANGUAGES.find((x) => x.id === id);
  return (locale === "en" ? l?.labelEn : l?.label) ?? id;
}

/** Nom de la langue en anglais pour le moteur musical (« French », « English »…). */
export function sungLanguage(id: string): string {
  return LANGUAGES.find((l) => l.id === id)?.sung ?? "French";
}

/**
 * Idées de souvenirs à toucher dans le formulaire (étape « La personne »).
 * Écrites à la 2ᵉ personne : la chanson s'adresse à la personne, et on évite les accords il/elle.
 */
export const MEMORY_IDEAS: Record<OccasionId, string[]> = {
  anniversaire: [
    "Tu mets l'ambiance partout où tu passes",
    "Tu prépares le meilleur ndolé du quartier",
    "Toujours là quand on a besoin de toi",
    "Ton rire s'entend depuis le portail",
    "Tu as tout donné pour la famille",
  ],
  mariage: [
    "Tu me fais rire chaque jour",
    "Ensemble, on a traversé les galères",
    "Je veux vieillir à tes côtés",
    "Nos deux familles réunies dans la joie",
    "Le jour de notre rencontre a tout changé",
  ],
  dot: [
    "Je viens honorer ta famille",
    "Nos deux familles se retrouvent enfin",
    "Tu es la fierté de tes parents",
    "Avec toi, je construis mon foyer",
    "Le village entier va danser",
  ],
  deuil: [
    "Tu nous as appris à rester debout",
    "Ta voix nous manque chaque jour",
    "Tes conseils nous guident encore",
    "Tu as porté toute la famille",
    "Ton sourire reste dans nos cœurs",
  ],
  reussite: [
    "Tu as révisé tard dans la nuit",
    "Toute la famille est fière de toi",
    "Après les efforts, la victoire",
    "Le quartier entier a fêté tes résultats",
    "Ce n'est que le début de ta réussite",
  ],
  amour: [
    "Ton sourire éclaire mes journées",
    "Je pense à toi du matin au soir",
    "Avec toi, je suis en paix",
    "Tu me manques dès que tu pars",
    "Notre premier rendez-vous, je m'en souviens encore",
  ],
  excuses: [
    "J'ai eu tort, je le reconnais",
    "Tu comptes trop pour moi",
    "Je veux réparer ce que j'ai cassé",
    "Nos fous rires me manquent",
    "Donne-moi une chance de me rattraper",
  ],
  encouragement: [
    "Tu as déjà surmonté pire",
    "On croit tous en toi",
    "Chaque jour, tu te relèves",
    "Ton courage m'inspire",
    "Le meilleur arrive bientôt",
  ],
};

/** Idées de souvenirs pour l'interface anglaise (même rôle que MEMORY_IDEAS). */
export const MEMORY_IDEAS_EN: Record<OccasionId, string[]> = {
  anniversaire: [
    "You bring the vibe wherever you go",
    "You cook the best ndolé in the neighbourhood",
    "Always there when we need you",
    "We can hear your laugh from the gate",
    "You gave everything for the family",
  ],
  mariage: [
    "You make me laugh every day",
    "Together we made it through the hard times",
    "I want to grow old by your side",
    "Our two families united in joy",
    "The day we met changed everything",
  ],
  dot: [
    "I come to honour your family",
    "Our two families finally meet",
    "You are your parents' pride",
    "With you, I am building my home",
    "The whole village will dance",
  ],
  deuil: [
    "You taught us to stand strong",
    "We miss your voice every day",
    "Your advice still guides us",
    "You carried the whole family",
    "Your smile lives on in our hearts",
  ],
  reussite: [
    "You studied late into the night",
    "The whole family is proud of you",
    "After the hard work, the victory",
    "The whole neighbourhood celebrated your results",
    "This is only the beginning of your success",
  ],
  amour: [
    "Your smile lights up my days",
    "I think of you from morning to night",
    "With you, I am at peace",
    "I miss you as soon as you leave",
    "I still remember our first date",
  ],
  excuses: [
    "I was wrong, I admit it",
    "You mean too much to me",
    "I want to fix what I broke",
    "I miss our laughs together",
    "Give me a chance to make it right",
  ],
  encouragement: [
    "You have already overcome worse",
    "We all believe in you",
    "Every day, you get back up",
    "Your courage inspires me",
    "The best is coming soon",
  ],
};
