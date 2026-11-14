"use client";

import { useActionState } from "react";
import { useLocale } from "@/lib/use-locale";
import { saveProfile, type ProfileState } from "../actions";

const input = "h-14 w-full rounded-2xl border border-sand bg-white px-4 text-lg";

export function ProfileForm({ name, phone }: { name: string; phone: string }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(saveProfile, {});
  const en = useLocale() === "en";
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="locale" value={en ? "en" : "fr"} />
      <label className="flex flex-col gap-1.5">
        <span className="font-bold">{en ? "Your first name" : "Ton prénom"}</span>
        <input name="name" defaultValue={name} maxLength={40} autoComplete="given-name" placeholder={en ? "E.g. Junior" : "Ex. Junior"} className={input} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="font-bold">{en ? "Your WhatsApp number" : "Ton numéro WhatsApp"}</span>
        <input
          name="phone"
          type="tel"
          inputMode="tel"
          defaultValue={phone}
          autoComplete="tel"
          placeholder="+237 6XX XX XX XX"
          className={input}
        />
        <span className="text-sm text-muted">{en ? "We fill it in for you for every new song." : "On le remplit pour toi à chaque nouvelle chanson."}</span>
      </label>
      {state.error && (
        <p role="alert" className="font-medium text-brand-dark">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p role="status" className="font-medium text-leaf">
          {state.ok}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="flex h-14 items-center justify-center rounded-2xl bg-brand px-6 text-lg font-bold text-white shadow-md shadow-brand/30 disabled:opacity-60"
      >
        {pending ? (en ? "Saving…" : "Enregistrement…") : en ? "Save" : "Enregistrer"}
      </button>
    </form>
  );
}
