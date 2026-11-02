import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import Link from "next/link";
import { env } from "@/lib/env";
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
    <html lang="fr" className={`${outfit.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <header className="mx-auto flex w-full max-w-xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-xl font-extrabold tracking-tight text-brand">
            Dédikace<span className="text-gold">.</span>
          </Link>
        </header>
        <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pb-24">{children}</main>
        <WhatsAppButton />
      </body>
    </html>
  );
}
