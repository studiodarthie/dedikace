# Plan — croissance (13 novembre 2026)

Objectif : vendre plus (relances, premium, parrainage) et faire circuler les chansons (surprise, vidéo, anglais).
Chaque étape est testée à 360 px, puis mise en ligne seulement après ton accord.
Les migrations de base sont faites d'abord sur la branche Neon `dev`, puis sur la vraie base avec ton OK.

Décisions du porteur du projet (13 novembre 2026) :
- Relance : liste « À relancer » dans le back-office + bouton WhatsApp avec message tout prêt (envoi à la main),
  et e-mail automatique pour les clients qui ont un espace.
- Premium à 7 000 FCFA : chanson plus longue, 3 versions, ouverture programmée, vidéo statut incluse.
- Parrainage : 500 FCFA de moins pour le filleul, 500 FCFA de réduction pour le parrain.
- Interface en anglais : maintenant.

## Étape 1 — Relance des paroles non payées (fait le 13 novembre 2026)

- [x] Back-office : onglet « À relancer » = paroles prêtes ou paiement raté depuis plus d'1 h, pas encore relancées,
      moins de 7 jours. Prénom, occasion, montant, ancienneté.
- [x] Bouton « Relancer sur WhatsApp » : ouvre WhatsApp vers le numéro du client avec un message prêt
      (« Salut Junior 👋 Tes paroles pour Maman Marie t'attendent… » + lien direct vers le paiement).
      Un clic marque la commande « relancée » (date gardée), pour ne pas relancer deux fois.
- [x] E-mail automatique (Inngest, 1 h après les paroles) si la commande est rattachée à un espace et toujours
      non payée. Une seule relance par commande.
- [x] Compteur dans le tableau de bord : relances envoyées → commandes payées ensuite.
- Base : colonne `orders.reminded_at` (migration).
- Fichiers : `lib/reminders.ts`, `inngest/remind-unpaid.ts`, `app/(site)/admin/relances/`. Testé sur la branche `dev`
  (liste, message, bouton, e-mail une seule fois et seulement avec un espace).

## Étape 2 — « Envoyer la surprise » (fait le 13 novembre 2026)

- [x] Page de la chanson : gros bouton « Envoyer la surprise 🎁 » avec 3 messages au choix (tendre, drôle, simple),
      qui ouvre WhatsApp avec le message + le lien.
- [x] Conseils juste dessous : « Mets le lien en statut », « Fais-la écouter en direct pendant la fête »,
      « Envoie aussi le MP3 » (le statut WhatsApp n'accepte pas un MP3 de 3 min : la vidéo de l'étape 4 le fera).
- [x] Bouton « Télécharger le MP3 » mis en avant (pour l'envoyer en vocal / l'ajouter au statut).

## Étape 3 — Extraits par style dans /creer (~0,5 j + ~10 générations ElevenLabs)

- [ ] 10 extraits de 15 s (un par style), même texte neutre (« Joyeux anniversaire… »), voix alternées homme/femme,
      créés par un script comme les exemples, servis en MP3 léger (48 kb/s, ~90 Ko) depuis `public/styles/`.
- [ ] Bouton ▶ sur chaque carte de style, un seul extrait à la fois, chargé seulement au toucher (3G).
- [ ] Exemples de l'accueil : bouton « Écouter la chanson complète » (3 min) en plus de l'extrait.

## Étape 4 — Vidéo pour les statuts WhatsApp (~2 j)

- [ ] Page de la chanson : « Crée ta vidéo statut » → choisir une photo (réduite sur le téléphone à 1080 px
      avant l'envoi, pour la 3G), envoyée dans le bucket R2 privé.
- [ ] Création côté serveur (Inngest + ffmpeg) : vidéo verticale 1080×1920, 30 s autour du refrain, photo avec
      zoom lent, prénom + titre + paroles du refrain qui défilent, petit « dedikace.app » en bas (pub gratuite).
      MP4 H.264 : le format que WhatsApp accepte en statut.
- [ ] Bouton « Télécharger la vidéo » + « Partager » (partage natif du téléphone sur Android).
- [ ] Modération : la photo n'est jamais montrée publiquement sans la vidéo ; supprimée avec la commande.
- Base : table `videos` (statut, photo, fichier, erreurs) (migration). Coût : temps de calcul Vercel uniquement.

## Étape 5 — Offre premium à 7 000 FCFA (~1,5 j)

- [ ] Au paiement : choix « Classique 3 000 FCFA » / « Premium 7 000 FCFA » (carte : 4 000 / 8 000 FCFA).
- [ ] Premium = chanson d'environ 4 min, 3 versions au lieu de 2, vidéo statut créée automatiquement,
      ouverture programmée.
- [ ] Ouverture programmée : le client choisit la date et l'heure (ex. minuit le jour J). Il peut partager le lien
      à l'avance ; la page affiche un compte à rebours « La surprise s'ouvre dans 3 h 12 », puis la chanson.
      Le client, lui, l'écoute tout de suite depuis son lien privé.
- [ ] Back-office : formule visible sur chaque commande, chiffre d'affaires par formule.
- Base : colonnes `orders.plan`, `orders.reveal_at` (migration). Montants en entiers XAF (règle 4).

## Étape 6 — Parrainage (~1,5 j)

- [ ] Chaque chanson livrée a un lien de parrainage : `dedikace.app/?p=CODE`, partagé depuis la page de la chanson
      (« Offre 500 FCFA à un ami »).
- [ ] Le filleul arrive par ce lien : 500 FCFA de moins affichés partout et appliqués au paiement.
- [ ] Quand le filleul a payé, le parrain reçoit un code de réduction de 500 FCFA, affiché sur sa page de chanson
      et dans son espace, utilisable une fois au paiement.
- [ ] Garde-fous : pas de parrainage de soi-même (même numéro WhatsApp), réduction calculée côté serveur,
      un code de réduction par commande.
- Base : tables `referrals` et `coupons` (migration).

## Étape 7 — Interface en anglais (~2,5 j)

- [ ] Adresses : français inchangé (`dedikace.app/creer`), anglais sous `dedikace.app/en/...` (utile pour les
      pubs visant Bamenda, Buea, le Nigeria, le Ghana).
- [ ] Bouton FR / EN dans l'en-tête ; premier choix d'après la langue du téléphone.
- [ ] Tous les textes : accueil, création, paiement, attente, page de la chanson, espace, e-mails, messages
      d'erreur, pages légales. Le back-office reste en français.
- [ ] Par défaut en anglais : langue de la chanson et du refrain sur « Anglais ».
- [ ] Vérifier chaque écran à 360 px dans les deux langues (l'anglais est souvent plus court, mais pas toujours).

## Étape 8 — Témoignages (~0,5 j, quand les premières réactions arrivent)

- [ ] Page de la chanson : « Envoie-nous la réaction 💬 » → WhatsApp vers le support, avec la demande d'accord
      pour publier.
- [ ] Back-office : ajouter un témoignage (photo ou capture, prénom, ville, texte) seulement avec l'accord du client.
- [ ] Accueil : section « Leurs réactions », affichée seulement quand il y a au moins 3 vrais témoignages.
      Jamais de faux avis ni de chiffres inventés.

## Ordre et durée

1 → 2 → 3 (petits gains rapides, ~2 j), puis 4 → 5 (la vidéo sert au premium), puis 6, 7, 8.
Total : environ 10 jours de travail. Coûts nouveaux : ~10 générations ElevenLabs (étape 3), musiques plus longues
et 3ᵉ version pour le premium (payées par le prix premium), temps de calcul vidéo sur Vercel.
