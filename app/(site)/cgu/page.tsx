import type { Metadata } from "next";
import { LegalPage, SUPPORT_PHONE, SupportLink } from "@/components/LegalPage";
import { env } from "@/lib/env";
import { formatXaf } from "@/lib/format";

// À FAIRE RELIRE par un juriste avant le lancement public (docs/PLAN_DEV.md, checklist).
export const metadata: Metadata = { title: "Conditions générales" };

export default function CguPage() {
  return (
    <LegalPage title="Conditions générales d’utilisation et de vente" updated="7 novembre 2026">
      <p>
        Dédikace est un service édité par Darthie Studios, 413 rue Drouot, Douala, Cameroun,
        joignable sur WhatsApp au {SUPPORT_PHONE}. En commandant une chanson, tu acceptes les conditions ci-dessous.
      </p>

      <h2>1. Le service</h2>
      <p>
        Dédikace crée des chansons personnalisées à l’aide de l’intelligence artificielle, à partir des informations
        que tu fournis (occasion, prénoms, souvenirs). Les paroles te sont proposées gratuitement ; tu peux les
        modifier ou les faire réécrire avant de payer. Après paiement, tu reçois 2 versions d’environ 3 minutes
        chacune, sur une page que tu peux partager.
      </p>
      <p>
        Les paroles sont écrites avec Claude (Anthropic) et la musique est créée avec Eleven Music (ElevenLabs),
        par leurs services officiels. Chaque chanson est relue automatiquement avant sa création (voir l’article 3).
      </p>

      <h2>2. Prix et paiement</h2>
      <p>
        Une chanson coûte {formatXaf(env.PRICE_MOMO_XAF)} par MTN Mobile Money ou Orange Money, et{" "}
        {formatXaf(env.PRICE_CARD_XAF)} par carte bancaire. Le paiement est traité par notre prestataire Tranzak.
        La création démarre uniquement quand le paiement est confirmé.
      </p>

      <h2>3. Ce que tu peux demander</h2>
      <p>Pour protéger tout le monde, on refuse les demandes qui contiennent :</p>
      <ul>
        <li>des insultes, des moqueries ou du harcèlement ;</li>
        <li>du contenu sexuel ;</li>
        <li>de la politique ;</li>
        <li>le nom de personnalités publiques, ou l’imitation d’artistes réels.</li>
      </ul>
      <p>
        Tu t’engages à ne parler que de personnes qui seraient d’accord, et à ne pas partager d’informations
        privées sur elles.
      </p>

      <h2>4. Utilisation de ta chanson</h2>
      <p>
        Tu peux écouter ta chanson, la télécharger et la partager librement (WhatsApp, réseaux sociaux, fêtes,
        cérémonies) pour un usage personnel. Elle ne doit pas être vendue ni utilisée à des fins commerciales sans
        notre accord. La chanson est créée par une IA : elle peut ressembler par hasard à d’autres musiques, et on
        ne garantit pas de droits exclusifs dessus.
      </p>

      <h2>5. Délais et conservation</h2>
      <p>
        La chanson est prête en quelques minutes en général. Tes fichiers MP3 restent disponibles pendant 12 mois
        sur ta page : pense à les télécharger.
      </p>

      <h2>6. Si quelque chose ne va pas</h2>
      <p>
        Tu as droit à une nouvelle création gratuite par commande, depuis la page de ta chanson. Pour le reste,
        consulte notre politique de remboursement, ou <SupportLink>écris-nous sur WhatsApp</SupportLink>.
      </p>

      <h2>7. Responsabilité</h2>
      <p>
        On fait de notre mieux pour que le service fonctionne bien, mais il peut être interrompu (panne, opérateur
        Mobile Money indisponible…). Notre responsabilité est limitée au prix payé pour la commande concernée.
      </p>

      <h2>8. Droit applicable</h2>
      <p>
        Ces conditions sont soumises au droit camerounais. En cas de désaccord, on cherche d’abord une solution
        amiable avec toi.
      </p>
    </LegalPage>
  );
}
