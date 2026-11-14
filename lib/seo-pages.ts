import type { OccasionId } from "@/lib/occasions";
import type { StyleId } from "@/lib/styles";

// Pages de présentation pour le référencement : une par occasion (/chanson/<slug>) et une par style
// (/style/<id>). Chaque page a un texte unique, pensé pour ce que les gens tapent dans Google
// (« chanson d'anniversaire avec prénom », « chanson pour la dot »…), et mène au formulaire pré-rempli.

export type Faq = { q: string; a: string };

export type OccasionPage = {
  slug: string;
  occasion: OccasionId;
  /** Titre de l'onglet et de Google (≈ 60 caractères). */
  title: string;
  /** Résumé affiché par Google (≈ 155 caractères). */
  description: string;
  h1: string;
  intro: string[];
  /** Nom court pour les liens (« Anniversaire »). */
  name: string;
  emoji: string;
  cta: string;
  styles: StyleId[];
  /** Extrait de l'accueil (public/examples/) à faire écouter, s'il y en a un pour cette occasion. */
  example?: { file: string; title: string; style: string };
  faq: Faq[];
};

export const OCCASION_PAGES: OccasionPage[] = [
  {
    slug: "anniversaire",
    occasion: "anniversaire",
    name: "Anniversaire",
    emoji: "🎂",
    title: "Chanson d'anniversaire personnalisée avec le prénom",
    description:
      "Offre une chanson d'anniversaire unique avec son prénom au refrain, sur un rythme makossa, afrobeats ou bikutsi. Paroles gratuites, prête en 2 minutes.",
    h1: "Une chanson d’anniversaire avec son prénom",
    intro: [
      "Le gâteau, les bougies… et une chanson rien que pour elle ou pour lui. Dédikace écrit et compose une vraie chanson d’anniversaire avec le prénom chanté au refrain et vos souvenirs dans les couplets.",
      "Maman, papa, ta chérie, ton meilleur ami ou ta petite sœur : raconte-nous 1 à 3 souvenirs, choisis le rythme, et toute la salle chantera son nom.",
    ],
    cta: "Créer sa chanson d’anniversaire",
    styles: ["makossa", "afrobeats", "bikutsi", "amapiano", "coupe-decale"],
    example: { file: "anniversaire-makossa.mp3", title: "Maman Marie, joyeux anniversaire", style: "Makossa" },
    faq: [
      {
        q: "Je peux la faire écouter pendant la fête ?",
        a: "Oui. Tu reçois un lien et les fichiers MP3 à télécharger : branche ton téléphone sur l’enceinte et lance-la au moment du gâteau.",
      },
      {
        q: "Et si c’est son anniversaire aujourd’hui ?",
        a: "Pas de souci : les paroles arrivent en quelques secondes, et la chanson environ 2 minutes après le paiement.",
      },
      {
        q: "Je peux ajouter des surnoms ?",
        a: "Oui, écris le prénom ou le surnom tel que tout le monde l’appelle : c’est lui qui sera chanté.",
      },
    ],
  },
  {
    slug: "mariage",
    occasion: "mariage",
    name: "Mariage",
    emoji: "💒",
    title: "Chanson de mariage personnalisée pour les mariés",
    description:
      "Une chanson de mariage avec les prénoms des mariés et votre histoire, pour l'entrée, la première danse ou un cadeau. Rumba, afro-zouk, makossa, gospel.",
    h1: "Une chanson de mariage avec vos prénoms",
    intro: [
      "Pour l’entrée des mariés, la première danse ou comme cadeau des amis : Dédikace crée une chanson qui raconte votre histoire, avec vos prénoms au refrain.",
      "La rencontre, les galères traversées ensemble, la promesse de vieillir côte à côte : tu choisis les souvenirs, on en fait une vraie chanson d’amour.",
    ],
    cta: "Créer notre chanson de mariage",
    styles: ["rumba", "zouklove", "afrozouk", "makossa", "gospel"],
    faq: [
      {
        q: "On peut mettre les deux prénoms ?",
        a: "Oui. Écris les deux prénoms (par exemple « Paul et Mireille ») : ils seront chantés ensemble au refrain.",
      },
      {
        q: "C’est possible pour un cadeau des témoins ?",
        a: "Bien sûr. Indique de la part de qui vient la chanson : on l’intègre dans les paroles.",
      },
      {
        q: "Combien de temps dure la chanson ?",
        a: "Environ 3 minutes, et tu reçois 2 versions différentes pour choisir celle que vous préférez.",
      },
    ],
  },
  {
    slug: "dot",
    occasion: "dot",
    name: "Dot",
    emoji: "💍",
    title: "Chanson pour la dot : un cadeau unique pour la famille",
    description:
      "Marque la cérémonie de la dot avec une chanson personnalisée qui honore la mariée et sa famille. Bikutsi, makossa, rumba, prête en 2 minutes.",
    h1: "Une chanson pour la dot, qui honore la famille",
    intro: [
      "La dot, c’est deux familles qui se rencontrent. Arrive avec une chanson qui honore ta future épouse, ses parents et tout le village, avec son prénom au refrain.",
      "Raconte comment vous vous êtes connus, ce que tu promets, ce que la famille représente pour toi : on en fait une chanson à danser pendant la cérémonie.",
    ],
    cta: "Créer ma chanson pour la dot",
    styles: ["bikutsi", "makossa", "rumba", "gospel", "epique"],
    faq: [
      {
        q: "La chanson peut citer la famille ?",
        a: "Oui : écris dans tes souvenirs ce que tu veux dire à ses parents ou à sa famille, on l’intègre aux couplets.",
      },
      {
        q: "Je peux la chanter en partie en pidgin ou en anglais ?",
        a: "Oui. Tu choisis la langue de la chanson et celle du refrain : français, anglais ou pidgin.",
      },
      {
        q: "Elle est prête combien de temps avant la cérémonie ?",
        a: "Environ 2 minutes après le paiement. Tu peux donc la faire même le jour J.",
      },
    ],
  },
  {
    slug: "hommage",
    occasion: "deuil",
    name: "Hommage",
    emoji: "🕊️",
    title: "Chanson d'hommage personnalisée pour un être cher",
    description:
      "Une chanson douce pour honorer un parent ou un ami disparu, avec son prénom et vos souvenirs. Pour un deuil, des obsèques ou un anniversaire de décès.",
    h1: "Une chanson d’hommage pour un être cher",
    intro: [
      "Quand les mots manquent, la musique aide à dire au revoir. Dédikace crée une chanson douce et digne, avec le prénom de la personne et les souvenirs qu’elle vous laisse.",
      "Pour les obsèques, une veillée, un anniversaire de décès ou simplement pour se souvenir : une chanson apaisée, jamais lourde, à partager avec la famille.",
    ],
    cta: "Créer une chanson d’hommage",
    styles: ["hommage", "gospel", "afrosoul", "rumba"],
    example: { file: "hommage-acoustique.mp3", title: "Papa Emmanuel, ta lumière", style: "Acoustique" },
    faq: [
      {
        q: "Le ton sera respectueux ?",
        a: "Oui. Pour un hommage, les paroles sont solennelles et apaisées, et tu les relis avant de payer.",
      },
      {
        q: "Je peux la diffuser pendant la cérémonie ?",
        a: "Oui, tu télécharges les fichiers MP3 et tu peux les diffuser librement en famille.",
      },
      {
        q: "Je peux parler de sa foi ?",
        a: "Oui, si c’est important pour la famille. Le style « Gospel africain » s’y prête bien.",
      },
    ],
  },
  {
    slug: "reussite-examen",
    occasion: "reussite",
    name: "Réussite",
    emoji: "🎓",
    title: "Chanson pour fêter une réussite : Bac, BEPC, diplôme",
    description:
      "Félicite un enfant, un frère ou une amie pour son Bac, son BEPC, son CAP ou son diplôme avec une chanson personnalisée à son nom. Afrobeats, épique, makossa.",
    h1: "Une chanson pour fêter sa réussite",
    intro: [
      "Le Bac, le BEPC, le CEP, un concours ou un diplôme : après tant d’efforts, ça se fête en musique. Dédikace crée une chanson de félicitations avec son prénom au refrain.",
      "Les nuits de révision, la fierté de la famille, le quartier qui célèbre les résultats : raconte-nous, on en fait une chanson qu’il ou elle n’oubliera pas.",
    ],
    cta: "Créer sa chanson de réussite",
    styles: ["afrobeats", "epique", "makossa", "amapiano", "coupe-decale"],
    faq: [
      {
        q: "Ça marche pour un diplôme universitaire ?",
        a: "Oui : licence, master, doctorat, concours d’entrée… précise-le dans les souvenirs.",
      },
      {
        q: "Je peux la partager sur son statut WhatsApp ?",
        a: "Oui. Sur la page de la chanson, tu peux même créer une vidéo de 30 secondes avec sa photo pour le statut.",
      },
      {
        q: "Je peux faire le refrain en pidgin ?",
        a: "Oui, tu choisis la langue du refrain : français, anglais ou pidgin.",
      },
    ],
  },
  {
    slug: "declaration-amour",
    occasion: "amour",
    name: "Déclaration d’amour",
    emoji: "❤️",
    title: "Chanson d'amour personnalisée pour sa chérie ou son chéri",
    description:
      "Déclare ta flamme avec une chanson d'amour à son prénom : Saint-Valentin, anniversaire de couple ou simple surprise. Afro-zouk, rumba, afrobeats.",
    h1: "Une chanson d’amour avec son prénom",
    intro: [
      "Dis-lui ce que tu ressens d’une façon qu’il ou elle n’oubliera jamais : une chanson d’amour avec son prénom au refrain et vos souvenirs à deux.",
      "Votre premier rendez-vous, son sourire, ce qui te manque quand elle part : pour la Saint-Valentin, un anniversaire de couple ou juste pour surprendre.",
    ],
    cta: "Créer ma chanson d’amour",
    styles: ["zouklove", "afrozouk", "rumba", "afrobeats", "afrosoul"],
    faq: [
      {
        q: "C’est une bonne idée pour la Saint-Valentin ?",
        a: "C’est même l’un des cadeaux les plus marquants : unique, personnel, et prêt en quelques minutes.",
      },
      {
        q: "Je peux rester discret sur certains détails ?",
        a: "Oui, tu écris seulement ce que tu veux, et tu relis les paroles avant de payer.",
      },
      {
        q: "Comment lui faire la surprise ?",
        a: "Sur la page de ta chanson, on te propose des messages prêts à envoyer sur WhatsApp, avec le lien.",
      },
    ],
  },
  {
    slug: "excuses",
    occasion: "excuses",
    name: "Excuses",
    emoji: "🙏🏾",
    title: "Chanson pour s'excuser : demande pardon en musique",
    description:
      "Tu as blessé quelqu'un qui compte ? Demande pardon avec une chanson personnalisée à son prénom, sincère et touchante. Paroles gratuites avant de payer.",
    h1: "Une chanson pour demander pardon",
    intro: [
      "Parfois, un simple message ne suffit pas. Une chanson sincère, avec son prénom et vos souvenirs, montre que tu as vraiment réfléchi et que tu tiens à la relation.",
      "Écris ce que tu regrettes et ce que tu veux réparer : on en fait une chanson touchante, jamais lourde, à lui envoyer sur WhatsApp.",
    ],
    cta: "Créer ma chanson d’excuses",
    styles: ["zouklove", "rumba", "afrozouk", "afrosoul"],
    faq: [
      {
        q: "Ça marche pour un ami ou un parent, pas seulement en couple ?",
        a: "Oui, pour toute personne qui compte : ami, frère, sœur, parent ou collègue.",
      },
      {
        q: "Le ton reste respectueux ?",
        a: "Oui. Les paroles sont sincères et douces, et tu peux les modifier avant de payer.",
      },
      {
        q: "Combien ça coûte ?",
        a: "Les paroles sont gratuites. Tu paies seulement si elles te plaisent, par Mobile Money ou carte.",
      },
    ],
  },
  {
    slug: "encouragement",
    occasion: "encouragement",
    name: "Encouragement",
    emoji: "💪🏾",
    title: "Chanson d'encouragement personnalisée pour donner de la force",
    description:
      "Avant un examen, une maladie, un nouveau travail ou un moment dur : offre une chanson d'encouragement à son prénom. Gospel, afro-soul, épique.",
    h1: "Une chanson pour lui donner de la force",
    intro: [
      "Un examen, une maladie, un nouveau départ, un moment difficile : rappelle-lui qu’on croit en elle ou en lui, avec une chanson à son prénom.",
      "Raconte ce qu’elle a déjà surmonté et ce que tu admires chez elle : on en fait une chanson inspirante à écouter dans les jours difficiles.",
    ],
    cta: "Créer une chanson d’encouragement",
    styles: ["afrosoul", "epique", "gospel", "afrobeats"],
    faq: [
      {
        q: "C’est adapté pour quelqu’un de malade ?",
        a: "Oui. Les paroles restent positives et pleines d’espoir, et tu les relis avant de payer.",
      },
      {
        q: "Elle pourra l’écouter souvent ?",
        a: "Oui, la chanson reste disponible 12 mois sur sa page, et tu peux télécharger les MP3.",
      },
      {
        q: "Quel style choisir ?",
        a: "« Afro-soul inspirant » et « Afro-pop épique » sont faits pour donner de la force ; le gospel pour la foi.",
      },
    ],
  },
];

