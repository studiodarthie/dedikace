import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Back-office", template: "%s · Back-office Dédikace" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  // Plus large que le reste du site sur ordinateur (le tableau de bord a plusieurs colonnes).
  return (
    <div className="relative left-1/2 flex w-[min(64rem,calc(100vw-2rem))] -translate-x-1/2 flex-col gap-6 pt-2">{children}</div>
  );
}
