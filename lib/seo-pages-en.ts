import type { Locale } from "@/lib/i18n";
import type { Faq, OccasionPage, StylePage } from "@/lib/seo-pages";

// Version anglaise des pages de présentation (/en/chanson/…, /en/style/…), écrite pour ce que les gens tapent
// en anglais (« personalised birthday song with name »…). Les champs absents gardent la version française.

type OccasionText = Pick<OccasionPage, "title" | "description" | "h1" | "intro" | "cta"> & {
  faq: Faq[];
  example?: { title: string; style: string };
};

const OCCASIONS_EN: Record<string, OccasionText> = {
  anniversaire: {
    title: "Personalised birthday song with their name",
    description:
      "Give a unique birthday song with their name in the chorus, on a makossa, afrobeats or bikutsi rhythm. Free lyrics, ready in 2 minutes.",
    h1: "A birthday song with their name",
    intro: [
      "The cake, the candles… and a song just for them. Dédikace writes and composes a real birthday song with the name sung in the chorus and your memories in the verses.",
      "Mum, dad, your darling, your best friend or your little sister: tell us 1 to 3 memories, pick the rhythm, and the whole room will sing their name.",
    ],
    cta: "Create their birthday song",
    example: { title: "Mama Marie, happy birthday", style: "Makossa, sung in French" },
    faq: [
      {
        q: "Can I play it during the party?",
        a: "Yes. You get a link and MP3 files to download: plug your phone into the speaker and play it when the cake comes out.",
      },
      { q: "What if their birthday is today?", a: "No problem: the lyrics arrive in seconds, and the song about 2 minutes after payment." },
      { q: "Can I use nicknames?", a: "Yes, write the name or nickname everyone uses: that’s what will be sung." },
    ],
  },
  mariage: {
    title: "Personalised wedding song for the couple",
    description:
      "A wedding song with the couple’s names and your story, for the entrance, the first dance or as a gift. Rumba, zouk love, makossa, gospel.",
    h1: "A wedding song with your names",
    intro: [
      "For the couple’s entrance, the first dance or as a gift from friends: Dédikace creates a song that tells your story, with your names in the chorus.",
      "How you met, the hard times you went through together, the promise to grow old side by side: you choose the memories, we turn them into a real love song.",
    ],
    cta: "Create our wedding song",
    example: { title: "Jeff, c’est ton grand jour", style: "Afrobeats, verses in English, chorus in French" },
    faq: [
      { q: "Can we put both names?", a: "Yes. Write both names (for example “Paul and Mireille”): they will be sung together in the chorus." },
      { q: "Can it be a gift from the best man or bridesmaids?", a: "Of course. Say who the song is from: we include it in the lyrics." },
      { q: "How long is the song?", a: "About 3 minutes, and you get 2 different versions to pick your favourite." },
    ],
  },
  dot: {
    title: "Song for a traditional wedding (dowry ceremony)",
    description:
      "Mark the dowry ceremony with a personalised song that honours the bride and her family. Bikutsi, makossa, rumba, ready in 2 minutes.",
    h1: "A song for the dowry ceremony that honours the family",
    intro: [
      "The dowry is two families coming together. Arrive with a song that honours your bride-to-be, her parents and the whole village, with her name in the chorus.",
      "Tell us how you met, what you promise, what the family means to you: we turn it into a song to dance to during the ceremony.",
    ],
    cta: "Create my dowry song",
    faq: [
      { q: "Can the song mention the family?", a: "Yes: write in your memories what you want to say to her parents or family, we put it in the verses." },
      { q: "Can part of it be in pidgin or French?", a: "Yes. You choose the song’s language and the chorus language: English, French or pidgin." },
      { q: "How long before the ceremony is it ready?", a: "About 2 minutes after payment. You can even make it on the day." },
    ],
  },
  hommage: {
    title: "Personalised tribute song for a loved one",
    description:
      "A gentle song to honour a parent or friend who passed away, with their name and your memories. For a funeral, a wake or a memorial.",
    h1: "A tribute song for a loved one",
    intro: [
      "When words fail, music helps say goodbye. Dédikace creates a gentle, dignified song with the person’s name and the memories they leave you.",
      "For the funeral, a wake, a memorial or simply to remember: a peaceful song, never heavy, to share with the family.",
    ],
    cta: "Create a tribute song",
    example: { title: "Papa Emmanuel, your light", style: "Acoustic, sung in French" },
    faq: [
      { q: "Will the tone be respectful?", a: "Yes. For a tribute, the lyrics are solemn and peaceful, and you read them before paying." },
      { q: "Can I play it during the ceremony?", a: "Yes, you download the MP3 files and can play them freely with the family." },
      { q: "Can I mention their faith?", a: "Yes, if it matters to the family. The “African gospel” style fits well." },
    ],
  },
  "reussite-examen": {
    title: "Song to celebrate success: exams, graduation, diploma",
    description:
      "Congratulate a child, a brother or a friend on their exams, GCE, graduation or diploma with a personalised song with their name. Afrobeats, epic, makossa.",
    h1: "A song to celebrate their success",
    intro: [
      "GCE, BEPC, Bac, an entrance exam or a degree: after so much effort, it deserves music. Dédikace creates a congratulations song with their name in the chorus.",
      "The late-night revision, the family’s pride, the neighbourhood celebrating the results: tell us, we turn it into a song they won’t forget.",
    ],
    cta: "Create their success song",
    faq: [
      { q: "Does it work for a university degree?", a: "Yes: bachelor’s, master’s, PhD, entrance exam… mention it in the memories." },
      { q: "Can I share it on their WhatsApp status?", a: "Yes. On the song page, you can even create a 30-second video with their photo for the status." },
      { q: "Can the chorus be in pidgin?", a: "Yes, you choose the chorus language: English, French or pidgin." },
    ],
  },
  "declaration-amour": {
    title: "Personalised love song for your girlfriend or boyfriend",
    description:
      "Declare your love with a love song with their name: Valentine’s Day, couple anniversary or just a surprise. Zouk love, rumba, afrobeats.",
    h1: "A love song with their name",
    intro: [
      "Tell them how you feel in a way they will never forget: a love song with their name in the chorus and your memories together.",
      "Your first date, their smile, what you miss when they leave: for Valentine’s Day, a couple anniversary or just to surprise them.",
    ],
    cta: "Create my love song",
    faq: [
      { q: "Is it a good idea for Valentine’s Day?", a: "It’s one of the most memorable gifts: unique, personal, and ready in a few minutes." },
      { q: "Can I keep some details private?", a: "Yes, you only write what you want, and you read the lyrics before paying." },
      { q: "How do I surprise them?", a: "On your song page, we suggest ready-to-send WhatsApp messages with the link." },
    ],
  },
  excuses: {
    title: "Apology song: say sorry with music",
    description:
      "Hurt someone who matters? Say sorry with a sincere, touching personalised song with their name. Free lyrics before you pay.",
    h1: "A song to say sorry",
    intro: [
      "Sometimes a simple message isn’t enough. A sincere song, with their name and your memories, shows you really thought about it and care about the relationship.",
      "Write what you regret and what you want to fix: we turn it into a touching song, never heavy, to send them on WhatsApp.",
    ],
    cta: "Create my apology song",
    faq: [
      { q: "Does it work for a friend or a parent, not just a partner?", a: "Yes, for anyone who matters: friend, brother, sister, parent or colleague." },
      { q: "Does the tone stay respectful?", a: "Yes. The lyrics are sincere and gentle, and you can edit them before paying." },
      { q: "How much does it cost?", a: "The lyrics are free. You only pay if you like them, by Mobile Money or card." },
    ],
  },
  encouragement: {
    title: "Personalised encouragement song to give strength",
    description:
      "Before an exam, an illness, a new job or a hard time: give an encouragement song with their name. Gospel, Afro-soul, epic.",
    h1: "A song to give them strength",
    intro: [
      "An exam, an illness, a new start, a hard moment: remind them that people believe in them, with a song with their name.",
      "Tell us what they have already overcome and what you admire in them: we turn it into an inspiring song to listen to on hard days.",
    ],
    cta: "Create an encouragement song",
    faq: [
      { q: "Is it suitable for someone who is ill?", a: "Yes. The lyrics stay positive and full of hope, and you read them before paying." },
      { q: "Can they listen to it often?", a: "Yes, the song stays available for 12 months on its page, and you can download the MP3s." },
      { q: "Which style should I choose?", a: "“Inspirational Afro-soul” and “Epic Afro-pop” are made to give strength; gospel for faith." },
    ],
  },
};

