/** 3000 → « 3 000 FCFA » (montants toujours en entiers XAF). */
export function formatXaf(amount: number): string {
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(amount)} FCFA`;
}

/** Lien wa.me vers le support, avec un message pré-rempli. */
export function whatsappLink(phone: string, text?: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
