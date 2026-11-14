"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { googleEnabled, safeNext, signIn } from "@/lib/auth";
import { localeFromPath, localePath } from "@/lib/i18n";

export type LoginState = { error?: string };

export async function loginWithGoogle(formData: FormData): Promise<void> {
  if (!googleEnabled) return;
  await signIn("google", { redirectTo: safeNext(formData.get("suite")) });
}

export async function loginWithEmail(_: LoginState, formData: FormData): Promise<LoginState> {
  const next = safeNext(formData.get("suite"));
  const locale = localeFromPath(next);
  const email = z.email().safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!email.success) return { error: locale === "en" ? "This email address isn’t valid." : "Cette adresse e-mail n'est pas valide." };
  // Page en anglais : la page « lien envoyé » reste en anglais (Auth.js renverrait vers /connexion).
  if (locale === "en") {
    await signIn("resend", { email: email.data, redirectTo: next, redirect: false });
    redirect(`${localePath("en", "/connexion")}?envoye=1`);
  }
  // Redirige vers la page « lien envoyé » (ou vers l'erreur si l'envoi échoue).
  await signIn("resend", { email: email.data, redirectTo: next });
  return {};
}
