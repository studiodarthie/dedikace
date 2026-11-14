import type { Metadata } from "next";
import { LoginScreen } from "./LoginScreen";

export const metadata: Metadata = { title: "Connexion", robots: { index: false, follow: false } };

export default function LoginPage({ searchParams }: PageProps<"/connexion">) {
  return <LoginScreen searchParams={searchParams} locale="fr" />;
}
