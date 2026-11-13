-- Dédikace — schéma de référence (Neon / Postgres)
-- Source exécutable : lib/db/schema.ts (Drizzle). Ce fichier décrit le modèle attendu ;
-- toute modification se fait ici d'abord, puis dans lib/db/schema.ts.
-- Les tables d'Auth.js (users, accounts, sessions, verification_tokens) servent à la connexion
-- des clients (espace « Mes chansons », docs/PLAN_COMPTES.md) et du back-office, en fin de fichier.

create type order_status as enum (
  'draft', 'lyrics_ready', 'pending_payment', 'paid',
  'generating', 'delivered', 'payment_failed', 'generation_failed', 'refunded'
);
create type payment_channel as enum ('mtn', 'orange', 'card', 'manual');
create type payment_status as enum ('pending', 'successful', 'failed', 'cancelled', 'refunded');
create type song_status as enum ('queued', 'generating', 'ready', 'failed');

create table orders (
  id uuid primary key default gen_random_uuid(),
  public_code text unique not null,
  whatsapp_phone text not null,
  occasion text not null,
  recipient_name text not null,
  relation text,
  sender_name text,
  anecdotes text,
  style_id text not null,
  song_language text not null default 'fr',   -- couplets et pont
  chorus_language text not null default 'fr',
  voice text not null default 'male' check (voice in ('male', 'female')),
  title text,
  lyrics text,
  rewrite_count int not null default 0,
  free_regen_used boolean not null default false,
  status order_status not null default 'draft',
  price_xaf int not null default 3000,
  country text not null default 'CM',
  moderation_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  provider text not null default 'tranzak',
  provider_request_id text unique,          -- requestId Tranzak : garantit l'idempotence
  merchant_ref text unique not null,        -- mchTransactionRef envoyé à Tranzak
  amount_xaf int not null,
  channel payment_channel not null,
  status payment_status not null default 'pending',
  raw_notification jsonb,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table songs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  version int not null check (version in (1, 2)),
  generation int not null default 1,        -- 2 = régénération gratuite
  storage_path text,                        -- clé de l'objet dans le bucket R2 `songs`
  duration_seconds int,
  status song_status not null default 'queued',
  attempts int not null default 0,
  error text,
  created_at timestamptz not null default now(),
  unique (order_id, version, generation)
);

-- Événements de l'entonnoir, pour les compteurs du back-office (PRD §7).
-- Aucune donnée personnelle : seulement le type d'événement et, si elle existe, la commande.
create table events (
  id bigint generated always as identity primary key,
  type text not null check (type in ('form_started', 'lyrics_generated', 'payment_started', 'payment_succeeded')),
  order_id uuid references orders(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Auth.js (adaptateur Drizzle) : connexion par Google ou lien magique, clients et back-office.
-- Le back-office reste réservé aux adresses de ADMIN_EMAILS (vérifié côté serveur à chaque page).
create table users (
  id text primary key,
  name text,
  email text unique,
  email_verified timestamptz,
  image text,
  phone text                      -- numéro WhatsApp par défaut, prérempli dans /creer
);

-- Commande rattachée à un compte client (facultatif : on peut commander sans compte).
-- Compte supprimé : la commande reste (comptabilité), le lien est effacé.
alter table orders add column user_id text references users(id) on delete set null;
create index orders_user_id_idx on orders (user_id, created_at desc);

-- Relance des paroles non payées (docs/PLAN_CROISSANCE.md, étape 1).
alter table orders add column reminded_at timestamptz;          -- WhatsApp envoyé à la main (back-office)
alter table orders add column reminder_emailed_at timestamptz;  -- e-mail automatique 1 h après (clients avec espace)

create table accounts (
  user_id text not null references users(id) on delete cascade,
  type text not null,
  provider text not null,
  provider_account_id text not null,
  refresh_token text,
  access_token text,
  expires_at int,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  primary key (provider, provider_account_id)
);

create table sessions (
  session_token text primary key,
  user_id text not null references users(id) on delete cascade,
  expires timestamptz not null
);

create table verification_tokens (
  identifier text not null,
  token text not null,
  expires timestamptz not null,
  primary key (identifier, token)
);

create index on orders (status, created_at desc);
create index on payments (order_id);
create index on songs (order_id);
create index on events (type, created_at desc);

-- updated_at est mis à jour par l'application (Drizzle : $onUpdate) ou par ce trigger.
create or replace function touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger orders_touch before update on orders
for each row execute function touch_updated_at();

-- Sécurité : la base n'est jamais exposée au navigateur (CLAUDE.md règle 8).
-- Le bucket R2 `songs` se crée dans le tableau de bord Cloudflare, en accès privé.
