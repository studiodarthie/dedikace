"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AdminError, markRefunded, relaunchGeneration, validateManualPayment } from "@/lib/admin";
import { requireAdmin, signOut } from "@/lib/auth";

export type ActionState = { ok?: string; error?: string };

export async function logout(): Promise<void> {
  await signOut({ redirectTo: "/connexion" });
}

/** Exécute une action admin après avoir vérifié la session, avec un message clair en cas d'échec. */
async function run(orderId: string, ok: string, action: (email: string) => Promise<void>): Promise<ActionState> {
  const { email } = await requireAdmin();
  if (!z.uuid().safeParse(orderId).success) return { error: "Commande introuvable." };
  try {
    await action(email);
  } catch (error) {
    if (error instanceof AdminError) return { error: error.message };
    console.error("[admin] action échouée", error);
    return { error: "Ça n'a pas marché. Réessaie dans un instant." };
  }
  revalidatePath(`/admin/commandes/${orderId}`);
  return { ok };
}

export async function relaunchAction(orderId: string): Promise<ActionState> {
  return run(orderId, "Création relancée. Recharge la page dans 2 à 3 minutes.", (email) =>
    relaunchGeneration(orderId, email),
  );
}

export async function refundAction(orderId: string): Promise<ActionState> {
  return run(orderId, "Commande marquée remboursée.", (email) => markRefunded(orderId, email));
}

const ManualPayment = z.object({
  amountXaf: z.coerce.number().int().positive().max(1_000_000),
  reference: z.string().trim().min(3).max(100),
});

export async function manualPaymentAction(orderId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const input = ManualPayment.safeParse({ amountXaf: formData.get("amountXaf"), reference: formData.get("reference") });
  if (!input.success) {
    return { error: "Indique le montant reçu (nombre entier en FCFA) et la référence de la transaction Tranzak." };
  }
  return run(orderId, "Paiement validé : la création de la chanson démarre.", (email) =>
    validateManualPayment(orderId, input.data, email),
  );
}
