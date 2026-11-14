import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { getOrderById } from "@/lib/orders";
import { pricesAt } from "@/lib/pricing";
import { getLatestPayment } from "@/lib/payments";
import { OrderTracker } from "./OrderTracker";

const PAID = new Set(["paid", "generating", "delivered", "generation_failed"]);

export const metadata: Metadata = { title: "Ta commande", robots: { index: false, follow: false } };

export default function OrderPage({ params }: PageProps<"/commande/[id]">) {
  return (
    <Suspense fallback={<div className="mt-6 h-72 animate-pulse rounded-3xl bg-sand/60" aria-label="Chargement" />}>
      <OrderContent params={params} />
    </Suspense>
  );
}

async function OrderContent({ params }: { params: PageProps<"/commande/[id]">["params"] }) {
  await connection(); // Page propre à chaque commande, jamais pré-rendue.
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const order = await getOrderById(id);
  if (!order) notFound();
  const [payment, user] = await Promise.all([getLatestPayment(order.id), getCurrentUser()]);
  const prices = pricesAt(new Date());
  const toPay = (order.status === "lyrics_ready" || order.status === "payment_failed") && order.lyrics;

  return (
    <OrderTracker
      orderId={order.id}
      initial={{
        status: order.status,
        recipientName: order.recipientName,
        channel: payment?.channel,
        publicCode: PAID.has(order.status) ? order.publicCode : undefined,
        paidAt: payment?.status === "successful" ? payment.verifiedAt?.toISOString() : undefined,
      }}
      priceXaf={order.priceXaf}
      supportPhone={process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? ""}
      signedIn={!!user}
      appUrl={env.NEXT_PUBLIC_APP_URL}
      pay={
        toPay
          ? {
              title: order.title ?? "",
              lyrics: order.lyrics ?? "",
              whatsappPhone: order.whatsappPhone,
              priceMomo: prices.momo,
              priceCard: prices.card,
            }
          : undefined
      }
    />
  );
}
