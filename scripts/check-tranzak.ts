// Vérifie les clés Tranzak sans créer de paiement : npm run check:tranzak
import { checkCredentials } from "@/lib/tranzak";
import { env } from "@/lib/env";

async function main() {
  await checkCredentials();
  console.log(`✓ Clés Tranzak acceptées (mode ${env.TRANZAK_MODE}).`);
  console.log(env.TRANZAK_WEBHOOK_AUTH_KEY ? "✓ Clé du webhook renseignée." : "✗ TRANZAK_WEBHOOK_AUTH_KEY manquante.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(`✗ ${e instanceof Error ? e.message : e}`);
    process.exit(1);
  });
