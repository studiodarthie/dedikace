"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLocale } from "@/lib/use-locale";

const MAX_SECONDS = 60;

type State = { kind: "idle" } | { kind: "recording"; seconds: number } | { kind: "sending" } | { kind: "error"; message: string };

function pickMimeType(): string | undefined {
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  return types.find((t) => MediaRecorder.isTypeSupported?.(t));
}

const noopSubscribe = () => () => {};
function useCanRecord() {
  return useSyncExternalStore(
    noopSubscribe,
    () => typeof MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia,
    () => false,
  );
}

/**
 * « Raconte en vocal » : enregistre jusqu'à 1 minute, l'envoie à /api/transcribe
 * et renvoie le texte au formulaire, où il reste modifiable.
 */
export function VoiceNote({ onText }: { onText: (text: string) => void }) {
  const canRecord = useCanRecord();
  const en = useLocale() === "en";
  const [state, setState] = useState<State>({ kind: "idle" });
  const recorder = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // On coupe le micro si la personne quitte l'étape pendant l'enregistrement.
  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
      const r = recorder.current;
      if (r && r.state !== "inactive") {
        r.onstop = null;
        r.stop();
        r.stream.getTracks().forEach((t) => t.stop());
      }
    },
    [],
  );

  if (!canRecord) return null;

  async function start() {
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setState({
        kind: "error",
        message: en
          ? "Your phone blocked the microphone. Allow it in your browser settings, or type your memory."
          : "Ton téléphone a bloqué le micro. Autorise-le dans les réglages du navigateur, ou écris ton souvenir.",
      });
      return;
    }
    const mimeType = pickMimeType();
    const r = new MediaRecorder(stream, mimeType ? { mimeType, audioBitsPerSecond: 32_000 } : undefined);
    const chunks: Blob[] = [];
    r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    r.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      if (timer.current) clearInterval(timer.current);
      void send(new Blob(chunks, { type: r.mimeType || mimeType || "audio/webm" }));
    };
    recorder.current = r;
    r.start(1000);
    setState({ kind: "recording", seconds: 0 });
    const startedAt = Date.now();
    timer.current = setInterval(() => {
      const seconds = Math.floor((Date.now() - startedAt) / 1000);
      if (seconds >= MAX_SECONDS) stop();
      else setState({ kind: "recording", seconds });
    }, 250);
  }

  function stop() {
    const r = recorder.current;
    if (r && r.state !== "inactive") r.stop();
  }

  async function send(audio: Blob) {
    setState({ kind: "sending" });
    try {
      const body = new FormData();
      body.append("audio", audio, "vocal");
      body.append("locale", en ? "en" : "fr");
      const res = await fetch("/api/transcribe", { method: "POST", body });
      if (res.status === 429) {
        return setState({ kind: "error", message: en ? "Too many tries at once. Wait a minute and try again." : "Trop d’essais d’un coup. Attends une minute et réessaie." });
      }
      const data = (await res.json()) as { text?: string; error?: string };
      if (!res.ok || !data.text) {
        return setState({ kind: "error", message: data.error ?? (en ? "We couldn’t read your voice note. Try again." : "On n'a pas pu lire ton vocal. Réessaie.") });
      }
      onText(data.text);
      setState({ kind: "idle" });
    } catch {
      setState({ kind: "error", message: en ? "No internet connection. Check your network and try again." : "Pas de connexion internet. Vérifie ton réseau et réessaie." });
    }
  }

  if (state.kind === "recording") {
    const left = MAX_SECONDS - state.seconds;
    return (
      <button
        type="button"
        onClick={stop}
        className="flex h-14 items-center justify-center gap-3 rounded-2xl bg-ink px-4 font-bold text-white"
      >
        <span className="h-3 w-3 animate-pulse rounded-full bg-red-500" aria-hidden="true" />
        {en ? "Stop and send" : "Arrêter et envoyer"}
        <span className="font-normal text-white/70 tabular-nums">0:{String(left).padStart(2, "0")}</span>
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={start}
        disabled={state.kind === "sending"}
        className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-leaf px-4 font-bold text-white shadow-md shadow-leaf/20 transition active:scale-[0.98] disabled:opacity-70"
      >
        {state.kind === "sending" ? (
          <>
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden="true" />
            {en ? "Listening to your voice note…" : "On écoute ton vocal…"}
          </>
        ) : (
          <>
            <span aria-hidden="true">🎤</span> {en ? "Tell it in a voice note (1 min max)" : "Raconte en vocal (1 min max)"}
          </>
        )}
      </button>
      {state.kind === "error" && (
        <p role="alert" className="text-sm font-medium text-red-800">
          {state.message}
        </p>
      )}
    </div>
  );
}
