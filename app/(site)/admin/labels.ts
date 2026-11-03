import type { OrderStatus } from "@/lib/db/schema";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  draft: "Brouillon",
  lyrics_ready: "Paroles prêtes",
  pending_payment: "Paiement en attente",
  paid: "Payée",
  generating: "Création en cours",
  delivered: "Livrée",
  payment_failed: "Paiement échoué",
  generation_failed: "Création échouée",
  refunded: "Remboursée",
};

export const STATUS_COLORS: Partial<Record<OrderStatus, string>> = {
  delivered: "bg-leaf/15 text-leaf",
  paid: "bg-gold/25 text-ink",
  generating: "bg-gold/25 text-ink",
  payment_failed: "bg-brand/15 text-brand-dark",
  generation_failed: "bg-brand text-white",
  refunded: "bg-ink/10 text-muted",
};

export const CHANNEL_LABELS: Record<string, string> = {
  mtn: "MTN MoMo",
  orange: "Orange Money",
  card: "Carte",
  manual: "Manuel",
};

const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Africa/Douala",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

/** Date et heure de Douala : « 03/11 14:05 ». */
export function formatDate(date: Date | null | undefined): string {
  return date ? dateFormat.format(date) : "—";
}
