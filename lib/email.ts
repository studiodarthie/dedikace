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

/** Lien magique de connexion au back-office (Auth.js). Lève une erreur si l'envoi échoue. */
export async function sendMagicLink(to: string, url: string): Promise<void> {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    throw new Error("RESEND_API_KEY et EMAIL_FROM doivent être renseignées pour se connecter au back-office.");
  }
  resend ??= new Resend(env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject: "Ton lien de connexion à Dédikace",
    text: `Clique sur ce lien pour ouvrir le back-office Dédikace :\n${url}\n\nIl est valable 24 h et ne sert qu'une fois. Si tu n'as rien demandé, ignore cet e-mail.`,
    html: `<p>Clique sur ce bouton pour ouvrir le back-office Dédikace :</p>
<p><a href="${url}" style="display:inline-block;padding:12px 20px;background:#e0451b;color:#fff;border-radius:999px;text-decoration:none;font-weight:bold">Me connecter</a></p>
<p style="color:#666;font-size:13px">Le lien est valable 24 h et ne sert qu'une fois. Si tu n'as rien demandé, ignore cet e-mail.</p>`,
  });
  if (error) throw new Error(`Envoi du lien de connexion échoué : ${error.message}`);
}
