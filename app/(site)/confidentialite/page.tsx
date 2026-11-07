import type { Metadata } from "next";
import { LegalPage, SUPPORT_PHONE, SupportLink } from "@/components/LegalPage";

// Validé par le porteur du projet le 7 novembre 2026.
export const metadata: Metadata = { title: "Confidentialité" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Politique de confidentialité" updated="7 novembre 2026">
      <p>
        Cette page explique quelles informations Dédikace collecte, pourquoi, et ce que tu peux faire. Le
        responsable est Darthie Studios, 413 rue Drouot, Douala, Cameroun,
        joignable sur WhatsApp au {SUPPORT_PHONE}.
      </p>

      <h2>Ce qu’on collecte</h2>
      <ul>
        <li>ton numéro WhatsApp, pour te contacter au sujet de ta commande ;</li>
        <li>
          ce que tu écris dans le formulaire : l’occasion, les prénoms, la relation et les souvenirs, pour écrire la
          chanson ;
        </li>
        <li>
          les informations de paiement nécessaires au suivi (montant, moyen de paiement, numéro Mobile Money). Les
          données de carte bancaire sont saisies chez Tranzak : on ne les voit jamais ;
        </li>
        <li>
          si tu crées un espace (facultatif) : ton adresse e-mail, ton nom et ta photo de profil Google si tu te
          connectes avec Google, et le prénom et le numéro que tu enregistres, pour retrouver tes chansons ;
        </li>
        <li>des statistiques de visite anonymes (par exemple : combien de formulaires sont commencés).</li>
      </ul>

      <h2>Avec qui on les partage</h2>
      <p>Seulement avec les prestataires qui font fonctionner le service :</p>
      <ul>
        <li>Anthropic (écriture des paroles) et ElevenLabs (création de la musique) ;</li>
        <li>Tranzak (paiement) ;</li>
        <li>Vercel, Neon et Cloudflare (hébergement du site, de la base de données et des chansons) ;</li>
        <li>Resend (e-mails de connexion et e-mails internes) ;</li>
        <li>Google, seulement si tu choisis « Continuer avec Google » ;</li>
        <li>Meta (Facebook, Instagram), seulement si tu acceptes les cookies de mesure (voir ci-dessous).</li>
      </ul>
      <p>Certains de ces prestataires sont situés hors du Cameroun. On ne vend jamais tes données.</p>

      <h2 id="cookies">Cookies</h2>
      <p>
        Le site utilise seulement ce qui est nécessaire pour fonctionner : ton brouillon de chanson et la liste de
        tes commandes gardés sur ton téléphone, et un cookie de connexion si tu as un espace.
      </p>
      <p>
        Avec ton accord, on ajoute des cookies de mesure de Meta (Facebook, Instagram). Ils servent à
        savoir quelles publicités amènent des visiteurs et des commandes. Si tu refuses, ils ne sont pas chargés et
        le site marche pareil. Ton choix est gardé 6 mois. Tu peux le changer à tout moment avec le lien « Cookies »
        en bas de chaque page.
      </p>

      <h2>Combien de temps on les garde</h2>
      <p>
        Ta commande et ta chanson sont conservées 12 mois. Les informations de paiement peuvent être gardées plus
        longtemps si la loi l’exige (comptabilité).
      </p>

      <h2>Ta page de chanson</h2>
      <p>
        Toute personne qui a le lien de ta page peut écouter la chanson. Le lien est difficile à deviner et la page
        n’apparaît pas dans les moteurs de recherche, mais partage-le seulement avec qui tu veux.
      </p>

      <h2>Tes droits</h2>
      <p>
        Tu peux demander à voir, corriger ou supprimer tes informations et ta chanson. Il suffit de{" "}
        <SupportLink>nous écrire sur WhatsApp</SupportLink> avec le code de ta commande. Si tu as un espace, tu peux
        aussi le supprimer toi-même dans Mon espace → Paramètres → Supprimer mon compte.
      </p>
    </LegalPage>
  );
}
