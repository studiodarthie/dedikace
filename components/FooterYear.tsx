import { cacheLife } from "next/cache";

// Année du copyright : calculée sur le serveur et gardée en cache jusqu'au 1er janvier suivant
// (un recalcul réécrit toutes les pages dans le cache Vercel, on l'évite au maximum).
async function currentYear() {
  "use cache";
  const now = new Date();
  const year = now.getFullYear();
  const untilNewYear = Math.ceil((Date.UTC(year + 1, 0, 1) - now.getTime()) / 1000) + 60;
  cacheLife({ stale: 300, revalidate: untilNewYear, expire: untilNewYear + 30 * 24 * 3600 });
  return year;
}

export async function FooterYear() {
  return <>{await currentYear()}</>;
}
