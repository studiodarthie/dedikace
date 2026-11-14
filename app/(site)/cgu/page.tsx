import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY, LegalPage, SUPPORT_PHONE, SupportLink } from "@/components/LegalPage";
import { formatXaf } from "@/lib/format";
import { currentPrices } from "@/lib/pricing";

// Version courte, voulue par le porteur du projet le 14 novembre 2026 (pas de relecture par un juriste).
// On ne cite pas les outils techniques utilisés : seul l'hébergeur figure aux mentions légales (obligation légale).
export const metadata: Metadata = {
  title: "Conditions générales",
  description: "Les conditions d'utilisation et de vente de Dédikace, en clair.",
  alternates: { canonical: "/cgu" },
};

export default async function CguPage() {
  const prices = await currentPrices();
  return (
    <LegalPage title="Conditions générales" updated="14 novembre 2026">
      <p>
        Dédikace est édité par {COMPANY.name}. En utilisant le site ou en commandant une chanson, tu acceptes ces
        conditions.
      </p>

      <h2>1. Le service</h2>
      <p>
        Dédikace crée des chansons personnalisées avec l’intelligence artificielle, à partir de ce que tu nous
        racontes. Les paroles sont gratuites et tu les valides avant de payer. Après paiement, tu reçois 2 versions
        de ta chanson sur une page à partager.
      </p>

      <h2>2. Prix et paiement</h2>
      <p>
        Le prix est affiché avant le paiement ({formatXaf(prices.momo)} par Mobile Money
        {prices.launchEnds ? ` pendant l’offre de lancement, jusqu’au ${prices.launchEnds}` : " au moment de cette mise à jour"}). Le paiement passe par un prestataire sécurisé : on ne voit jamais ton code secret ni ta carte. La
        création démarre dès que le paiement est confirmé.
      </p>

      <h2>3. Ce qui est interdit</h2>
      <p>
        Les insultes, le harcèlement, le contenu sexuel, la politique, les personnalités publiques et l’imitation
        d’artistes réels. Parle seulement de personnes qui seraient d’accord. On peut refuser une demande qui ne
        respecte pas ces règles.
      </p>

      <h2>4. Ta chanson</h2>
      <p>
        Tu peux l’écouter, la télécharger et la partager librement pour un usage personnel (famille, fêtes, réseaux
        sociaux). Pour un usage commercial, demande-nous d’abord. Comme toute création par IA, elle peut ressembler
        par hasard à une autre musique : on ne garantit pas d’exclusivité. Elle reste disponible 12 mois sur ta page.
      </p>

      <h2>5. Si ça ne va pas</h2>
      <p>
        Tu as droit à une nouvelle création gratuite par commande. Les cas de remboursement sont expliqués dans
        notre <Link href="/remboursement">politique de remboursement</Link>. Pour toute question,{" "}
        <SupportLink>écris-nous sur WhatsApp</SupportLink>.
      </p>

      <h2>6. Responsabilité</h2>
      <p>
        On fait tout pour que le service marche, mais il peut parfois être interrompu. Notre responsabilité est
        limitée au prix payé pour la commande concernée.
      </p>

      <h2>7. Droit applicable</h2>
      <p>Ces conditions relèvent du droit camerounais. En cas de désaccord, on cherche d’abord une solution amiable.</p>

      <h2 id="mentions-legales">Mentions légales</h2>
      <ul>
        <li>
          Éditeur : {COMPANY.name}, {COMPANY.address}. NIU : {COMPANY.niu}.
        </li>
        <li>Contact : WhatsApp {SUPPORT_PHONE}.</li>
        <li>Hébergeur : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.</li>
      </ul>
    </LegalPage>
  );
}
