import type { Metadata } from "next";
import { SettingsScreen } from "./SettingsScreen";

export const metadata: Metadata = { title: "Paramètres", robots: { index: false, follow: false } };

export default function SettingsPage() {
  return <SettingsScreen locale="fr" />;
}
