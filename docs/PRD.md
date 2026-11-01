# Dédikace — PRD du MVP

## 1. Promesse

« Ton nom dans une chanson. » Une chanson personnalisée en quelques minutes, sur des rythmes d'Afrique centrale,
pour un anniversaire, un mariage, une dot, un deuil, une réussite ou une déclaration.

## 2. Cibles

| Cible | Besoin | Paiement |
| --- | --- | --- |
| Cameroun, 18-40 ans, urbain | Cadeau original et pas cher, partagé sur WhatsApp | MTN MoMo, Orange Money |
| Diaspora (France, Belgique, Canada) | Être présent à distance à un événement familial | Carte bancaire |
| Organisateurs d'événements, chorales (après le MVP) | Contenu pour leurs clients | Packs |

## 3. Périmètre du MVP

Inclus : parcours sans compte, paroles gratuites et modifiables, paiement Tranzak, 2 versions par commande,
page de partage, back-office minimal.

Exclu : comptes utilisateurs, abonnements, crédits, extrait audio avant paiement, autres pays que le Cameroun
(la carte reste ouverte à tous), application mobile, playlist publique.

## 4. Parcours utilisateur

1. **Accueil** (`/`) : promesse, 4 exemples audio, bouton « Créer ma chanson ».
2. **Étape 1 — Occasion** : anniversaire, mariage, dot, deuil / hommage, réussite (BEPC, Bac, diplôme),
   déclaration d'amour, excuses, encouragement.
3. **Étape 2 — Destinataire** : prénom (obligatoire), relation (mère, ami, épouse…), 1 à 3 anecdotes
   (500 caractères max au total), prénom de l'expéditeur (facultatif).
4. **Étape 3 — Musique** : style (10 choix, voir `PROMPTS.md`), langue du refrain (français, pidgin, lingala),
   voix (homme / femme).
5. **Étape 4 — Contact** : numéro WhatsApp au format international (+237…).
6. **Aperçu des paroles** : paroles générées en moins de 15 s, modifiables à la main, bouton « Réécrire »
   (3 réécritures max par commande).
7. **Paiement** : choix MTN MoMo, Orange Money ou carte. Mobile Money = débit direct avec confirmation sur le
   téléphone ; carte = redirection vers la page Tranzak.
8. **Attente** (`/commande/[id]`) : statut en direct (paiement en attente → paiement reçu → création en cours,
   environ 2 min → prête).
9. **Page chanson** (`/s/[code]`) : titre, prénom, style, 2 lecteurs audio, téléchargement MP3,
   bouton « Partager sur WhatsApp », bouton « Créer la mienne », lien « Signaler un problème ».

## 5. Règles métier

- **Prix** : 3 000 XAF en Mobile Money ; 4 000 XAF par carte (≈ 6 €, frais et conversion compris).
- **Durée** : environ 3 minutes par version, 2 versions par commande.
- **Régénération gratuite** : 1 par commande, déclenchée depuis la page chanson (« La chanson ne me plaît pas »)
  ou par l'admin. Au-delà, contact WhatsApp.
- **Code public** : 8 caractères alphanumériques, non devinable, sans caractères ambigus (0/O, 1/l).
- **Conservation** : MP3 conservés 12 mois.
- **Droits** : usage personnel et partage libre. Ne pas promettre la « pleine propriété ».
- **Prononciation** : les prénoms passent par `lib/phonetics.ts` avant l'envoi au moteur.

## 6. Statuts de commande

`draft` → `lyrics_ready` → `pending_payment` → `paid` → `generating` → `delivered`
avec sorties possibles vers `payment_failed` et `generation_failed`.
`refunded` est posé uniquement par l'admin, depuis `paid`, `generating`, `delivered` ou `generation_failed`
(le paiement associé passe alors à `refunded`).

## 7. Back-office (`/admin`)

Accès par lien magique e-mail (Auth.js + Resend), liste blanche d'e-mails (`ADMIN_EMAILS`) vérifiée côté serveur.
- Liste des commandes filtrable par statut, avec montant, canal, date, téléphone
- Détail : paroles, paiement, versions générées, erreurs
- Actions : relancer la génération, marquer remboursée, valider un paiement manuel (secours)
- Compteurs du jour : formulaires commencés (table `events`), commandes payées, chiffre d'affaires, échecs

## 8. Mesures de succès (semaine de lancement)

- 100 commandes payées
- Taux de paiement ≥ 8 % des formulaires commencés
- Taux d'échec de génération < 5 %
- Délai médian paiement → chanson livrée < 4 minutes

## 9. Hors périmètre technique mais à prévoir

Pages CGU, confidentialité, remboursement ; numéro WhatsApp de support affiché partout ;
Meta Pixel et TikTok Pixel sur l'accueil et la confirmation de paiement.
