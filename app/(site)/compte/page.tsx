import type { Metadata } from "next";
import { AccountScreen } from "./AccountScreen";

export const metadata: Metadata = { title: "Mon espace", robots: { index: false, follow: false } };

export default function AccountPage() {
  return <AccountScreen locale="fr" />;
}
