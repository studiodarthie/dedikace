import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { getOrderById } from "@/lib/orders";
import { getLatestPayment } from "@/lib/payments";
import { OrderTracker } from "./OrderTracker";

export const metadata: Metadata = { title: "Ta commande", robots: { index: false, follow: false } };

export default function OrderPage({ params }: PageProps<"/commande/[id]">) {
  return (
    <Suspense fallback={<div className="mt-6 h-72 animate-pulse rounded-3xl bg-sand/60" aria-label="Chargement" />}>
      <OrderContent params={params} />
    </Suspense>
  );
}

async function OrderContent({ params }: { params: PageProps<"/commande/[id]">["params"] }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const order = await getOrderById(id);
  if (!order) notFound();
  const payment = await getLatestPayment(order.id);

  return (
    <OrderTracker
      orderId={order.id}
      initial={{
        status: order.status,
        recipientName: order.recipientName,
        channel: payment?.channel,
        publicCode: order.status === "delivered" ? order.publicCode : undefined,
      }}
      priceXaf={order.priceXaf}
      supportPhone={process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? ""}
    />
  );
}
