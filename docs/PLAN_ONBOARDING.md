# Plan — parcours de création adapté au public camerounais

Objectif : moins d'abandons entre l'arrivée sur /creer et le paiement.
Public : jeunes venus de TikTok, Android, 3G/4G, réflexe WhatsApp, méfiance envers le paiement en ligne.

Déjà en place : barre d'avancement, brouillon sauvegardé dans le navigateur, numéro WhatsApp demandé
avant les paroles, paroles gratuites avant paiement, bouton WhatsApp flottant.

## Phase 1 — Moins écrire, plus toucher (fait le 5 novembre 2026)

- [x] Refrain en anglais en plus du français, du pidgin et du lingala.
- [x] Occasions en grosses cartes avec emoji (`lib/occasions.ts` : champ `emoji`).
- [x] « Pour qui ? » en gros boutons emoji avant le prénom (Maman, Papa, Ma chérie…), remplit `relation`.
- [x] Idées de souvenirs à toucher, propres à chaque occasion (`lib/occasions.ts` : `MEMORY_IDEAS`),
      écrites à la 2ᵉ personne (« Tu… ») pour éviter les accords il/elle. Toucher une idée l'ajoute dans
      une case vide (3 au plus), la retoucher la retire. La personne peut ensuite la compléter.
- [x] Aucun changement d'API : les idées deviennent des anecdotes normales, modérées comme avant.

## Phase 1 bis — Confiance avant de payer (fait le 5 novembre 2026)

- [x] Bandeau en haut de l'étape 1 : « Paroles gratuites · Tu paies seulement si elles te plaisent (prix) ».
- [x] Pastilles des moyens de paiement (MTN MoMo, Orange Money, Visa / Mastercard) en texte coloré,
      sans logos officiels.
- [x] Sous le bouton de paiement : paiement sécurisé par Tranzak, lien vers la politique de remboursement,
      lien « Une question ? Écris-nous sur WhatsApp ».
- [ ] « On refait ta chanson si elle ne te plaît pas » : à décider par le porteur du projet (coût d'une
      génération supplémentaire) avant de l'afficher.

## Phase 2 — Raconter en vocal (fait le 5 novembre 2026)

- [x] API ElevenLabs Speech to Text (`scribe_v2`, langue détectée automatiquement) : `transcribeVoice` dans
      `lib/elevenlabs.ts`. La clé ElevenLabs doit avoir la permission « Speech to Text ». Moins d'un centime
      d'euro par vocal d'une minute.
- [x] Bouton 🎤 « Raconte en vocal » (`app/(site)/creer/VoiceNote.tsx`) : MediaRecorder, 60 s max, envoi à
      `app/api/transcribe/route.ts` (3 Mo max), texte placé dans une case souvenir et modifiable.
      Caché si le navigateur ne sait pas enregistrer.
- [x] Testé avec un vocal en français : « ndolè », « makossa », « Douala » bien reconnus.
- [ ] Tester avec 5 vrais vocaux à l'accent camerounais, dont un en pidgin.
- [x] Règle anti-abus du pare-feu Vercel sur `/api/transcribe` (10 requêtes / minute / IP).
- [ ] Bouton 🎤 « Comment se prononce le prénom ? » → aide `lib/phonetics.ts`.

## Phase 3 — WhatsApp au centre (à faire)

- [ ] Relance WhatsApp/e-mail des paroles non payées après 1 h (Inngest, déjà prévue dans PLAN_DEV).
- [ ] Page de la chanson : bouton « Envoyer la surprise » avec message tout fait + conseil « mets-la en statut ».

## Phase 4 — Plus tard

- [ ] Programmer l'envoi (minuit le jour J).
- [ ] Interface en anglais (Cameroun anglophone, Nigeria, Ghana).
- [ ] Parcours diaspora (carte bancaire, envoi au proche resté au pays).
- [ ] Vidéo verticale photo + paroles pour statut WhatsApp / TikTok.
