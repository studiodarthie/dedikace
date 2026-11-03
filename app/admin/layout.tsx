import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Back-office", template: "%s · Back-office Dédikace" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <div className="flex flex-col gap-6 pt-2">{children}</div>;
}
