# Dédikace — plan de développement pour l'agent de code

Chaque bloc ci-dessous est un prompt à copier tel quel dans Claude Code ou Antigravity, dans l'ordre.
Ne passe au suivant que quand la vérification du bloc est OK. Coche les cases au fur et à mesure.

Avant de commencer : les clés Neon, Anthropic, ElevenLabs, Tranzak (sandbox) et Inngest sont dans `.env.local`.
Les clés Cloudflare R2 sont nécessaires au jour 4, Resend au jour 4 (alertes) et au jour 6 (admin).

---

## Jour 0 — Préparation (toi, sans code)

- [ ] Créer les comptes : Neon, Anthropic (console), ElevenLabs, Tranzak (sandbox), Inngest, Vercel,
      Cloudflare (R2), Resend
- [ ] Écouter les 10 styles de docs/PROMPTS.md §2 dans ElevenLabs et retirer ceux qui sonnent faux
- [ ] Préparer 4 MP3 d'exemple pour l'accueil (`public/examples/`)
- [ ] Vérifier les conditions d'usage commercial d'ElevenLabs Music pour la revente de chansons

## Jour 1 — Socle

- [x] **Prompt 1 — Initialisation**
  > Lis CLAUDE.md et docs/PRD.md. Initialise un projet Next.js (App Router, TypeScript strict, Tailwind, ESLint)
  > avec l'arborescence de CLAUDE.md. Ajoute les scripts `typecheck`, `lint`, `db:generate` et `db:migrate`.
  > Installe Zod, drizzle-orm, drizzle-kit, @neondatabase/serverless, server-only, @anthropic-ai/sdk, inngest
  > et tranzak-node. Crée `lib/env.ts` qui valide toutes les variables de `.env.example` avec Zod au démarrage
  > (les variables R2, Auth et Resend peuvent être optionnelles tant que leur jour n'est pas arrivé).
  > Crée `lib/db/index.ts` (client Drizzle sur Neon, serveur uniquement) et `drizzle.config.ts`.

  Vérification : `npm run dev` démarre, `npm run typecheck` passe.

- [x] **Prompt 2 — Base de données**
  > Traduis db/schema.sql en schéma Drizzle dans `lib/db/schema.ts` (enums, tables, contraintes uniques,
  > index, `updated_at` mis à jour automatiquement). Génère et applique la migration sur Neon avec drizzle-kit.
  > Écris `lib/orders.ts` avec les fonctions : createDraftOrder, updateLyrics,
  > setStatus (qui refuse les transitions non prévues par le PRD §6), getOrderByPublicCode, trackEvent.
  > Le code public suit la règle du PRD §5.

  Vérification : un script de test crée une commande et la fait passer de `draft` à `lyrics_ready`,
  et refuse un passage direct de `draft` à `paid`.

## Jour 2 — Paroles

- [x] **Prompt 3 — Génération des paroles**
  > Implémente `lib/claude.ts` et `app/api/lyrics/route.ts` avec le prompt système et le gabarit exacts de
  > docs/PROMPTS.md §1. Entrée validée par Zod. Sortie JSON {title, lyrics} validée ; si `REFUS`,
  > renvoie une erreur 422 avec le message de docs/PROMPTS.md §4. Limite à 3 réécritures par commande.
  > Implémente aussi `lib/moderation.ts` (liste de mots interdits appliquée avant l'appel à Claude).

  Vérification : 10 cas réels (anniversaire, dot, deuil, Bac, excuses…) donnent des paroles correctes en < 15 s.

## Jour 3 — Parcours de création

- [x] **Prompt 4 — Formulaire et aperçu** (bouton Payer branché au jour 5)
  > Construis `/creer` : formulaire en 4 étapes selon le PRD §4 (étapes 1 à 5), mobile d'abord à 360 px,
  > barre de progression, sauvegarde du brouillon dans localStorage (lecture/écriture dans try/catch).
  > Enregistre l'événement `form_started` à l'ouverture du formulaire.
  > Puis l'écran d'aperçu : paroles éditables dans un textarea, bouton « Réécrire », bouton « Payer 3 000 FCFA ».
  > Les styles viennent de `lib/styles.ts` (JSON de docs/PROMPTS.md §2).

- [x] **Prompt 5 — Accueil**
  > Construis la page d'accueil : promesse « Ton nom dans une chanson », 4 lecteurs audio d'exemples
  > (fichiers dans /public/examples), 3 étapes illustrées, FAQ courte, bouton vers /creer.
  > Ajoute le bouton WhatsApp de support flottant sur toutes les pages.

  Vérification : parcours complet jusqu'au bouton de paiement sur un vrai téléphone Android.

## Jour 4 — Génération musicale

- [x] **Prompt 6 — Moteur musical et stockage** (testé : chanson de 3 min générée en 54 s, offre Creator)
  > Implémente `lib/elevenlabs.ts` en suivant la documentation officielle ElevenLabs Music (consulte-la,
  > n'invente pas d'endpoint). Une fonction generateSong({stylePrompt, lyrics, voice, durationSeconds: 180})
  > qui renvoie un Buffer MP3. Applique `lib/phonetics.ts` aux paroles avant l'envoi.
  > Implémente `lib/storage.ts` pour Cloudflare R2 avec @aws-sdk/client-s3 : uploadSong(key, buffer)
  > et getSignedSongUrl(key, 3600). Implémente `lib/email.ts` avec Resend : sendAdminAlert(sujet, texte).

- [x] **Prompt 7 — Tâche Inngest** (testée avec @inngest/test : npm run test:generate)
  > Crée `inngest/generate-song.ts` déclenchée par l'événement `order/paid`. Elle génère les 2 versions
  > en parallèle (steps séparés), stocke chaque MP3 dans le bucket R2 privé `songs` sous
  > `{order_id}/v{version}-g{generation}.mp3`, met à jour `songs` et passe la commande à `delivered`.
  > 3 tentatives par version avec backoff ; après échec, statut `generation_failed` et alerte
  > (log + sendAdminAlert). Expose la fonction dans `app/api/inngest/route.ts`.

- [x] **Prompt 8 — Page chanson**
  > Construis `/s/[code]` selon le PRD §4 étape 9. URL présignées R2 valables 1 h, régénérées à chaque visite.
  > Bouton « Partager sur WhatsApp » (lien wa.me avec texte pré-rempli + URL de la page).
  > Balises Open Graph pour un bel aperçu dans WhatsApp. Bouton de régénération gratuite (1 fois).

  Vérification : en envoyant manuellement l'événement `order/paid` depuis le dashboard Inngest local,
  une commande produit 2 MP3 écoutables sur la page.

## Jour 5 — Paiement Tranzak

- [x] **Prompt 9 — Initialisation du paiement** (API REST : le SDK tranzak-node ne suit plus la doc)
  > Implémente `lib/tranzak.ts` avec le SDK tranzak-node (mode lu dans TRANZAK_MODE ; si le SDK est
  > inutilisable, appelle l'API REST documentée) et `app/api/pay/route.ts`. Mobile Money : débit direct sur
  > le numéro saisi. Carte : redirection web vers l'URL de paiement Tranzak, retour vers /commande/[id].
  > Crée une ligne `payments` avec un `merchant_ref` unique avant l'appel. Prix depuis PRICE_MOMO_XAF /
  > PRICE_CARD_XAF. Enregistre l'événement `payment_started`.

- [x] **Prompt 10 — Notification et vérification** (testé : npm run test:payments)
  > Implémente `app/api/tranzak/webhook/route.ts` pour recevoir les notifications TPN. Vérifie
  > l'authenticité de la notification, puis REVÉRIFIE le statut de la transaction via l'API Tranzak.
  > Seulement si le paiement est confirmé et le montant correct : payments → successful, order → paid,
  > événement `payment_succeeded`, puis envoie l'événement Inngest `order/paid`.
  > Idempotent (CLAUDE.md règle 2). Réponds 200 rapidement.

- [x] **Prompt 11 — Page d'attente** (vérifie aussi chez Tranzak : marche sans webhook)
  > Construis `/commande/[id]` : statut mis à jour toutes les 5 s (polling), messages en français pour chaque
  > statut, redirection automatique vers /s/[code] quand la commande est `delivered`.

  Vérification : succès, échec, solde insuffisant, abandon et notification reçue deux fois testés par simulation
  (npm run test:payments ; pas de sandbox, Tranzak en mode production par choix).
- [x] Vrai paiement de 100 FCFA en local (Orange Money), commande livrée de bout en bout.
- [ ] Vrai paiement de 3 000 FCFA en ligne (après Inngest sur Vercel).

## Jour 6 — Back-office et pages légales

- [x] **Prompt 12 — Admin**
  > Installe next-auth et @auth/drizzle-adapter. Ajoute les tables de l'adaptateur à `lib/db/schema.ts`
  > et migre. Configure `lib/auth.ts` : connexion par lien magique envoyé avec Resend, refusée pour tout
  > e-mail absent de ADMIN_EMAILS. Construis `/admin` selon le PRD §7, chaque page et action vérifiant la
  > session côté serveur. Actions : relancer la génération, marquer remboursée, valider un paiement manuel.

  Vérification : npm run test:admin (accès refusé sans session ou hors liste, pages, 3 actions).
  Une relance garde les versions déjà prêtes. Reste à faire : une vraie connexion par e-mail en ligne.

- [x] **Prompt 13 — Légal et suivi**
  > Ajoute les pages /cgu, /confidentialite et /remboursement (textes simples, marqués « à faire relire »),
  > le Meta Pixel et le TikTok Pixel (événements : début de création, paiement réussi).

  Événements standard : InitiateCheckout (début de création) et Purchase / CompletePayment (paiement réussi,
  une fois par commande). Pixels absents du back-office. Pixel Meta renseigné dans Vercel. TikTok Ads Manager
  n'accepte pas encore les entreprises du Cameroun : TIKTOK_PIXEL_ID à ajouter plus tard (agence partenaire).
  Reste à faire : faire relire les pages légales (éditeur : Darthie Studios).

## Jour 7 — Mise en production

- [x] **Prompt 14 — Revue finale**
  > Relis tout le code contre les règles non négociables de CLAUDE.md et liste chaque écart.
  > Vérifie qu'aucun secret n'est exposé côté client et que `lib/db` n'est importé que côté serveur.
  > Teste chaque page à 360 px. Corrige ce que tu trouves.

  Résultat (3 nov.) : règles 1 à 9 respectées. Aucun secret dans le code navigateur (build analysé),
  composants client sans import serveur, 12 pages sans débordement à 360 px.
  Corrigé : page 404 et page d'erreur en anglais → en français (not-found, error, global-error).
  Écarts acceptés : lib/db/schema.ts sans « server-only » (drizzle-kit doit le lire ; le navigateur n'en importe
  que des types) ; paiement manuel admin = secours vérifié à la main dans Tranzak.
  À surveiller : /api/lyrics (appel Claude) n'a pas de limite par visiteur → règle de limitation dans Vercel Firewall.

- [ ] Passer TRANZAK_MODE en production, déployer sur Vercel, connecter le domaine
  (TRANZAK_MODE=production et Vercel : faits ; domaine : pas encore acheté)
- [ ] Vérifier le domaine d'envoi dans Resend (SPF/DKIM) pour que les e-mails n'arrivent pas en spam
  (envoi accepté depuis izibooking.app ; passer à une adresse @dedikace quand le domaine existera)
- [ ] Déployer Inngest en production (app synchronisée avec l'URL Vercel)
  (clés Inngest en place sur Vercel ; à confirmer par une vraie commande en ligne)
- [ ] Dérouler la checklist ci-dessous

## Checklist avant le lancement public

- [ ] Un vrai paiement MTN MoMo, un vrai Orange Money et une vraie carte, tous livrés en moins de 4 minutes
- [x] Une notification Tranzak rejouée ne crée pas de deuxième génération (npm run test:payments)
- [ ] Le lien partagé sur WhatsApp affiche un bel aperçu et la chanson se lit sur Android en 3G
- [ ] Le numéro WhatsApp de support répond, et il est affiché sur toutes les pages
- [ ] Une génération qui échoue déclenche bien l'e-mail d'alerte
- [ ] Les pages CGU, confidentialité et remboursement ont été relues
- [ ] Les pixels Meta et TikTok remontent les événements « début de création » et « paiement réussi »
- [ ] Le compte admin fonctionne et un e-mail hors liste blanche est refusé
- [ ] Sauvegardes : la restauration à un instant donné de Neon est activée sur le projet de production