type StyleText = Pick<StylePage, "title" | "description" | "h1" | "intro">;

const STYLES_EN: Record<string, StyleText> = {
  makossa: {
    title: "Personalised makossa song with your name",
    description: "A real makossa song with your name and memories: joyful guitars, bouncing bass, Douala vibe. Free lyrics.",
    h1: "Your personalised makossa song",
    intro: "Makossa is a Cameroonian party: bright guitars, dancing bass, answering choirs. Perfect for a birthday or a wedding.",
  },
  bikutsi: {
    title: "Personalised bikutsi song to get everyone dancing",
    description: "A fast, danceable bikutsi song with your name, for a dowry ceremony, a birthday or a family party. Ready in 2 minutes.",
    h1: "Your personalised bikutsi song",
    intro: "A fast rhythm from the Centre region, looping guitar, choirs singing along: bikutsi gets everyone dancing, especially at a dowry ceremony.",
  },
  rumba: {
    title: "Personalised Congolese rumba song",
    description: "A smooth, elegant rumba with your name, singing guitars and a sebene finale. Ideal for a wedding or a love declaration.",
    h1: "Your personalised rumba song",
    intro: "Soft voice, interlocking guitars and a sebene finale that lifts the mood: rumba is made for love, weddings and beautiful memories.",
  },
  zouklove: {
    title: "Personalised zouk love song with your name",
    description: "A soft, sensual zouk love with your name in the chorus: electric piano, warm pads and a tender voice. For a love declaration or a wedding.",
    h1: "Your personalised zouk love song",
    intro: "A slow swaying groove, electric piano, light guitar and a gentle voice: zouk love is made to say “I love you”.",
  },
  gospel: {
    title: "Personalised African gospel song",
    description: "An African gospel with choir, piano and organ, with your name: to praise, thank, encourage or pay tribute.",
    h1: "Your personalised gospel song",
    intro: "A powerful choir, organ, piano and clapping hands: African gospel carries praise, hope and gratitude.",
  },
  afrobeats: {
    title: "Personalised afrobeats song with your name",
    description: "A modern, groovy afrobeats song with your name, with the chorus in English, French or pidgin. Ready in 2 minutes.",
    h1: "Your personalised afrobeats song",
    intro: "Modern groove, swinging percussion and deep bass: afrobeats pleases every generation, in English, French or pidgin.",
  },
  amapiano: {
    title: "Personalised amapiano song, the sound of the moment",
    description: "An amapiano song with your name: log drum, jazzy piano and a trendy vibe. For a party, a birthday or a surprise.",
    h1: "Your personalised amapiano song",
    intro: "Rumbling log drum, jazzy piano chords, laid-back vibe: amapiano is the trendy sound for a party or a surprise.",
  },
  afrozouk: {
    title: "Personalised romantic Afro-zouk song",
    description: "A soft, romantic Afro-zouk song with their name, to declare your love or celebrate your relationship.",
    h1: "Your personalised Afro-zouk song",
    intro: "Soft synths, caressing guitar, a rocking rhythm: Afro-zouk is made for lovers and declarations.",
  },
  "coupe-decale": {
    title: "Personalised coupé-décalé party song",
    description: "A festive coupé-décalé song with your name, club vibe and answering choirs. Ideal for a birthday.",
    h1: "Your personalised coupé-décalé song",
    intro: "Driving percussion, bright synths and answering choirs: coupé-décalé turns any evening into a party.",
  },
  afrosoul: {
    title: "Personalised inspirational Afro-soul song",
    description: "An inspirational Afro-soul song, piano and strings, with your name: to encourage, thank or move. Studio quality.",
    h1: "Your inspirational Afro-soul song",
    intro: "Grand piano, string orchestra, soul harmonies and a rising chorus: a song full of emotion, to give strength or say thank you.",
  },
  epique: {
    title: "Personalised epic Afro-pop song",
    description: "An epic Afro-pop anthem with your name, big drums and strings, like in the movies. Perfect to celebrate success.",
    h1: "Your epic Afro-pop song",
    intro: "Stadium drums, bright guitars, strings and a big sing-along chorus: an anthem to celebrate a victory.",
  },
  hommage: {
    title: "Personalised acoustic tribute song",
    description: "A soft, dignified acoustic ballad with a loved one’s name, for a loss or a memory. Lyrics reviewed before payment.",
    h1: "Your acoustic tribute song",
    intro: "Acoustic guitar, soft piano and warm strings: a peaceful ballad to honour those who are gone.",
  },
};

/** Page occasion dans la langue voulue. */
export function localizeOccasionPage(page: OccasionPage, locale: Locale): OccasionPage {
  if (locale === "fr") return page;
  const en = OCCASIONS_EN[page.slug];
  if (!en) return page;
  const { example, ...text } = en;
  return {
    ...page,
    ...text,
    name: page.nameEn,
    example: page.example && example ? { ...page.example, ...example } : page.example,
  };
}

/** Page style dans la langue voulue. */
export function localizeStylePage(page: StylePage, locale: Locale): StylePage {
  if (locale === "fr") return page;
  return { ...page, ...(STYLES_EN[page.id] ?? {}) };
}
