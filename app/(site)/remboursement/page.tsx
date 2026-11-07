import type { Metadata } from "next";
import { LegalPage, SupportLink } from "@/components/LegalPage";

// Validé par le porteur du projet le 7 novembre 2026.
export const metadata: Metadata = { title: "Remboursement" };

export default function RefundPage() {
  return (
    <LegalPage title="Politique de remboursement" updated="3 novembre 2026">
      <p>
        Les paroles sont gratuites et tu les valides avant de payer : tu sais ce que tu achètes. Voici ce qui se
        passe si quelque chose ne va pas.
      </p>

      <h2>La chanson ne te plaît pas</h2>
      <p>
        Tu as droit à <strong>une nouvelle création gratuite</strong> par commande, avec les mêmes paroles, depuis
        la page de ta chanson (« La chanson ne me plaît pas »). Une chanson livrée qui ne plaît pas n’est pas
        remboursée.
      </p>

      <h2>On te rembourse si…</h2>
      <ul>
        <li>tu as payé mais ta chanson n’a pas pu être créée, même après notre intervention ;</li>
        <li>tu as été débité deux fois pour la même commande ;</li>
        <li>ta commande a été refusée par notre modération après le paiement.</li>
      </ul>

      <h2>Comment faire</h2>
      <p>
        <SupportLink>Écris-nous sur WhatsApp</SupportLink> avec le code de ta commande et le numéro qui a payé. On
        te répond sous 48 h. Le remboursement est fait sur le même moyen de paiement (Mobile Money ou carte), en
        général sous 7 jours. Les frais de l’opérateur peuvent rester à ta charge.
      </p>
    </LegalPage>
  );
}
