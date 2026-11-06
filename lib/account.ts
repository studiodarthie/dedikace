import "server-only";
import { and, desc, eq, inArray, isNull, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, users } from "@/lib/db/schema";

// Espace client (docs/PLAN_COMPTES.md) : lecture et écriture réservées au compte connecté.

export type MyOrder = Pick<
  typeof orders.$inferSelect,
  "id" | "publicCode" | "recipientName" | "occasion" | "title" | "status" | "createdAt"
>;

/** Commandes du compte, la plus récente d'abord. Les brouillons sans paroles ne sont pas montrés. */
export async function listMyOrders(userId: string): Promise<MyOrder[]> {
  return db
    .select({
      id: orders.id,
      publicCode: orders.publicCode,
      recipientName: orders.recipientName,
      occasion: orders.occasion,
      title: orders.title,
      status: orders.status,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(and(eq(orders.userId, userId), ne(orders.status, "draft")))
    .orderBy(desc(orders.createdAt))
    .limit(100);
}

/**
 * Rattache au compte les commandes faites sur ce téléphone avant la connexion.
 * Connaître l'identifiant (aléatoire, jamais affiché) prouve qu'on a fait la commande :
 * c'est déjà lui qui ouvre la page /commande/[id]. Une commande déjà rattachée à un compte ne bouge pas.
 * Jamais de rattachement par numéro de téléphone : n'importe qui pourrait taper celui d'un autre.
 */
export async function claimOrders(userId: string, orderIds: string[]): Promise<number> {
  if (orderIds.length === 0) return 0;
  const claimed = await db
    .update(orders)
    .set({ userId })
    .where(and(inArray(orders.id, orderIds.slice(0, 50)), isNull(orders.userId)))
    .returning({ id: orders.id });
  return claimed.length;
}

export type Profile = { name: string | null; email: string | null; phone: string | null };

export async function getProfile(userId: string): Promise<Profile | undefined> {
  const [row] = await db
    .select({ name: users.name, email: users.email, phone: users.phone })
    .from(users)
    .where(eq(users.id, userId));
  return row;
}

export async function updateProfile(userId: string, profile: { name: string | null; phone: string | null }) {
  await db.update(users).set(profile).where(eq(users.id, userId));
}

/** Supprime le compte et ses sessions. Les commandes restent (comptabilité) mais ne sont plus liées à personne. */
export async function deleteAccount(userId: string): Promise<void> {
  await db.delete(users).where(eq(users.id, userId));
}
