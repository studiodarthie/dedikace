"use client";

import { useActionState, useState, useTransition } from "react";
import { manualPaymentAction, refundAction, relaunchAction, type ActionState } from "../../actions";

type Props = {
  orderId: string;
  canRelaunch: boolean;
  canRefund: boolean;
  canValidatePayment: boolean;
  defaultAmount: number;
};

export function OrderActions({ orderId, canRelaunch, canRefund, canValidatePayment, defaultAmount }: Props) {
  const [result, setResult] = useState<ActionState>({});
  const [pending, startTransition] = useTransition();
  const [manualState, manualAction, manualPending] = useActionState<ActionState, FormData>(
    manualPaymentAction.bind(null, orderId),
    {},
  );

  function confirmAndRun(question: string, action: (id: string) => Promise<ActionState>) {
    if (!window.confirm(question)) return;
    startTransition(async () => setResult(await action(orderId)));
  }

  if (!canRelaunch && !canRefund && !canValidatePayment) return null;

  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-sand/50 p-4">
      <h2 className="font-bold">Actions</h2>
      {canRelaunch && (
        <button
          type="button"
          disabled={pending}
          onClick={() => confirmAndRun("Relancer la création ? Cela consomme des crédits ElevenLabs.", relaunchAction)}
          className="h-12 rounded-2xl bg-brand font-bold text-white disabled:opacity-60"
        >
          Relancer la création
        </button>
      )}
      {canRefund && (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            confirmAndRun(
              "Marquer remboursée ? Fais d’abord le remboursement chez Tranzak ou par Mobile Money : ce bouton l’enregistre seulement.",
              refundAction,
            )
          }
          className="h-12 rounded-2xl bg-white font-bold ring-1 ring-ink/20 disabled:opacity-60"
        >
          Marquer remboursée
        </button>
      )}
      {canValidatePayment && (
        <details className="rounded-2xl bg-white p-3">
          <summary className="cursor-pointer font-bold">Valider un paiement manuel</summary>
          <form
            action={manualAction}
            onSubmit={(e) => {
              if (!window.confirm("Tu as bien vu ce paiement réussi dans Tranzak ? La chanson va être créée.")) e.preventDefault();
            }}
            className="mt-3 flex flex-col gap-2"
          >
            <p className="text-sm text-muted">
              Seulement si le paiement apparaît comme réussi dans ton tableau de bord Tranzak.
            </p>
            <label className="flex flex-col gap-1 text-sm font-semibold">
              Montant reçu (FCFA)
              <input
                name="amountXaf"
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                required
                defaultValue={defaultAmount}
                className="h-12 rounded-xl border border-sand px-3 text-base font-normal"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-semibold">
              Référence de la transaction Tranzak
              <input name="reference" required minLength={3} maxLength={100} className="h-12 rounded-xl border border-sand px-3 text-base font-normal" />
            </label>
            <button type="submit" disabled={manualPending} className="h-12 rounded-2xl bg-leaf font-bold text-white disabled:opacity-60">
              {manualPending ? "Validation…" : "Valider le paiement"}
            </button>
            <Message state={manualState} />
          </form>
        </details>
      )}
      {pending && <p className="text-sm text-muted">Un instant…</p>}
      <Message state={result} />
    </section>
  );
}

function Message({ state }: { state: ActionState }) {
  if (state.ok) {
    return (
      <p role="status" className="font-medium text-leaf">
        {state.ok}
      </p>
    );
  }
  if (state.error) {
    return (
      <p role="alert" className="font-medium text-brand-dark">
        {state.error}
      </p>
    );
  }
  return null;
}
