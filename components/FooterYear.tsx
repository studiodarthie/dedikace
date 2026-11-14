import { cacheLife } from "next/cache";

// Année du copyright : calculée sur le serveur, gardée en cache une journée (passe toute seule au 1er janvier).
async function currentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

export async function FooterYear() {
  return <>{await currentYear()}</>;
}
