// Code navigateur : identifiants des commandes faites sur ce téléphone, pour les rattacher au compte
// à la connexion (voir claimOrders dans lib/account.ts). Rien de secret : c'est déjà le lien /commande/[id].
const KEY = "dedikace:commandes:v1";
const MAX = 30;

export function rememberOrder(orderId: string): void {
  try {
    const list = getRememberedOrders().filter((id) => id !== orderId);
    window.localStorage.setItem(KEY, JSON.stringify([orderId, ...list].slice(0, MAX)));
  } catch {
    // Navigation privée : tant pis, le client retrouvera sa chanson par le lien WhatsApp.
  }
}

export function getRememberedOrders(): string[] {
  try {
    const list: unknown = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(list) ? list.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}
