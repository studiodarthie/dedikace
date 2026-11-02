import "server-only";
import { Resend } from "resend";
import { env } from "@/lib/env";

let resend: Resend | undefined;

/** Alerte envoyée aux adresses de ADMIN_EMAILS. Ne lève jamais d'erreur : une alerte ratée ne doit rien bloquer. */
export async function sendAdminAlert(subject: string, text: string): Promise<void> {
  console.error(`[alerte] ${subject}\n${text}`);
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM || env.ADMIN_EMAILS.length === 0) return;
  try {
    resend ??= new Resend(env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: env.ADMIN_EMAILS,
      subject: `[Dédikace] ${subject}`,
      text,
    });
    if (error) console.error("[alerte] envoi Resend échoué", error.message);
  } catch (error) {
    console.error("[alerte] envoi Resend échoué", error);
  }
}
