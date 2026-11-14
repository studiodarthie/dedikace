import type { Metadata } from "next";
import { SettingsScreen } from "../../../compte/parametres/SettingsScreen";

export const metadata: Metadata = { title: "Settings", robots: { index: false, follow: false } };

export default function SettingsPage() {
  return <SettingsScreen locale="en" />;
}
