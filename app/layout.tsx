import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { env } from "@/lib/env";
import { Pixels } from "@/components/Pixels";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import "./globals.css";

// Une seule police variable : un seul fichier à télécharger en 3G.
const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: { default: "Dédikace — Ton nom dans une chanson", template: "%s · Dédikace" },
  description:
    "Une chanson personnalisée en quelques minutes, sur des rythmes d'Afrique centrale : anniversaire, mariage, dot, hommage, réussite…",
};

export const viewport: Viewport = {
  themeColor: "#e0451b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning : certaines extensions de navigateur ajoutent des attributs à <html>.
    <html lang="fr" className={`${outfit.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col">
        <header className="mx-auto flex w-full max-w-xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-xl font-extrabold tracking-tight text-brand">
            Dédikace<span className="text-gold">.</span>
          </Link>
        </header>
        <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pb-10">{children}</main>
        <footer className="mx-auto w-full max-w-xl px-4 pt-4 pb-24 text-sm text-muted">
          <nav aria-label="Informations légales" className="flex flex-wrap gap-x-4 gap-y-2">
            <Link href="/cgu" className="underline">
              Conditions
            </Link>
            <Link href="/confidentialite" className="underline">
              Confidentialité
            </Link>
            <Link href="/remboursement" className="underline">
              Remboursement
            </Link>
          </nav>
        </footer>
        <WhatsAppButton />
        <Suspense fallback={null}>
          <Pixels />
        </Suspense>
      </body>
    </html>
  );
}