export type StylePage = {
  id: StyleId;
  title: string;
  description: string;
  h1: string;
  intro: string;
  occasions: OccasionId[];
};

export const STYLE_PAGES: StylePage[] = [
  {
    id: "makossa",
    title: "Chanson makossa personnalisée avec ton prénom",
    description: "Une vraie chanson makossa avec ton prénom et tes souvenirs : guitares joyeuses, basse qui rebondit, ambiance Douala. Paroles gratuites.",
    h1: "Ta chanson makossa personnalisée",
    intro: "Le makossa, c’est la fête à la camerounaise : guitares claires, basse qui danse, chœurs qui répondent. Parfait pour un anniversaire ou un mariage.",
    occasions: ["anniversaire", "mariage", "dot"],
  },
  {
    id: "bikutsi",
    title: "Chanson bikutsi personnalisée pour faire danser",
    description: "Une chanson bikutsi à ton nom, rapide et dansante, pour une dot, un anniversaire ou une fête de famille. Prête en 2 minutes.",
    h1: "Ta chanson bikutsi personnalisée",
    intro: "Rythme rapide du Centre, guitare qui tourne en boucle, chœurs qui chantent avec toi : le bikutsi fait danser tout le monde, surtout pendant une dot.",
    occasions: ["dot", "anniversaire", "reussite"],
  },
  {
    id: "rumba",
    title: "Chanson rumba congolaise personnalisée",
    description: "Une rumba douce et élégante avec ton prénom, guitares qui chantent et final sebene. Idéale pour un mariage ou une déclaration d'amour.",
    h1: "Ta chanson rumba personnalisée",
    intro: "Voix douce, guitares entremêlées et final sebene qui fait monter l’ambiance : la rumba est faite pour l’amour, les mariages et les beaux souvenirs.",
    occasions: ["mariage", "amour", "excuses"],
  },
  {
    id: "zouklove",
    title: "Chanson zouk love personnalisée avec ton prénom",
    description: "Un zouk love doux et sensuel avec ton prénom au refrain : piano électrique, nappes chaudes et voix tendre. Pour une déclaration ou un mariage.",
    h1: "Ta chanson zouk love personnalisée",
    intro: "Groove lent qui balance, piano électrique, guitare légère et voix tout en douceur : le zouk love est fait pour dire « je t’aime ».",
    occasions: ["amour", "mariage", "excuses"],
  },
  {
    id: "gospel",
    title: "Chanson gospel africain personnalisée",
    description: "Un gospel africain avec chœur, piano et orgue, à ton prénom : pour louer, remercier, encourager ou rendre hommage.",
    h1: "Ta chanson gospel personnalisée",
    intro: "Chœur puissant, orgue, piano et mains qui frappent : le gospel africain porte la louange, l’espoir et la gratitude.",
    occasions: ["encouragement", "deuil", "mariage"],
  },
  {
    id: "afrobeats",
    title: "Chanson afrobeats personnalisée avec ton prénom",
    description: "Une chanson afrobeats moderne et groovy à ton nom, avec refrain en français, anglais ou pidgin. Prête en 2 minutes.",
    h1: "Ta chanson afrobeats personnalisée",
    intro: "Groove moderne, percussions chaloupées et basse profonde : l’afrobeats plaît à toutes les générations, en français, en anglais ou en pidgin.",
    occasions: ["anniversaire", "reussite", "amour"],
  },
  {
    id: "amapiano",
    title: "Chanson amapiano personnalisée, le son du moment",
    description: "Une chanson amapiano à ton prénom : log drum, piano jazzy et ambiance tendance. Pour une fête, un anniversaire ou une surprise.",
    h1: "Ta chanson amapiano personnalisée",
    intro: "Log drum qui gronde, accords de piano jazzy, ambiance détendue : l’amapiano, c’est le son tendance pour une fête ou une surprise.",
    occasions: ["anniversaire", "amour", "reussite"],
  },
  {
    id: "afrozouk",
    title: "Chanson afro-zouk romantique personnalisée",
    description: "Une chanson afro-zouk douce et romantique avec son prénom, pour déclarer ta flamme ou fêter votre couple.",
    h1: "Ta chanson afro-zouk personnalisée",
    intro: "Synthés doux, guitare caressante, rythme qui berce : l’afro-zouk est fait pour les amoureux et les déclarations.",
    occasions: ["amour", "mariage", "excuses"],
  },
  {
    id: "coupe-decale",
    title: "Chanson coupé-décalé personnalisée pour la fête",
    description: "Une chanson coupé-décalé festive à ton nom, ambiance boîte et chœurs qui répondent. Idéale pour un anniversaire.",
    h1: "Ta chanson coupé-décalé personnalisée",
    intro: "Percussions qui foncent, synthés brillants et chœurs qui répondent : le coupé-décalé transforme n’importe quelle soirée en fête.",
    occasions: ["anniversaire", "reussite"],
  },
  {
    id: "afrosoul",
    title: "Chanson afro-soul inspirante personnalisée",
    description: "Une chanson afro-soul inspirante, piano et cordes, avec ton prénom : pour encourager, remercier ou émouvoir. Qualité studio.",
    h1: "Ta chanson afro-soul inspirante",
    intro: "Grand piano, orchestre de cordes, harmonies soul et refrain qui monte : une chanson pleine d’émotion, pour donner de la force ou dire merci.",
    occasions: ["encouragement", "mariage", "deuil"],
  },
  {
    id: "epique",
    title: "Chanson afro-pop épique personnalisée",
    description: "Un hymne afro-pop épique à ton nom, grosses percussions et cordes, comme au cinéma. Parfait pour fêter une réussite.",
    h1: "Ta chanson afro-pop épique",
    intro: "Percussions de stade, guitares lumineuses, cordes et grand refrain à chanter ensemble : un hymne pour célébrer une victoire.",
    occasions: ["reussite", "encouragement", "anniversaire"],
  },
  {
    id: "hommage",
    title: "Chanson hommage acoustique personnalisée",
    description: "Une ballade acoustique douce et digne, avec le prénom d'un être cher, pour un deuil ou un souvenir. Paroles relues avant paiement.",
    h1: "Ta chanson d’hommage acoustique",
    intro: "Guitare acoustique, piano doux et cordes chaleureuses : une ballade apaisée pour honorer ceux qui sont partis.",
    occasions: ["deuil", "excuses", "encouragement"],
  },
];

export function occasionPage(slug: string) {
  return OCCASION_PAGES.find((p) => p.slug === slug);
}

export function occasionPageFor(id: OccasionId) {
  return OCCASION_PAGES.find((p) => p.occasion === id);
}

export function stylePage(id: string) {
  return STYLE_PAGES.find((p) => p.id === id);
}
