// Exécuté une fois au démarrage du serveur : on valide les variables d'environnement
// tout de suite, pour qu'une clé manquante se voie au lancement et pas au premier client.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("@/lib/env");
  }
}
