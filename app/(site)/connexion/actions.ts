"use server";

import { z } from "zod";
import { googleEnabled, safeNext, signIn } from "@/lib/auth";

export type LoginState = { error?: string };

export async function loginWithGoogle(formData: FormData): Promise<void> {
  if (!googleEnabled) return;
  await signIn("google", { redirectTo: safeNext(formData.get("suite")) });
}

export async function loginWithEmail(_: LoginState, formData: FormData): Promise<LoginState> {
  const email = z.email().safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!email.success) return { error: "Cette adresse e-mail n'est pas valide." };
  // Redirige vers la page « lien envoyé » (ou vers l'erreur si l'envoi échoue).
  await signIn("resend", { email: email.data, redirectTo: safeNext(formData.get("suite")) });
  return {};
}
