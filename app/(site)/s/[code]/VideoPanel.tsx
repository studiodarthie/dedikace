"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getRememberedOrders } from "@/lib/my-orders";
import { PhotoCropper } from "./PhotoCropper";
import { useLocale } from "@/lib/use-locale";

type State = {
  owner: boolean;
  status: "queued" | "rendering" | "ready" | "failed" | null;
  rendersLeft: number;
  play?: string;
  download?: string;
};

async function fetchStatus(code: string): Promise<State | null> {
  try {
    const res = await fetch("/api/video/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, ids: getRememberedOrders() }),
    });
    return res.ok ? ((await res.json()) as State) : null;
  } catch {
    return null; // Hors connexion : on réessaiera au prochain passage.
  }
}

/**
 * Vidéo statut WhatsApp : l'acheteur choisit une photo, on fabrique 30 s verticales avec le refrain.
 * Tout le monde peut regarder et télécharger la vidéo prête ; seul l'acheteur la crée.
 */
export function VideoPanel({ code, recipientName }: { code: string; recipientName: string }) {
  const en = useLocale() === "en";
  const [state, setState] = useState<State | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<File | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    const next = await fetchStatus(code);
    if (next) setState(next);
  }, [code]);

  useEffect(() => {
    let alive = true;
    fetchStatus(code).then((next) => {
      if (alive && next) setState(next);
    });
    return () => {
      alive = false;
    };
  }, [code]);

  // Pendant la fabrication, on regarde où ça en est toutes les 5 s.
  const working = state?.status === "queued" || state?.status === "rendering";
  useEffect(() => {
    if (!working) return;
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, [working, refresh]);

  async function upload(photo: Blob) {
    setPending(null);
    setError(null);
    setBusy(true);
    try {
      const body = new FormData();
      body.append("code", code);
      body.append("ids", getRememberedOrders().join(","));
      body.append("photo", photo, "photo.jpg");
      body.append("locale", en ? "en" : "fr");
      const res = await fetch("/api/video", { method: "POST", body });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) setError(data.error ?? (en ? "That didn’t work. Try again." : "Ça n'a pas marché. Réessaie."));
      await refresh();
    } catch {
      setError(en ? "We couldn’t send the photo. Check your connection and try again." : "On n'a pas pu envoyer la photo. Vérifie ta connexion et réessaie.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  if (!state || (!state.owner && state.status !== "ready")) return null;

  const picker = (
    <input
      ref={input}
      type="file"
      accept="image/*"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) {
          setError(null);
          setPending(file);
        }
        e.target.value = "";
      }}
    />
  );

  return (
    <section aria-labelledby="video" className="flex flex-col gap-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-sand">
      <div className="flex flex-col gap-1">
        <h2 id="video" className="text-xl font-extrabold">
          {en ? "🎬 The video for your status" : "🎬 La vidéo pour ton statut"}
        </h2>
        <p className="text-sm text-muted">
          {en
            ? `30 seconds with a photo of ${recipientName}, their name and the chorus. Perfect for your WhatsApp status.`
            : `30 secondes avec une photo de ${recipientName}, son prénom et le refrain. Parfait pour le statut WhatsApp.`}
        </p>
      </div>

      {state.status === "ready" && state.play && (
        <>
          <video
            src={state.play}
            controls
            playsInline
            preload="metadata"
            className="mx-auto aspect-[9/16] w-full max-w-[260px] rounded-2xl bg-ink object-cover"
          />
          <a
            href={state.download}
            className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#25d366] px-6 text-lg font-bold text-white shadow-md transition active:scale-[0.98]"
          >
            <span aria-hidden="true">⬇️</span> {en ? "Download the video" : "Télécharger la vidéo"}
          </a>
          <p className="text-sm text-muted">
            {en ? "Then in WhatsApp: " : "Puis dans WhatsApp : "}
            <strong className="text-ink">{en ? "Updates → My status → Gallery" : "Actus → Mon statut → Galerie"}</strong>
            {en ? ", and pick the video." : ", et choisis la vidéo."}
          </p>
        </>
      )}

      {working && (
        <p role="status" className="flex items-center gap-3 rounded-2xl bg-sand/60 p-4 font-medium">
          <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-brand border-t-transparent" aria-hidden="true" />
          {en ? "Making your video… about 1 minute. You can stay on this page." : "On prépare ta vidéo… environ 1 minute. Tu peux rester sur cette page."}
        </p>
      )}

      {state.status === "failed" && (
        <p role="alert" className="rounded-2xl bg-red-50 p-4 font-medium text-red-800 ring-1 ring-red-200">
          {en
            ? "The video couldn’t be created. Try another photo, or message us on WhatsApp."
            : "La vidéo n’a pas pu être créée. Réessaie avec une autre photo, ou écris-nous sur WhatsApp."}
        </p>
      )}

      {state.owner && pending && (
        <PhotoCropper
          file={pending}
          onConfirm={(photo) => void upload(photo)}
          onCancel={() => {
            setPending(null);
            input.current?.click();
          }}
        />
      )}

      {picker}

      {state.owner && !working && !pending && state.rendersLeft > 0 && (
        <>
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={busy}
            className={`flex h-14 items-center justify-center gap-2 rounded-2xl px-6 text-lg font-bold transition active:scale-[0.98] disabled:opacity-70 ${
              state.status === "ready" ? "bg-cream text-ink ring-1 ring-sand" : "bg-brand text-white shadow-md shadow-brand/30"
            }`}
          >
            {busy ? (
              <>
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
                {en ? "Sending the photo…" : "Envoi de la photo…"}
              </>
            ) : state.status === "ready" ? (
              en ? "Change photo" : "Changer de photo"
            ) : (
              <>
                <span aria-hidden="true">📷</span> {en ? "Choose a photo" : "Choisir une photo"}
              </>
            )}
          </button>
        </>
      )}

      {error && (
        <p role="alert" className="text-sm font-medium text-red-800">
          {error}
        </p>
      )}
    </section>
  );
}
