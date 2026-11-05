// Occasions et langues du refrain (PRD §4, étapes 1 et 3).
export const OCCASIONS = [
  { id: "anniversaire", label: "Anniversaire", emoji: "🎂" },
  { id: "mariage", label: "Mariage", emoji: "💒" },
  { id: "dot", label: "Dot", emoji: "💍" },
  { id: "deuil", label: "Deuil / hommage", emoji: "🕊️" },
  { id: "reussite", label: "Réussite (BEPC, Bac, diplôme)", emoji: "🎓" },
  { id: "amour", label: "Déclaration d'amour", emoji: "❤️" },
  { id: "excuses", label: "Excuses", emoji: "🙏🏾" },
  { id: "encouragement", label: "Encouragement", emoji: "💪🏾" },
] as const;

export const CHORUS_LANGUAGES = [
  { id: "fr", label: "Français" },
  { id: "en", label: "Anglais" },
  { id: "pidgin", label: "Pidgin" },
  { id: "lingala", label: "Lingala" },
] as const;

export type OccasionId = (typeof OCCASIONS)[number]["id"];
export type ChorusLanguageId = (typeof CHORUS_LANGUAGES)[number]["id"];

export const OCCASION_IDS = OCCASIONS.map((o) => o.id) as [OccasionId, ...OccasionId[]];
export const CHORUS_LANGUAGE_IDS = CHORUS_LANGUAGES.map((l) => l.id) as [ChorusLanguageId, ...ChorusLanguageId[]];

export function occasionLabel(id: string): string {
  return OCCASIONS.find((o) => o.id === id)?.label ?? id;
}

export function chorusLanguageLabel(id: string): string {
  return CHORUS_LANGUAGES.find((l) => l.id === id)?.label ?? id;
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
