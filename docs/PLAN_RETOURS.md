# Plan — corrections après le retour d'expérience (7 novembre 2026)

Source : retour d'un testeur externe (accueil + parcours /creer jusqu'au numéro WhatsApp).
Chaque étape est publiée seulement après tes tests et ton accord.

## Étape 1 — Corrections rapides (fait le 7 novembre 2026)

- [x] **Prix par carte** : l'encadré de confiance de /creer (`TrustBanner`) affiche le prix MoMo à côté de
      « Visa · Mastercard ». Nouveau texte : « 3 000 FCFA (4 000 FCFA par carte) ».
- [x] **Durée** : les exemples de l'accueil durent 1:20, la promesse dit 3 minutes (c'est vrai pour les
      commandes : 180 s). Ajouter une pastille « Extrait » sur chaque exemple et la phrase
      « Ta chanson complète dure environ 3 minutes » sous la liste.
- [x] **« Encouragement »** : ajouter la carte manquante dans les occasions de l'accueil.
- [x] **Accessibilité** : texte alternatif sur les images d'exemples (« Photo illustrant la chanson pour… »),
      vérifier que les cartes à toucher de /creer ont un nom lisible (`aria-pressed` + texte visible).
- [x] **Titres coupés** (« Maman Mireille e… ») : titre sur 2 lignes au lieu d'être tronqué.
- [x] **Badge « Bac »** qui recouvre « Paroles gratuites » vers 800 px de large : le déplacer ou le masquer
      sur cette largeur.

Réalisé : « Dot » et « Mariage » séparés + « Encouragement » (8 cartes, 4 par ligne sur ordinateur) ;
autocollants d'ordinateur seulement à partir de 1024 px ; « Extraits d'1 min 20 » + « Ta chanson complète dure
environ 3 minutes » ; boutons de /creer déjà nommés par leur texte (rien à changer).

## Étape 2 — Bandeau cookies (fait le 7 novembre 2026)

- [x] Petit bandeau en bas d'écran : « On utilise des cookies de mesure (Meta, TikTok) pour savoir d'où
      viennent nos clients. » Boutons **Accepter** / **Refuser**, même taille (exigence RGPD).
- [x] Les pixels Meta et TikTok ne se chargent qu'après « Accepter ». Choix gardé 6 mois sur le téléphone.
- [x] Bandeau affiché seulement si un pixel est configuré, jamais dans le back-office.
- [x] Lien « Cookies » en pied de page pour changer d'avis.
- [x] Page /confidentialite : paragraphe cookies mis à jour.

Réalisé : `lib/consent.ts` (choix gardé dans le navigateur, 6 mois), `components/Pixels.tsx` (bandeau + pixels
chargés seulement après « Accepter » ; retrait du consentement = rechargement de la page). Testé à 360 px
avec un faux identifiant : refus → aucun pixel, accord → pixel chargé, lien « Cookies » → bandeau de retour.

## Étape 3 — CGU et modèle IA (texte fait le 7 novembre 2026)

- [x] CGU : préciser que la musique est générée avec ElevenLabs (API officielle) et les paroles avec Claude.
- [x] **Action pour toi** : vérifier dans ElevenLabs → Subscription que ton forfait est payant (confirmé : forfait payant)
      (l'usage commercial des musiques est réservé aux forfaits payants). Envoie-moi une capture sans clé.
      Une fois confirmé, ajouter dans les CGU « dans le cadre d'un abonnement qui autorise l'usage commercial ».

## Étape 4 — Vérification et mise en ligne (fait le 7 novembre 2026)

- [x] Captures à 360 px (téléphone) et 800 px (tablette) : accueil, /creer étapes 1 et 4, bandeau cookies.
- [x] `npm run lint && npm run typecheck`.
- [x] Commit puis mise en ligne **après ton OK**. Aucune migration de base nécessaire.

## Décisions du 7 novembre 2026

- Forfait ElevenLabs payant : phrase « usage commercial » ajoutée aux CGU.
- Commande réelle déjà testée, connexion Google testée sur téléphone, fichiers A-COLLER supprimés.
- Pages légales validées par le porteur du projet (pas de juriste) : bandeau « provisoire » retiré,
  mentions légales ajoutées (NIU, hébergeur) dans les CGU (`/cgu#mentions-legales`, lien en pied de page).
- Domaine **dedikace.app** branché le 13 novembre 2026 : DNS chez Cloudflare (2 CNAME « DNS uniquement »),
  www → dedikace.app (308), certificats HTTPS Vercel. NEXT_PUBLIC_APP_URL déduite par Vercel (domaine le plus court).
  Google OAuth (origine + URI de redirection) et adresse TPN Tranzak mises à jour le 13 novembre 2026.
  Reste : domaine d'envoi Resend (noreply@dedikace.app).
- « On refait ta chanson » affiché (une nouvelle création gratuite par commande).
- Exemple d'anniversaire recréé avec « Marie » (prénom de la pancarte sur la photo).
- TikTok Pixel abandonné : code retiré, seul le pixel Meta reste (après consentement).

## Plus tard (pas dans ce lot)

| Idée | Pourquoi attendre | Ce qu'il faut |
|---|---|---|
| Domaine dedikace.cm / .com | Rassure au paiement | Tu l'achètes, je branche Vercel + Tranzak + Google |
| Relecture juridique + mentions légales | Obligatoire avant la vraie pub | Juriste, n° d'immatriculation |
| Extrait de 10 s par style dans /creer | Aide à choisir | ~10 générations ElevenLabs |
| Témoignages / compteur | Seulement des vrais, avec accord | Premières ventes |
| Vidéo pour statut WhatsApp | Meilleure pub gratuite | Déjà en Phase 4 de PLAN_ONBOARDING |
| Offre premium 7 000–10 000 FCFA, parrainage | Après les premières ventes | Décision prix |
| Langues locales (duala, ewondo, bassa) | Qualité insuffisante de l'IA (comme le lingala) | Un locuteur natif pour relire des essais |
