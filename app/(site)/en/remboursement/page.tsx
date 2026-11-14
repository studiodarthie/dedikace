import type { Metadata } from "next";
import { LegalPage, SupportLink } from "@/components/LegalPage";
import { alternates } from "@/lib/i18n";

// Traduction de la politique de remboursement (la version française fait foi).
export const metadata: Metadata = {
  title: "Refunds",
  description: "Free new creation and refund cases at Dédikace.",
  alternates: alternates("en", "/remboursement"),
};

export default function RefundPage() {
  return (
    <LegalPage title="Refund policy" updated="3 November 2026" locale="en">
      <p>
        The lyrics are free and you approve them before paying: you know what you’re buying. Here is what happens if
        something goes wrong.
      </p>

      <h2>You don’t like the song</h2>
      <p>
        You get <strong>one free new creation</strong> per order, with the same lyrics, from your song’s page (“I don’t
        like the song”). A delivered song you don’t like is not refunded.
      </p>

      <h2>We refund you if…</h2>
      <ul>
        <li>you paid but your song couldn’t be created, even after our intervention;</li>
        <li>you were charged twice for the same order;</li>
        <li>your order was refused by our moderation after payment.</li>
      </ul>

      <h2>How to ask</h2>
      <p>
        <SupportLink>Message us on WhatsApp</SupportLink> with your order code and the number that paid. We reply within
        48 hours. The refund goes back to the same payment method (Mobile Money or card), usually within 7 days. Operator
        fees may remain at your expense.
      </p>
    </LegalPage>
  );
}
