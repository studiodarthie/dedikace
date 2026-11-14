# Dédikace — prompts IA et styles

Ces textes sont le cœur de la qualité du produit. Ils vivent dans `lib/styles.ts` et `lib/claude.ts`,
mais cette page est la référence : toute modification se fait ici d'abord.

## 1. Prompt système des paroles (API Claude)

```text
Tu es le parolier de Dédikace, spécialiste des musiques d'Afrique centrale.
Tu écris une chanson personnalisée qui sera chantée par une voix IA.

Règles de forme :
- Structure exacte, une section par bloc, avec ces étiquettes :
  [Couplet 1] [Refrain] [Couplet 2] [Refrain] [Pont] [Refrain]
- 160 à 220 mots au total.
- Couplets de 8 lignes, pont de 4 lignes.
- Refrain de 4 lignes, simple, facile à chanter en chœur, qui contient le prénom du destinataire.
- Lignes de 6 à 10 syllabes, rimes simples.
- Écris les couplets et le pont dans la langue de la chanson, et le refrain dans la langue du refrain.
  Le titre est dans la langue de la chanson.
- Les étiquettes de section restent toujours en français, exactement comme ci-dessus, quelle que soit la langue.
- En anglais ou en pidgin, utilise uniquement des mots très courants.

Règles de fond :
- Intègre naturellement les anecdotes fournies, sans en inventer d'autres.
- Écris comme un parolier professionnel : des images concrètes tirées des anecdotes, pas de clichés vides.
- Le refrain est l'accroche : une phrase forte et mémorable, reprise à l'identique à chaque [Refrain].
- Le pont apporte un angle nouveau (un vœu, une promesse, un souvenir clé) et prépare le dernier refrain.
- Le titre est court (2 à 6 mots) et reprend l'accroche du refrain.
- Ton : joyeux pour une fête, tendre pour l'amour, fier pour une réussite,
  solennel et apaisé pour un deuil (jamais triste au point d'être lourd).
- Interdit : vulgarité, contenu sexuel, politique, religion polémique, personnalités publiques,
  noms d'artistes réels, marques.
- Si les informations fournies contiennent un contenu interdit ou insultant envers le destinataire,
  refuse : mets "refus" à true, et "title" et "lyrics" vides.

Format de réponse : un objet JSON {"refus": false, "title": "...", "lyrics": "..."}.
Dans "lyrics", chaque étiquette de section est seule sur sa ligne, suivie des lignes chantées,
avec une ligne vide entre deux sections.
```

La forme JSON est imposée par les sorties structurées de l'API (`output_config.format`) :
le modèle ne peut pas renvoyer autre chose qu'un objet valide. Le refus passe donc par le champ
`refus` plutôt que par le mot « REFUS ».

Message utilisateur (gabarit) :

```text
Occasion : {occasion}
Destinataire : {recipient_name} ({relation})
Expéditeur : {sender_name | "non précisé"}
Anecdotes : {anecdotes}
Style musical : {style_label}
Langue de la chanson : {song_language}
Langue du refrain : {chorus_language}
```

## 2. Styles (description envoyée au moteur musical, en anglais)

À valider à l'oreille le jour 1 : retirer tout style qui sonne faux avant le lancement.

```json
[
  { "id": "makossa", "label": "Makossa", "prompt": "Cameroonian makossa, bright clean interlocking electric guitars, melodic bouncing bass lines, crisp congas and hi-hats, warm brass stabs, 118 bpm, joyful {voice} lead vocals, call-and-response backing vocals" },
  { "id": "bikutsi", "label": "Bikutsi", "prompt": "Fast Cameroonian bikutsi, driving 6/8 feel, rapid muted guitar ostinato, plucked balafon-like melodies, punchy kick and shakers, 140 bpm, energetic {voice} vocals, chanted group responses" },
  { "id": "rumba", "label": "Rumba congolaise", "prompt": "Congolese rumba, smooth crooning {voice} lead vocals, interlocking clean guitars, warm round bass, soft congas, lush vocal harmonies, rising sebene guitar finale" },
  { "id": "zouklove", "label": "Zouk Love", "prompt": "Romantic zouk love, slow sensual Caribbean zouk groove, syncopated zouk drum pattern with soft kick and rimshot, warm electric piano chords, lush analog synth pads, smooth round melodic bass, clean chorus guitar arpeggios, 88 bpm, intimate tender {voice} vocals, soft harmonized backing vocals", "avoid": ["afrobeats", "amapiano", "log drum", "reggaeton", "dancehall", "trap", "EDM", "rock", "distorted guitar", "fast tempo", "autotune"] },
  { "id": "gospel", "label": "Gospel africain", "prompt": "African gospel praise, full choir backing, organ and grand piano, groovy bass, joyful hand claps, uplifting {voice} lead vocals" },
  { "id": "afrobeats", "label": "Afrobeats", "prompt": "Modern afrobeats, warm melodic {voice} vocals, syncopated percussion and shakers, plucked guitar riff, deep sub bass, airy synth pads, 105 bpm" },
  { "id": "amapiano", "label": "Amapiano", "prompt": "Amapiano, deep log drum bass, shuffling shakers, jazzy piano chords, airy pads, 112 bpm, smooth {voice} vocals" },
  { "id": "afrozouk", "label": "Afro-zouk", "prompt": "Afro-zouk love song, lush soft synths, gentle guitar licks, swaying groove, 90 bpm, romantic {voice} vocals, tender harmonies" },
  { "id": "coupe-decale", "label": "Coupé-décalé", "prompt": "Coupé-décalé, fast driving percussion, bright synth leads, festive call-and-response chants, 128 bpm, hype {voice} vocals" },
  { "id": "afrosoul", "label": "Afro-soul inspirant", "prompt": "Inspirational afro-soul, cinematic grand piano, swelling string orchestra, warm bass, soulful gospel harmonies, slow build to an anthemic chorus, 78 bpm, powerful emotional {voice} vocals" },
  { "id": "epique", "label": "Afro-pop épique", "prompt": "Epic afro-pop anthem, big stadium drums, bright electric guitars, orchestral hits and strings, huge sing-along chorus, 100 bpm, triumphant {voice} vocals" },
  { "id": "hommage", "label": "Hommage acoustique", "prompt": "Gentle acoustic guitar ballad, soft piano and warm strings, solemn and peaceful, intimate {voice} vocals, subtle choir in the chorus" }
]
```

`{voice}` = `male` ou `female`. Ne jamais mentionner un artiste réel dans un prompt de style.

Depuis le 14 novembre 2026 : instruments et production décrits plus précisément, 2 styles ajoutés (afrosoul, epique).
`lib/elevenlabs.ts` ajoute à chaque chanson une direction « studio » (mix, master) et une dynamique par section
(couplet plus léger, refrain le plus riche avec chœurs, pont dépouillé qui relance le dernier refrain).

## 3. Prononciation (`lib/phonetics.ts`)

Dictionnaire appliqué aux paroles juste avant l'envoi au moteur, jamais à l'affichage.
Format : `{ "Mbarga": "Em-bar-ga", "Nkongsamba": "N-kong-samba" }`.
Chaque prénom signalé comme mal prononcé par un client y est ajouté.

## 4. Modération (`lib/moderation.ts`)

1. Liste de mots interdits (français, anglais, pidgin, lingala) appliquée aux champs du formulaire.
2. Si Claude refuse (champ `refus` à true, ou arrêt `refusal` de l'API), afficher : « On ne peut pas créer cette chanson.
   Modifie ton message et réessaie. »
3. Journaliser chaque refus dans `orders.moderation_note`.
