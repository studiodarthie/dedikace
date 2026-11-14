"use client";

import { useState } from "react";
import { useLocale } from "@/lib/use-locale";

type Tone = "tendre" | "drole" | "simple";

const TONES: { id: Tone; label: string; labelEn: string; emoji: string }[] = [
  { id: "tendre", label: "Tendre", labelEn: "Tender", emoji: "❤️" },
  { id: "drole", label: "Drôle", labelEn: "Funny", emoji: "😂" },
  { id: "simple", label: "Simple", labelEn: "Simple", emoji: "🎶" },
];

/** Messages tout prêts (sans accord masculin/féminin : on ne connaît pas le genre). */
function buildMessage(tone: Tone, name: string, from: string | null, url: string, en: boolean): string {
  const sign = from ? `\n— ${from}` : "";
  if (en) {
    switch (tone) {
      case "tendre":
        return `${name} ❤️\nI had a song written just for you, with our memories.\nTurn up the sound and listen to the end 🎶\n${url}${sign}`;
      case "drole":
        return `${name}, alert 🚨\nYou’re the star of a song! 😂🎤\nTurn it up and listen:\n${url}${sign}`;
      default:
        return `🎶 A song just for you, ${name}! Listen here:\n${url}${sign}`;
    }
  }
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
  const en = useLocale() === "en";
  const [tone, setTone] = useState<Tone>("tendre");
  const message = buildMessage(tone, recipientName, senderName, pageUrl, en);

  return (
    <section aria-labelledby="surprise" className="flex flex-col gap-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-sand">
      <div className="flex flex-col gap-1">
        <h2 id="surprise" className="text-xl font-extrabold">
          {en ? `🎁 Send the surprise to ${recipientName}` : `🎁 Envoie la surprise à ${recipientName}`}
        </h2>
        <p className="text-sm text-muted">
          {en ? "Choose the message’s tone, we open it in WhatsApp." : "Choisis le ton du message, on l’ouvre dans WhatsApp."}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={en ? "Message tone" : "Ton du message"}>
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
            {en ? t.labelEn : t.label}
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
        {en ? "Send on WhatsApp" : "Envoyer sur WhatsApp"}
      </a>

      <ul className="flex flex-col gap-2 text-sm">
        <li className="flex gap-2">
          <span aria-hidden="true">📲</span>
          <span>
            {en ? (
              <>
                <strong>Post the link as your status</strong> with a short note: everyone around you will listen.
              </>
            ) : (
              <>
                <strong>Mets le lien en statut</strong> avec un petit mot : tout ton entourage va l’écouter.
              </>
            )}
          </span>
        </li>
        <li className="flex gap-2">
          <span aria-hidden="true">🔊</span>
          <span>
            {en ? (
              <>
                <strong>Play it live</strong> at the party: plug your phone into a speaker.
              </>
            ) : (
              <>
                <strong>Fais-la écouter en direct</strong> pendant la fête : branche ton téléphone sur une enceinte.
              </>
            )}
          </span>
        </li>
        <li className="flex gap-2">
          <span aria-hidden="true">⬇️</span>
          <span>
            {en ? (
              <>
                <strong>Also send the MP3</strong> (“Download” button above): {recipientName} can listen even without internet.
              </>
            ) : (
              <>
                <strong>Envoie aussi le MP3</strong> (bouton « Télécharger » plus haut) : {recipientName} pourra l’écouter
                même sans internet.
              </>
            )}
          </span>
        </li>
      </ul>
    </section>
  );
}
