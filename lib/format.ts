/** 3000 → « 3 000 FCFA » (en anglais « 3,000 FCFA ») — montants toujours en entiers XAF. */
export function formatXaf(amount: number, locale: "fr" | "en" = "fr"): string {
  return `${new Intl.NumberFormat(locale === "en" ? "en-GB" : "fr-FR", { maximumFractionDigits: 0 }).format(amount)} FCFA`;
}

/** Lien wa.me vers le support, avec un message pré-rempli. */
export function whatsappLink(phone: string, text?: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
