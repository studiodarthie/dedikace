import type { Metadata } from "next";
import { LoginScreen } from "../../connexion/LoginScreen";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default function LoginPage({ searchParams }: PageProps<"/en/connexion">) {
  return <LoginScreen searchParams={searchParams} locale="en" />;
}
