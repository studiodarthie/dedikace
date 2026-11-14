import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY, LegalPage, SUPPORT_PHONE, SupportLink } from "@/components/LegalPage";
import { formatXaf } from "@/lib/format";
import { alternates } from "@/lib/i18n";
import { currentPrices } from "@/lib/pricing";

// Traduction des conditions générales (la version française fait foi).
export const metadata: Metadata = {
  title: "Terms and conditions",
  description: "Dédikace’s terms of use and sale, in plain words.",
  alternates: alternates("en", "/cgu"),
};

export default async function TermsPage() {
  const prices = await currentPrices();
  return (
    <LegalPage title="Terms and conditions" updated="14 November 2026" locale="en">
      <p>
        Dédikace is published by {COMPANY.name}. By using the site or ordering a song, you accept these terms.
      </p>

      <h2>1. The service</h2>
      <p>
        Dédikace creates personalised songs with artificial intelligence, based on what you tell us. The lyrics are
        free and you approve them before paying. After payment, you get 2 versions of your song on a page to share.
      </p>

      <h2>2. Price and payment</h2>
      <p>
        The price is shown before payment ({formatXaf(prices.momo, "en")} by Mobile Money
        {prices.launchEndsEn ? ` during the launch offer, until ${prices.launchEndsEn}` : " at the time of this update"}). Payment goes
        through a secure provider: we never see your PIN or your card. Creation starts as soon as the payment is
        confirmed.
      </p>

      <h2>3. What is not allowed</h2>
      <p>
        Insults, harassment, sexual content, politics, public figures and imitating real artists. Only talk about
        people who would agree. We can refuse a request that doesn’t follow these rules.
      </p>

      <h2>4. Your song</h2>
      <p>
        You can listen to it, download it and share it freely for personal use (family, parties, social media). For
        commercial use, ask us first. Like any AI creation, it may sound like another piece of music by chance: we
        don’t guarantee exclusivity. It stays available for 12 months on your page.
      </p>

      <h2>5. If something is wrong</h2>
      <p>
        You get one free new creation per order. Refund cases are explained in our{" "}
        <Link href="/en/remboursement">refund policy</Link>. For any question, <SupportLink>message us on WhatsApp</SupportLink>.
      </p>

      <h2>6. Liability</h2>
      <p>
        We do everything to keep the service running, but it may sometimes be interrupted. Our liability is limited to
        the price paid for the order concerned.
      </p>

      <h2>7. Applicable law</h2>
      <p>These terms are governed by Cameroonian law. In case of disagreement, we first look for an amicable solution.</p>

      <h2 id="mentions-legales">Legal notice</h2>
      <ul>
        <li>
          Publisher: {COMPANY.name}, {COMPANY.address}. NIU: {COMPANY.niu}.
        </li>
        <li>Contact: WhatsApp {SUPPORT_PHONE}.</li>
        <li>Host: Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, United States.</li>
      </ul>
    </LegalPage>
  );
}
