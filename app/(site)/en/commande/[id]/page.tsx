import type { Metadata } from "next";
import OrderPage from "../../../commande/[id]/page";

// Même page que /commande/[id] : les textes suivent l'adresse (/en/…).
export const metadata: Metadata = { title: "Your order", robots: { index: false, follow: false } };

export default function Page(props: PageProps<"/en/commande/[id]">) {
  return <OrderPage {...props} />;
}
