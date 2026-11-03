// Toutes les pages sauf l'accueil : une colonne étroite, pensée pour le téléphone.
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return <div className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pt-4 pb-10">{children}</div>;
}
