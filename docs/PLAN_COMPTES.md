# Plan — comptes clients et tableau de bord

Objectif : le client retrouve toutes ses chansons, finit une commande non payée et revient en créer d'autres.
Inspiration : le tableau de bord d'izimelo (idées seulement, design et textes propres à Dédikace).

## Principes

- **Pas de compte obligatoire pour créer** : le parcours /creer reste ouvert, paroles gratuites puis paiement.
  Le compte est proposé au bon moment (« Garde tes chansons ») et permet de tout retrouver ensuite.
- **Toujours payé à la chanson** : pas de crédits à acheter d'avance (modèle actuel conservé).
- **Aucun faux chiffre** : pas de « 216K utilisateurs » ni de note inventée.
- Auth.js sert déjà au back-office : on l'étend aux clients. Le back-office reste réservé à ADMIN_EMAILS.

## Connexion (validé le 6 novembre 2026 : Google + lien e-mail, compte facultatif)

| Option | Coût | Délai | Remarque |
|---|---|---|---|
| Google + lien par e-mail (recommandé) | 0 | ~0,5 j | Presque tous les Android ont un compte Google. Lien e-mail déjà en place (Resend). |
| Code par WhatsApp | ~15–30 FCFA par code | 1–2 semaines | API WhatsApp Business de Meta : vérification de l'entreprise, modèle de message à faire approuver. |
| Code par SMS | ~50–150 FCFA par code | ~1 j | Prestataire SMS à choisir. |

## Étapes

1. [x] **Base** (~0,5 j) : colonne `user_id` sur `orders`, `name` et `phone` sur `users`. Migration dev puis prod.
2. [x] **Connexion client** (~0,5 j) : page /connexion (Google + e-mail), séparée de /admin/connexion.
   Action manuelle : créer un identifiant OAuth dans Google Cloud Console (je guide pas à pas).
3. [x] **Rattachement des commandes** (~0,5 j) : une commande créée connecté est liée au compte ; à la connexion,
   les commandes déjà faites sur ce téléphone (gardées dans le navigateur) sont rattachées.
   Jamais de rattachement par simple numéro de téléphone (n'importe qui pourrait taper le numéro d'un autre).
4. [x] **Tableau de bord /compte** (~1 j) : « Salut Junior 👋 », grosse carte « Créer une chanson »,
   « Mes chansons » avec statut (paroles à finaliser → bouton payer ; en création ; prête → écouter / WhatsApp),
   « Offrir une chanson à un proche » (lien de partage), aide WhatsApp.
5. [x] **Profil et paramètres** (~0,5 j) : prénom, numéro WhatsApp par défaut (prérempli dans /creer),
   déconnexion, **suppression du compte** (obligatoire, mise à jour de /confidentialite).
6. [x] **Parcours** (~0,5 j) : bouton « Mon espace » dans l'en-tête, proposition de compte après les paroles et
   sur la page de la chanson, tests à 360 px, lint, typecheck.

Total : environ 3,5 jours de travail. Coût mensuel : 0 avec Google + e-mail.

## Plus tard

- Connexion par code WhatsApp quand le volume le justifie.
- Interface en anglais (réglage « Langue »), notifications, programme de fidélité.

## Fait le 6 novembre 2026

- Connexion commune `/connexion` (Google si `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` sont renseignées, sinon e-mail seul).
  `/admin/connexion` redirige vers `/connexion?suite=/admin` ; /admin reste réservé à ADMIN_EMAILS.
- `/compte` : salutation, « Créer une chanson », Mes chansons avec statut, invitation WhatsApp, aide.
- `/compte/parametres` : prénom, numéro WhatsApp (prérempli dans /creer), déconnexion, suppression du compte.
- `/commande/[id]` : paroles + paiement quand la commande est à finaliser ; encart « Garde tes chansons ».
- Commandes rattachées : à la création si connecté, sinon à la connexion (identifiants gardés sur le téléphone).
- [x] Action manuelle : identifiant OAuth Google (Google Cloud Console) + variables sur Vercel. Testé sur téléphone le 7 novembre 2026.
