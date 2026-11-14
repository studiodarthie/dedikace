"use client";

import { whatsappLink } from "@/lib/format";
import { useLocale } from "@/lib/use-locale";

const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "";

/** Bouton de support flottant, présent sur toutes les pages (PLAN_DEV prompt 5). */
export function WhatsAppButton() {
  const en = useLocale() === "en";
  if (!/^\+\d{8,15}$/.test(SUPPORT_PHONE)) return null;
  return (
    <a
      href={whatsappLink(SUPPORT_PHONE, en ? "Hello Dédikace, I have a question:" : "Bonjour Dédikace, j'ai une question :")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={en ? "Message support on WhatsApp" : "Écrire au support sur WhatsApp"}
      className="fixed right-4 bottom-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-lg shadow-black/20 transition active:scale-95"
    >
      <svg viewBox="0 0 32 32" aria-hidden="true" className="h-8 w-8 fill-current">
        <path d="M16.04 3C9.4 3 4 8.36 4 14.97c0 2.3.66 4.46 1.8 6.3L4 29l7.93-1.76A12.1 12.1 0 0 0 16.04 27C22.68 27 28 21.62 28 15S22.68 3 16.04 3Zm0 21.8c-1.86 0-3.6-.5-5.1-1.38l-.36-.21-4.7 1.05 1.06-4.53-.24-.38a9.7 9.7 0 0 1-1.5-5.2c0-5.4 4.4-9.8 9.84-9.8 5.4 0 9.8 4.4 9.8 9.8 0 5.43-4.4 10.65-8.8 10.65Zm5.38-7.33c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.6.13-.14.3-.35.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.57-.48-.5-.67-.5h-.57c-.2 0-.52.08-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.48.71.31 1.27.5 1.7.63.71.23 1.36.2 1.88.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Z" />
      </svg>
    </a>
  );
}
