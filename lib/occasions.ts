// Occasions et langues du refrain (PRD §4, étapes 1 et 3).
export const OCCASIONS = [
  { id: "anniversaire", label: "Anniversaire" },
  { id: "mariage", label: "Mariage" },
  { id: "dot", label: "Dot" },
  { id: "deuil", label: "Deuil / hommage" },
  { id: "reussite", label: "Réussite (BEPC, Bac, diplôme)" },
  { id: "amour", label: "Déclaration d'amour" },
  { id: "excuses", label: "Excuses" },
  { id: "encouragement", label: "Encouragement" },
] as const;

export const CHORUS_LANGUAGES = [
  { id: "fr", label: "Français" },
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
