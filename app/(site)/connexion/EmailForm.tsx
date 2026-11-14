"use client";

import { useActionState } from "react";
import { useLocale } from "@/lib/use-locale";
import { loginWithEmail, type LoginState } from "./actions";

export function EmailForm({ next, initialError }: { next: string; initialError?: string }) {
  const en = useLocale() === "en";
  const [state, action, pending] = useActionState<LoginState, FormData>(loginWithEmail, { error: initialError });
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="suite" value={next} />
      <label htmlFor="email" className="font-bold">
        {en ? "Your email address" : "Ton adresse e-mail"}
      </label>
      <input
        id="email"
        type="email"
        name="email"
        required
        autoComplete="email"
        inputMode="email"
        placeholder={en ? "you@example.com" : "toi@exemple.com"}
        className="h-14 rounded-2xl border border-sand bg-white px-4 text-lg"
      />
      {state.error && (
        <p role="alert" className="font-medium text-brand-dark">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="flex h-14 items-center justify-center rounded-2xl bg-ink px-6 text-lg font-bold text-cream shadow-md disabled:opacity-60"
      >
        {pending ? (en ? "Sending…" : "Envoi…") : en ? "Get my sign-in link" : "Recevoir mon lien de connexion"}
      </button>
    </form>
  );
}
