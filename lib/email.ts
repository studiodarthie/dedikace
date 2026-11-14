import "server-only";
import { Resend } from "resend";
import { env } from "@/lib/env";

let resend: Resend | undefined;

/** Logo en tête des e-mails clients (PNG : Gmail n'affiche pas le SVG). */
const logo = () =>
  `<p><img src="${env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/brand/logo-email.png" width="150" height="35" alt="Dédikace" style="display:block;border:0"></p>`;

/** Alerte envoyée aux adresses de ADMIN_EMAILS. Ne lève jamais d'erreur : une alerte ratée ne doit rien bloquer. */
export async function sendAdminAlert(subject: string, text: string): Promise<void> {
  console.error(`[alerte] ${subject}\n${text}`);
  await sendAdminEmail(subject, text);
}

/** Information pour l'équipe (ex. nouvelle vente). Ne lève jamais d'erreur. */
export async function sendAdminNotice(subject: string, text: string): Promise<void> {
  console.info(`[info] ${subject}`);
  await sendAdminEmail(subject, text);
}

async function sendAdminEmail(subject: string, text: string): Promise<void> {
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

/** « Ta chanson est prête » (clients avec un espace). Lève une erreur si l'envoi échoue. */
export async function sendSongReady(to: string, data: { firstName: string | null; recipientName: string; url: string }): Promise<void> {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) throw new Error("RESEND_API_KEY et EMAIL_FROM manquantes.");
  resend ??= new Resend(env.RESEND_API_KEY);
  const hello = data.firstName ? `Salut ${data.firstName} 👋` : "Salut 👋";
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject: `🎶 La chanson pour ${data.recipientName} est prête !`,
    text: [hello, "", `La chanson pour ${data.recipientName} est prête : 2 versions à écouter et à partager.`, data.url, "", "Pense à la vidéo pour ton statut WhatsApp, sur la même page.", "", "L'équipe Dédikace"].join("\n"),
    html: `${logo()}<p>${esc(hello)}</p><p>La chanson pour <strong>${esc(data.recipientName)}</strong> est prête : 2 versions à écouter et à partager.</p>
<p><a href="${data.url}" style="display:inline-block;padding:12px 20px;background:#e0451b;color:#fff;border-radius:999px;text-decoration:none;font-weight:bold">Écouter ma chanson</a></p>
<p style="color:#666;font-size:13px">Pense à la vidéo pour ton statut WhatsApp, sur la même page. L'équipe Dédikace</p>`,
  });
  if (error) throw new Error(`E-mail « chanson prête » échoué : ${error.message}`);
}

/** Relance d'une commande non payée (clients avec un espace). Lève une erreur si l'envoi échoue. */
export async function sendPaymentReminder(
  to: string,
  data: { firstName: string | null; recipientName: string; url: string; failed: boolean },
): Promise<void> {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) throw new Error("RESEND_API_KEY et EMAIL_FROM manquantes.");
  resend ??= new Resend(env.RESEND_API_KEY);
  const hello = data.firstName ? `Salut ${data.firstName} 👋` : "Salut 👋";
  const line = data.failed
    ? `Ton paiement n'est pas passé, mais tes paroles pour ${data.recipientName} sont bien gardées.`
    : `Les paroles de ta chanson pour ${data.recipientName} sont prêtes et elles t'attendent.`;
  const support = env.NEXT_PUBLIC_SUPPORT_WHATSAPP;
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject: data.failed ? "Ton paiement n'est pas passé : tes paroles t'attendent" : `Ta chanson pour ${data.recipientName} t'attend 🎶`,
    text: [
      hello,
      "",
      line,
      "Tu peux les relire et lancer ta chanson ici :",
      data.url,
      "",
      `Une question ? Écris-nous sur WhatsApp au ${support}.`,
      "",
      "L'équipe Dédikace",
    ].join("\n"),
    html: `${logo()}<p>${esc(hello)}</p><p>${esc(line)}</p>
<p><a href="${data.url}" style="display:inline-block;padding:12px 20px;background:#e0451b;color:#fff;border-radius:999px;text-decoration:none;font-weight:bold">Lancer ma chanson</a></p>
<p style="color:#666;font-size:13px">Une question ? Écris-nous sur WhatsApp au ${esc(support)}. L'équipe Dédikace</p>`,
  });
  if (error) throw new Error(`Relance par e-mail échouée : ${error.message}`);
}

/** Lien magique de connexion (espace client et back-office, Auth.js). Lève une erreur si l'envoi échoue. */
export async function sendMagicLink(to: string, url: string): Promise<void> {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    throw new Error("RESEND_API_KEY et EMAIL_FROM doivent être renseignées pour la connexion par e-mail.");
  }
  resend ??= new Resend(env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject: "Ton lien de connexion à Dédikace",
    text: `Clique sur ce lien pour te connecter à ton espace Dédikace :\n${url}\n\nIl est valable 24 h et ne sert qu'une fois. Si tu n'as rien demandé, ignore cet e-mail.`,
    html: `${logo()}<p>Clique sur ce bouton pour te connecter à ton espace Dédikace :</p>
<p><a href="${url}" style="display:inline-block;padding:12px 20px;background:#e0451b;color:#fff;border-radius:999px;text-decoration:none;font-weight:bold">Me connecter</a></p>
<p style="color:#666;font-size:13px">Le lien est valable 24 h et ne sert qu'une fois. Si tu n'as rien demandé, ignore cet e-mail.</p>`,
  });
  if (error) throw new Error(`Envoi du lien de connexion échoué : ${error.message}`);
}
