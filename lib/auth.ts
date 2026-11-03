import "server-only";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { accounts, sessions, users, verificationTokens } from "@/lib/db/schema";
import { sendMagicLink } from "@/lib/email";
import { env } from "@/lib/env";

/** Seules les adresses de ADMIN_EMAILS ont accès au back-office (PRD §7). */
export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && env.ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  // Vercel et le serveur local fournissent l'adresse du site : on lui fait confiance.
  trustHost: true,
  session: { strategy: "database", maxAge: 7 * 24 * 60 * 60 },
  providers: [
    Resend({
      from: env.EMAIL_FROM,
      maxAge: 24 * 60 * 60,
      sendVerificationRequest: ({ identifier, url }) => sendMagicLink(identifier, url),
    }),
  ],
  callbacks: {
    // Appelé avant l'envoi du lien ET au clic : une adresse hors liste ne reçoit jamais de lien.
    signIn: ({ user }) => isAdminEmail(user.email),
  },
  pages: {
    signIn: "/admin/connexion",
    verifyRequest: "/admin/connexion?envoye=1",
    error: "/admin/connexion",
  },
});

/**
 * À appeler en tête de chaque page et de chaque action du back-office.
 * La liste est revérifiée à chaque fois : retirer une adresse de ADMIN_EMAILS coupe l'accès aussitôt.
 */
export async function requireAdmin(): Promise<{ email: string }> {
  // Toujours lue à la demande : jamais de page admin préparée à l'avance.
  await connection();
  const session = await auth();
  const email = session?.user?.email;
  if (!isAdminEmail(email)) redirect("/admin/connexion");
  return { email: email! };
}
