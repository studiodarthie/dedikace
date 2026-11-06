"use server";

import { z } from "zod";
import { claimOrders, deleteAccount, updateProfile } from "@/lib/account";
import { getCurrentUser, signOut } from "@/lib/auth";

export async function claimMyOrders(orderIds: string[]): Promise<number> {
  const user = await getCurrentUser();
  if (!user) return 0;
  const ids = z.array(z.uuid()).max(50).safeParse(orderIds);
  if (!ids.success) return 0;
  try {
    return await claimOrders(user.id, ids.data);
  } catch (error) {
    console.error("[compte] rattachement échoué", error);
    return 0;
  }
}

export type ProfileState = { ok?: string; error?: string };

const ProfileInput = z.object({
  name: z.string().trim().max(40, "Ton prénom : 40 caractères au maximum."),
  phone: z
    .string()
    .transform((v) => v.replace(/[\s.\-()]/g, ""))
    .pipe(z.union([z.literal(""), z.string().regex(/^\+[1-9]\d{7,14}$/, "Numéro au format international, par exemple +237 6XX XX XX XX.")])),
});

export async function saveProfile(_: ProfileState, formData: FormData): Promise<ProfileState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Ta session a expiré. Reconnecte-toi." };
  const input = ProfileInput.safeParse({ name: formData.get("name") ?? "", phone: formData.get("phone") ?? "" });
  if (!input.success) return { error: input.error.issues[0]?.message ?? "Vérifie les informations." };
  try {
    await updateProfile(user.id, { name: input.data.name || null, phone: input.data.phone || null });
  } catch (error) {
    console.error("[compte] profil non enregistré", error);
    return { error: "Ça n'a pas marché. Réessaie dans un instant." };
  }
  return { ok: "C'est enregistré !" };
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}

export async function deleteMyAccount(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user || formData.get("confirm") !== "oui") return;
  await deleteAccount(user.id);
  await signOut({ redirectTo: "/" });
}
