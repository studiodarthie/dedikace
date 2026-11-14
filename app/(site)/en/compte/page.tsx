import type { Metadata } from "next";
import { AccountScreen } from "../../compte/AccountScreen";

export const metadata: Metadata = { title: "My space", robots: { index: false, follow: false } };

export default function AccountPage() {
  return <AccountScreen locale="en" />;
}
