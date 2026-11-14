import "server-only";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { accounts, sessions, users, verificationTokens } from "@/lib/db/schema";
import { sendMagicLink } from "@/lib/email";
import { env } from "@/lib/env";
import { localeFromPath, localePath } from "@/lib/i18n";

// Comptes clients (docs/PLAN_COMPTES.md) et back-office partagent la même connexion :
// tout le monde peut se connecter, mais seules les adresses de ADMIN_EMAILS ouvrent /admin (requireAdmin).

/** Seules les adresses de ADMIN_EMAILS ont accès au back-office (PRD §7). */
export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && env.ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

export const googleEnabled = !!(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  // Vercel et le serveur local fournissent l'adresse du site : on lui fait confiance.
  trustHost: true,
  // 30 jours : le client reste connecté sur son téléphone.
  session: { strategy: "database", maxAge: 30 * 24 * 60 * 60 },
  providers: [
    ...(googleEnabled
      ? [
          Google({
            clientId: env.AUTH_GOOGLE_ID,
            clientSecret: env.AUTH_GOOGLE_SECRET,
            // Google vérifie l'adresse : même compte qu'avec le lien e-mail envoyé à cette adresse.
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    Resend({
      from: env.EMAIL_FROM,
      maxAge: 24 * 60 * 60,
      sendVerificationRequest: ({ identifier, url }) => sendMagicLink(identifier, url),
    }),
  ],
  callbacks: {
    session: ({ session, user }) => ({ ...session, user: { ...session.user, id: user.id } }),
  },
  pages: {
    signIn: "/connexion",
    verifyRequest: "/connexion?envoye=1",
    error: "/connexion",
  },
});

export type CurrentUser = { id: string; email: string | null; name: string | null };

/** Client connecté, ou null. Toujours lu à la demande. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  await connection();
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  return { id, email: session.user?.email ?? null, name: session.user?.name ?? null };
}

/** Adresse de retour sûre : uniquement un chemin de ce site (jamais « //autre-site »). */
export function safeNext(value: unknown, fallback = "/compte"): string {
  return typeof value === "string" && /^\/(?![/\\])/.test(value) ? value : fallback;
}

/** Pages de l'espace client : renvoie vers /connexion si personne n'est connecté. */
export async function requireUser(next: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`${localePath(localeFromPath(next), "/connexion")}?suite=${encodeURIComponent(next)}`);
  return user;
}

/**
 * À appeler en tête de chaque page et de chaque action du back-office.
 * La liste est revérifiée à chaque fois : retirer une adresse de ADMIN_EMAILS coupe l'accès aussitôt.
 */
export async function requireAdmin(): Promise<{ email: string }> {
  // Toujours lue à la demande : jamais de page admin préparée à l'avance.
  await connection();
  const session = await auth();
  const email = session?.user?.email;
  if (!email) redirect("/connexion?suite=/admin");
  if (!isAdminEmail(email)) redirect("/compte");
  return { email };
}
