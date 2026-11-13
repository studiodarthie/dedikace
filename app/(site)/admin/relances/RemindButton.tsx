"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { markRemindedAction } from "../actions";

/** Ouvre WhatsApp avec le message prêt, et note la relance pour ne pas relancer deux fois. */
export function RemindButton({ orderId, href, done }: { orderId: string; href: string; done: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        if (done) return;
        startTransition(async () => {
          await markRemindedAction(orderId);
          router.refresh();
        });
      }}
      className={`flex h-11 shrink-0 items-center justify-center gap-2 rounded-full px-4 text-sm font-bold transition active:scale-[0.98] ${
        done ? "bg-white text-ink ring-1 ring-sand" : "bg-[#25d366] text-white"
      } ${pending ? "opacity-70" : ""}`}
    >
      {done ? "Relancer encore" : "Relancer sur WhatsApp"}
    </a>
  );
}
