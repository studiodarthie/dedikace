import type { Metadata } from "next";
import { LegalPage, SUPPORT_PHONE, SupportLink } from "@/components/LegalPage";
import { alternates } from "@/lib/i18n";

// Traduction de la politique de confidentialité (la version française fait foi).
export const metadata: Metadata = {
  title: "Privacy",
  description: "What information Dédikace collects, why, and your rights.",
  alternates: alternates("en", "/confidentialite"),
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" updated="14 November 2026" locale="en">
      <p>
        This page explains what information Dédikace collects, why, and what you can do. The controller is Darthie
        Studios, 413 rue Drouot, Douala, Cameroon, reachable on WhatsApp at {SUPPORT_PHONE}.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>your WhatsApp number, to contact you about your order;</li>
        <li>what you write in the form: the occasion, the names, the relationship and the memories, to write the song;</li>
        <li>
          the payment information needed for follow-up (amount, payment method, Mobile Money number). Bank card details
          are entered with our payment provider: we never see them;
        </li>
        <li>
          if you create a space (optional): your email address, your Google name and profile photo if you sign in with
          Google, and the first name and number you save, to find your songs;
        </li>
        <li>anonymous visit statistics (for example: how many forms are started).</li>
      </ul>

      <h2>Who we share it with</h2>
      <p>Only with the providers that run the service:</p>
      <ul>
        <li>our artificial intelligence tools (writing the lyrics and creating the music);</li>
        <li>our payment provider;</li>
        <li>our hosts (site, data and audio files);</li>
        <li>our email sending service;</li>
        <li>Google, only if you choose “Continue with Google”;</li>
        <li>Meta (Facebook, Instagram), only if you accept measurement cookies (see below).</li>
      </ul>
      <p>Some of these providers are located outside Cameroon. We never sell your data.</p>

      <h2 id="cookies">Cookies</h2>
      <p>
        The site only uses what it needs to work: your song draft and your list of orders kept on your phone, a cookie
        remembering your language, and a sign-in cookie if you have a space.
      </p>
      <p>
        With your consent, we add Meta measurement cookies (Facebook, Instagram). They tell us which ads bring visitors
        and orders. If you refuse, they are not loaded and the site works the same. Your choice is kept for 6 months.
        You can change it at any time with the “Cookies” link at the bottom of each page.
      </p>

      <h2>How long we keep it</h2>
      <p>
        Your order and your song are kept for 12 months. Payment information may be kept longer if the law requires it
        (accounting).
      </p>

      <h2>Your song page</h2>
      <p>
        Anyone who has the link to your page can listen to the song. The link is hard to guess and the page doesn’t
        appear in search engines, but only share it with people you choose.
      </p>

      <h2>Your rights</h2>
      <p>
        You can ask to see, correct or delete your information and your song. Just{" "}
        <SupportLink>message us on WhatsApp</SupportLink> with your order code. If you have a space, you can also delete
        it yourself in My space → Settings → Delete my account.
      </p>
    </LegalPage>
  );
}
