"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getRememberedOrders } from "@/lib/my-orders";
import { claimMyOrders } from "./actions";

/** Rattache au compte les chansons créées sur ce téléphone avant la connexion, puis rafraîchit la liste. */
export function ClaimOrders() {
  const router = useRouter();
  useEffect(() => {
    const ids = getRememberedOrders();
    if (ids.length === 0) return;
    claimMyOrders(ids)
      .then((n) => n > 0 && router.refresh())
      .catch(() => {});
  }, [router]);
  return null;
}
