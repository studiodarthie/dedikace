"use client";

import { useState } from "react";

type Tone = "tendre" | "drole" | "simple";

const TONES: { id: Tone; label: string; emoji: string }[] = [
  { id: "tendre", label: "Tendre", emoji: "❤️" },
  { id: "drole", label: "Drôle", emoji: "😂" },
  { id: "simple", label: "Simple", emoji: "🎶" },
];

/** Messages tout prêts (sans accord masculin/féminin : on ne connaît pas le genre). */
function buildMessage(tone: Tone, name: string, from: string | null, url: string): string {
  const sign = from ? `\n— ${from}` : "";
  switch (tone) {
    case "tendre":
      return `${name} ❤️\nJ'ai fait écrire une chanson rien que pour toi, avec nos souvenirs.\nMets le son et écoute jusqu'au bout 🎶\n${url}${sign}`;
    case "drole":
      return `${name}, alerte 🚨\nTu es la star d'une chanson ! 😂🎤\nMonte le son et écoute ça :\n${url}${sign}`;
    default:
      return `🎶 Une chanson rien que pour toi, ${name} ! Écoute-la ici :\n${url}${sign}`;
  }
}

/** « Envoyer la surprise » : choix du ton, aperçu du message, envoi par WhatsApp, conseils de partage. */
export function SurprisePanel({ recipientName, senderName, pageUrl }: { recipientName: string; senderName: string | null; pageUrl: string }) {
  const [tone, setTone] = useState<Tone>("tendre");
  const message = buildMessage(tone, recipientName, senderName, pageUrl);

  return (
    <section aria-labelledby="surprise" className="flex flex-col gap-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-sand">
      <div className="flex flex-col gap-1">
        <h2 id="surprise" className="text-xl font-extrabold">
          🎁 Envoie la surprise à {recipientName}
        </h2>
        <p className="text-sm text-muted">Choisis le ton du message, on l’ouvre dans WhatsApp.</p>
      </div>

      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Ton du message">
        {TONES.map((t) => (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={tone === t.id}
            onClick={() => setTone(t.id)}
            className={`flex min-h-14 flex-col items-center justify-center rounded-2xl px-1 py-2 text-sm font-semibold transition active:scale-[0.98] ${
              tone === t.id ? "bg-brand text-white shadow-md shadow-brand/30" : "bg-cream ring-1 ring-sand"
            }`}
          >
            <span className="text-xl" aria-hidden="true">
              {t.emoji}
            </span>
            {t.label}
          </button>
        ))}
      </div>

      <p className="rounded-2xl bg-[#e7ffdb] p-3 text-sm whitespace-pre-line text-ink ring-1 ring-[#25d366]/30" aria-live="polite">
        {message}
      </p>

      <a
        href={`https://wa.me/?text=${encodeURIComponent(message)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#25d366] px-6 text-lg font-bold text-white shadow-md transition active:scale-[0.98]"
      >
        Envoyer sur WhatsApp
      </a>

      <ul className="flex flex-col gap-2 text-sm">
        <li className="flex gap-2">
          <span aria-hidden="true">📲</span>
          <span>
            <strong>Mets le lien en statut</strong> avec un petit mot : tout ton entourage va l’écouter.
          </span>
        </li>
        <li className="flex gap-2">
          <span aria-hidden="true">🔊</span>
          <span>
            <strong>Fais-la écouter en direct</strong> pendant la fête : branche ton téléphone sur une enceinte.
          </span>
        </li>
        <li className="flex gap-2">
          <span aria-hidden="true">⬇️</span>
          <span>
            <strong>Envoie aussi le MP3</strong> (bouton « Télécharger » plus haut) : {recipientName} pourra l’écouter
            même sans internet.
          </span>
        </li>
      </ul>
    </section>
  );
}
