"use client";

import { useActionState } from "react";
import { sendLoginLink, type ActionState } from "../actions";

export function LoginForm({ initialError }: { initialError?: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(sendLoginLink, { error: initialError });
  return (
    <form action={action} className="flex flex-col gap-3">
      <p className="text-muted">Entre ton adresse e-mail : on t’envoie un lien de connexion.</p>
      <input
        type="email"
        name="email"
        required
        autoComplete="email"
        inputMode="email"
        placeholder="toi@exemple.com"
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
        className="flex h-14 items-center justify-center rounded-2xl bg-brand px-6 text-lg font-bold text-white shadow-md disabled:opacity-60"
      >
        {pending ? "Envoi…" : "Recevoir mon lien"}
      </button>
    </form>
  );
}
