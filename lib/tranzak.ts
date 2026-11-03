import "server-only";
import { env, requireEnv } from "@/lib/env";

// API REST Tranzak (Collection API), d'après https://docs.developer.tranzak.me/
// Le SDK tranzak-node 3.2 ne correspond plus à cette documentation (chemins sans /v1,
// en-tête « Bearer: », champ « expires » au lieu de « expiresIn ») : on appelle donc l'API directement.
const BASE_URL = env.TRANZAK_MODE === "production" ? "https://dsapi.tranzak.me" : "https://sandbox.dsapi.tranzak.me";
const TIMEOUT_MS = 20_000;

/** Statuts d'une demande de paiement (section « Payment Request Status Codes »). */
export type TranzakStatus =
  | "PENDING"
  | "SUCCESSFUL"
  | "CANCELLED"
  | "CANCELLED_BY_PAYER"
  | "FAILED"
  | "PAYMENT_IN_PROGRESS"
  | "PAYER_REDIRECT_REQUIRED"
  | "REFUNDED"
  | (string & {});

export type TranzakRequest = {
  requestId: string;
  amount: number;
  currencyCode: string;
  status: TranzakStatus;
  mchTransactionRef: string;
  appId?: string;
  transactionId?: string;
  errorCode?: number;
  errorMessage?: string;
  links?: { returnUrl?: string; paymentAuthUrl?: string };
};

export class TranzakError extends Error {
  constructor(
    message: string,
    /** true : panne passagère (réseau, serveur Tranzak), on peut réessayer. */
    readonly retryable: boolean,
    readonly code?: number,
  ) {
    super(message);
    this.name = "TranzakError";
  }
}

let token: { value: string; expiresAt: number } | undefined;

async function call<T>(path: string, init: { method: "GET" | "POST"; body?: unknown; auth?: boolean }): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-App-ID": requireEnv("TRANZAK_APP_ID"),
  };
  if (init.auth !== false) headers.Authorization = `Bearer ${await getToken()}`;

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: init.method,
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (error) {
    throw new TranzakError(`Tranzak injoignable : ${error instanceof Error ? error.message : error}`, true);
  }

  const payload = (await response.json().catch(() => null)) as
    | { success?: boolean; data?: T; errorMsg?: string; errorCode?: number }
    | null;
  // Tranzak répond souvent 200 même en cas d'erreur : seul `success` fait foi.
  if (!payload?.success) {
    if (response.status === 401 && init.auth !== false) token = undefined;
    const retryable = !payload || response.status >= 500 || response.status === 429 || response.status === 401;
    throw new TranzakError(
      `Tranzak ${path} (HTTP ${response.status}) : ${payload?.errorMsg ?? "réponse illisible"}`,
      retryable,
      payload?.errorCode,
    );
  }
  return payload.data as T;
}

/** Jeton d'accès, gardé pendant 3/4 de sa validité comme le recommande Tranzak. */
async function getToken(): Promise<string> {
  if (token && Date.now() < token.expiresAt) return token.value;
  const data = await call<{ token: string; expiresIn: number }>("/auth/token", {
    method: "POST",
    auth: false,
    body: { appId: requireEnv("TRANZAK_APP_ID"), appKey: requireEnv("TRANZAK_APP_KEY") },
  });
  token = { value: data.token, expiresAt: Date.now() + data.expiresIn * 750 };
  return data.token;
}

type ChargeInput = {
  amountXaf: number;
  merchantRef: string;
  description: string;
  returnUrl: string;
};

/** Débit direct MTN MoMo / Orange Money : la demande s'affiche sur le téléphone du payeur. */
export function chargeMobileMoney(input: ChargeInput & { phone: string }) {
  return call<TranzakRequest>("/xp021/v1/request/create-mobile-wallet-charge", {
    method: "POST",
    body: {
      amount: input.amountXaf,
      currencyCode: "XAF",
      description: input.description,
      payerNote: "Dedikace",
      mchTransactionRef: input.merchantRef,
      mobileWalletNumber: input.phone.replace(/^\+/, ""),
      returnUrl: input.returnUrl,
    },
  });
}

/** Paiement par carte : le client est redirigé vers links.paymentAuthUrl. */
export function chargeByWebRedirect(input: ChargeInput & { cancelUrl: string }) {
  return call<TranzakRequest>("/xp021/v1/request/create", {
    method: "POST",
    body: {
      amount: input.amountXaf,
      currencyCode: "XAF",
      description: input.description,
      payerNote: "Dedikace",
      mchTransactionRef: input.merchantRef,
      returnUrl: input.returnUrl,
      cancelUrl: input.cancelUrl,
      customization: { title: "Dédikace" },
    },
  });
}

/** Statut actuel d'une demande, lu directement chez Tranzak (jamais depuis une notification). */
export function getRequestDetails(requestId: string) {
  return call<TranzakRequest>(`/xp021/v1/request/details?requestId=${encodeURIComponent(requestId)}`, {
    method: "GET",
  });
}

/** Demande à Tranzak d'interroger l'opérateur quand la confirmation tarde. */
export function refreshRequestStatus(requestId: string) {
  return call<TranzakRequest>("/xp021/v1/request/refresh-transaction-status", {
    method: "POST",
    body: { requestId },
  });
}

/** Vérifie la connexion (scripts de contrôle) sans créer de paiement. */
export async function checkCredentials(): Promise<void> {
  token = undefined;
  await getToken();
}
