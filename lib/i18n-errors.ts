import type { Locale } from "@/lib/i18n";

// Messages d'erreur montrés au client : écrits en français dans le code serveur,
// traduits ici quand la page est en anglais (le corps de la requête porte `locale`).

const EN: Record<string, string> = {
  "Requête invalide.": "Invalid request.",
  "Vérifie les informations du formulaire.": "Check the form details.",
  "Commande introuvable.": "Order not found.",
  "Tu as déjà utilisé tes 3 réécritures. Tu peux encore modifier le texte à la main.":
    "You’ve already used your 3 rewrites. You can still edit the text by hand.",
  "Tu as déjà utilisé tes 3 réécritures.": "You’ve already used your 3 rewrites.",
  "Ces paroles ne peuvent plus être modifiées.": "These lyrics can no longer be changed.",
  "Une erreur est survenue. Réessaie dans un instant.": "Something went wrong. Try again in a moment.",
  "On ne peut pas créer cette chanson. Modifie ton message et réessaie.": "We can’t create this song. Change your message and try again.",
  "Trop de demandes en ce moment. Réessaie dans une minute.": "Too many requests right now. Try again in a minute.",
  "La création des paroles prend trop de temps. Réessaie.": "Writing the lyrics is taking too long. Try again.",
  "Impossible de créer les paroles pour le moment. Réessaie dans un instant.": "We can’t write the lyrics right now. Try again in a moment.",
  "Les paroles n'ont pas pu être terminées. Réessaie.": "The lyrics couldn’t be finished. Try again.",
  "Cette commande est déjà payée. Ta chanson arrive !": "This order is already paid. Your song is on its way!",
  "Valide d'abord tes paroles.": "Approve your lyrics first.",
  "Indique ton numéro Mobile Money.": "Enter your Mobile Money number.",
  "Le paiement a été refusé. Vérifie le numéro et réessaie.": "The payment was refused. Check the number and try again.",
  "Le service de paiement ne répond pas. Réessaie dans un instant.": "The payment service isn’t responding. Try again in a moment.",
  "Le paiement par carte est indisponible pour le moment.": "Card payment is unavailable right now.",
  "Numéro Mobile Money camerounais attendu, par exemple 6XX XX XX XX":
    "A Cameroonian Mobile Money number is expected, for example 6XX XX XX XX",
  "Oups, le paiement n'a pas pu démarrer. Réessaie dans un instant.": "Oops, the payment couldn’t start. Try again in a moment.",
  "Le vocal n'a pas pu être envoyé. Réessaie.": "The voice note couldn’t be sent. Try again.",
  "Ton vocal est trop court. Parle quelques secondes puis réessaie.": "Your voice note is too short. Speak for a few seconds and try again.",
  "Ton vocal est trop long : 1 minute au maximum.": "Your voice note is too long: 1 minute maximum.",
  "Ce format de vocal n'est pas reconnu.": "This voice note format isn’t recognised.",
  "On n'a rien entendu. Parle plus près du téléphone et réessaie.": "We didn’t hear anything. Speak closer to the phone and try again.",
  "Le service est occupé. Réessaie dans un instant ou écris ton souvenir.": "The service is busy. Try again in a moment or type your memory.",
  "On n'a pas pu lire ton vocal. Écris ton souvenir à la place.": "We couldn’t read your voice note. Type your memory instead.",
  "La nouvelle création gratuite a déjà été utilisée. Écris-nous sur WhatsApp.":
    "The free new creation has already been used. Message us on WhatsApp.",
  "Photo trop lourde ou envoi coupé. Réessaie.": "Photo too heavy or upload cut off. Try again.",
  "Choisis une photo.": "Choose a photo.",
  "Photo trop lourde (6 Mo au plus).": "Photo too heavy (6 MB max).",
  "Chanson introuvable.": "Song not found.",
  "Seule la personne qui a commandé la chanson peut créer la vidéo.": "Only the person who ordered the song can create the video.",
  "Ça n'a pas marché. Réessaie dans un instant.": "That didn’t work. Try again in a moment.",
  "La vidéo se crée une fois la chanson prête.": "The video is made once the song is ready.",
  "Ta vidéo est déjà en préparation. Patiente une petite minute.": "Your video is already being made. Wait a minute.",
  "Tu as déjà créé 5 vidéos pour cette chanson. Écris-nous sur WhatsApp si besoin.":
    "You’ve already created 5 videos for this song. Message us on WhatsApp if needed.",
  "Cette photo est trop petite. Choisis-en une plus grande.": "This photo is too small. Choose a bigger one.",
  "On n'arrive pas à lire cette photo. Essaie avec une autre (JPG ou PNG).": "We can’t read this photo. Try another one (JPG or PNG).",
  "Ton prénom : 40 caractères au maximum.": "Your first name: 40 characters maximum.",
  "Numéro au format international, par exemple +237 6XX XX XX XX.": "Number in international format, for example +237 6XX XX XX XX.",
  "Ta session a expiré. Reconnecte-toi.": "Your session expired. Sign in again.",
  "Vérifie les informations.": "Check the details.",
  "C'est enregistré !": "Saved!",
};

/** Message d'erreur dans la langue de la page (inchangé s'il n'est pas dans la liste). */
export function translateError(message: string, locale: Locale): string {
  if (locale === "fr") return message;
  if (message.startsWith("Les paroles ne peuvent plus être modifiées")) return EN["Ces paroles ne peuvent plus être modifiées."];
  return EN[message] ?? message;
}

/** Lit `locale` dans un corps de requête déjà décodé (français par défaut). */
export function bodyLocale(body: unknown): Locale {
  return typeof body === "object" && body !== null && (body as { locale?: unknown }).locale === "en" ? "en" : "fr";
}
