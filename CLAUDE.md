# Dédikace — instructions pour l'agent de code

Dédikace génère des chansons personnalisées par IA pour l'Afrique centrale (Cameroun d'abord).
L'utilisateur décrit une occasion, valide des paroles gratuites, paie par Mobile Money ou carte via Tranzak,
puis reçoit 2 versions MP3 de sa chanson sur une page partageable par WhatsApp.

Lis `docs/PRD.md` avant toute tâche. Les prompts IA et les styles sont dans `docs/PROMPTS.md`.
Le plan de développement jour par jour est dans `docs/PLAN_DEV.md`.

Le porteur du projet n'est pas développeur (vibe coding) : explique chaque étape simplement, prends les
décisions techniques toi-même en justifiant en une phrase, et dis-lui précisément quoi faire quand une action
manuelle est nécessaire (créer un compte, copier une clé, cliquer dans un tableau de bord).

## Stack (ne pas en changer sans demander)

- Next.js (App Router, TypeScript strict) + Tailwind CSS, déployé sur Vercel
- Neon (Postgres serverless) via Drizzle ORM et le driver `@neondatabase/serverless` ; migrations avec `drizzle-kit`
- Cloudflare R2 (API compatible S3, `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`) : bucket privé `songs`
- Auth.js (`next-auth`, adaptateur Drizzle) : Google ou lien magique par e-mail, pour l'espace client facultatif
  (`/compte`, voir `docs/PLAN_COMPTES.md`) et le back-office (réservé à `ADMIN_EMAILS`)
- Resend pour les e-mails (lien magique admin, alertes d'échec)
- Inngest pour les tâches longues (génération musicale, relances)
- API Claude (`@anthropic-ai/sdk`, modèle `claude-sonnet-5-5`) pour les paroles
- ElevenLabs Eleven Music (API officielle) pour la musique
- Tranzak (SDK `tranzak-node`) pour les paiements : MTN MoMo, Orange Money, carte
- Validation des entrées avec Zod

## Arborescence cible

```
app/
  page.tsx                 accueil pleine largeur + exemples audio
  (site)/                  groupe sans effet sur les adresses : toutes les autres pages, en colonne étroite
  creer/                   parcours de création en 4 étapes
  commande/[id]/           attente de paiement puis de génération
  s/[code]/                page publique de la chanson
  connexion/               connexion commune (Google ou lien magique)
  compte/                  espace client : Mes chansons, compte/parametres
  admin/                   back-office (protégé, réservé à ADMIN_EMAILS)
  en/  (site)/en/          version anglaise (/en/…) : pages fines qui réutilisent les écrans partagés (locale)
  cgu/  confidentialite/  remboursement/   pages légales
  api/lyrics/route.ts      génération / réécriture des paroles
  api/pay/route.ts         initialisation du paiement Tranzak
  api/commande/[id]/       statut lu par la page d'attente (revérifie chez Tranzak)
  api/tranzak/webhook/     réception des notifications TPN
  api/inngest/route.ts     endpoint Inngest
  api/auth/[...nextauth]/  Auth.js
lib/
  db/index.ts  db/schema.ts
  claude.ts  elevenlabs.ts  tranzak.ts  storage.ts  auth.ts  email.ts
  moderation.ts  phonetics.ts  styles.ts  occasions.ts  orders.ts  payments.ts  songs.ts  format.ts  env.ts
  admin.ts (requêtes et actions du back-office)  account.ts (espace client)
  i18n.ts (langues, adresses /en)  i18n-errors.ts  use-locale.ts (navigateur)  seo-pages-en.ts
  pixels.ts (Meta, chargé après consentement, code navigateur)  consent.ts (choix cookies)  my-orders.ts (commandes faites sur ce téléphone, navigateur)
components/
  WhatsAppButton.tsx  Pixels.tsx  LegalPage.tsx
inngest/
  client.ts  generate-song.ts
db/schema.sql              référence fonctionnelle du schéma (la source exécutable est lib/db/schema.ts)
drizzle/                   migrations générées par drizzle-kit
```

## Règles non négociables

1. **Jamais de génération musicale avant un paiement confirmé.** La notification Tranzak (TPN) ne suffit pas :
   revérifie toujours le statut de la transaction via l'API Tranzak côté serveur avant de lancer Inngest.
2. **Idempotence** : une même notification reçue deux fois ne doit créer qu'une génération
   (contrainte unique sur la référence Tranzak + vérification du statut de la commande).
3. **Secrets uniquement côté serveur** : aucune clé API dans le code client ni dans une variable `NEXT_PUBLIC_*`.
4. **Montants en entiers XAF**, jamais de flottants.
5. **Modération** des entrées et des paroles (`lib/moderation.ts`) avant tout appel au moteur musical :
   pas d'insultes, de contenu sexuel, de politique, de personnalités publiques ni d'imitation d'artistes réels.
6. **Mobile d'abord** : tester chaque écran à 360 px de large. Les clients arrivent de TikTok sur Android en 3G/4G.
7. **Interface en français**, tutoiement chaleureux et simple, phrases courtes (public jeune venu de TikTok).
8. **La base n'est accessible que côté serveur** : `lib/db` est importé uniquement dans du code serveur
   (`import "server-only"`), `DATABASE_URL` n'est jamais exposée au navigateur. Toute écriture passe par
   `lib/orders.ts` ou des fonctions serveur dédiées.
9. Les MP3 sont dans un bucket R2 privé ; la page publique sert des URL présignées valables 1 h.

## Documentation externe à consulter (ne pas deviner les endpoints)

- ElevenLabs Music : https://elevenlabs.io/docs (section Music)
- Tranzak : https://docs.developer.tranzak.me/ et https://github.com/HolyCorn-Software/tranzak-node
- Inngest + Next.js : https://www.inngest.com/docs
- Neon : https://neon.com/docs — Drizzle : https://orm.drizzle.team/docs
- Cloudflare R2 : https://developers.cloudflare.com/r2/
- Auth.js : https://authjs.dev — Resend : https://resend.com/docs

## Commandes

- `npm run dev` — développement local
- `npm run lint && npm run typecheck` — avant chaque commit
- `npm run db:generate` puis `npm run db:migrate` — après toute modification de `lib/db/schema.ts`
  (`.env.local` pointe sur la branche Neon `dev` ; appliquer ensuite à la vraie base avec `npm run db:migrate:prod`,
  avant de pousser le code qui en dépend)
- `npx inngest-cli@latest dev` — serveur Inngest local

## Définition de « terminé »

Une fonctionnalité est terminée quand elle marche sur mobile, que lint et typecheck passent,
que les erreurs sont gérées avec un message clair en français, et que `docs/PLAN_DEV.md` est coché.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
