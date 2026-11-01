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
- Si la langue du refrain est le pidgin ou le lingala, utilise uniquement des mots très courants ;
  les couplets restent en français.

Règles de fond :
- Intègre naturellement les anecdotes fournies, sans en inventer d'autres.
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
Langue du refrain : {chorus_language}
```

## 2. Styles (description envoyée au moteur musical, en anglais)

À valider à l'oreille le jour 1 : retirer tout style qui sonne faux avant le lancement.

```json
[
  { "id": "makossa", "label": "Makossa", "prompt": "Cameroonian makossa, bright clean electric guitar, bouncing bass, 118 bpm, joyful {voice} vocals in French" },
  { "id": "bikutsi", "label": "Bikutsi", "prompt": "Fast Cameroonian bikutsi, 6/8 feel, rapid guitar ostinato, 140 bpm, energetic {voice} vocals in French" },
  { "id": "rumba", "label": "Rumba congolaise", "prompt": "Congolese rumba, smooth crooning {voice} vocals, interlocking clean guitars, sebene ending" },
  { "id": "ndombolo", "label": "Ndombolo", "prompt": "High-energy ndombolo, fast sebene guitar, festive dance calls, 135 bpm, {voice} vocals" },
  { "id": "gospel", "label": "Gospel africain", "prompt": "African gospel praise, choir backing, keys and bass, uplifting {voice} lead vocals" },
  { "id": "afrobeats", "label": "Afrobeats", "prompt": "Modern afrobeats, warm {voice} vocals, percussive groove, 105 bpm" },
  { "id": "amapiano", "label": "Amapiano", "prompt": "Amapiano, log drum bass, airy pads, 112 bpm, smooth {voice} vocals" },
  { "id": "afrozouk", "label": "Afro-zouk", "prompt": "Afro-zouk love song, soft synths, romantic {voice} vocals, 90 bpm" },
  { "id": "coupe-decale", "label": "Coupé-décalé", "prompt": "Coupé-décalé, fast percussion, festive call-and-response, {voice} vocals" },
  { "id": "hommage", "label": "Hommage acoustique", "prompt": "Gentle acoustic guitar ballad, solemn and peaceful, soft {voice} vocals" }
]
```

`{voice}` = `male` ou `female`. Ne jamais mentionner un artiste réel dans un prompt de style.

## 3. Prononciation (`lib/phonetics.ts`)

Dictionnaire appliqué aux paroles juste avant l'envoi au moteur, jamais à l'affichage.
Format : `{ "Mbarga": "Em-bar-ga", "Nkongsamba": "N-kong-samba" }`.
Chaque prénom signalé comme mal prononcé par un client y est ajouté.

## 4. Modération (`lib/moderation.ts`)

1. Liste de mots interdits (français, pidgin, lingala) appliquée aux champs du formulaire.
2. Si Claude refuse (champ `refus` à true, ou arrêt `refusal` de l'API), afficher : « On ne peut pas créer cette chanson.
   Modifie ton message et réessaie. »
3. Journaliser chaque refus dans `orders.moderation_note`.
