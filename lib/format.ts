/** 3000 → « 3 000 FCFA » (en anglais « 3,000 FCFA ») — montants toujours en entiers XAF. */
export function formatXaf(amount: number, locale: "fr" | "en" = "fr"): string {
  return `${new Intl.NumberFormat(locale === "en" ? "en-GB" : "fr-FR", { maximumFractionDigits: 0 }).format(amount)}\u00a0FCFA`; // espace insécable : « FCFA » ne part jamais seul à la ligne
}

/** Lien wa.me vers le support, avec un message pré-rempli. */
export function whatsappLink(phone: string, text?: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

/** Typographie française : espace insécable avant ? ! : ; » et après «, pour qu'un « ? » ne parte jamais seul à la ligne. */
export function nbsp(text: string): string {
  return text.replace(/ ([?!:;»])/g, "\u00a0$1").replace(/« /g, "«\u00a0");
}
