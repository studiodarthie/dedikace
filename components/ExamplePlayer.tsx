"use client";

import { useEffect, useRef, useState } from "react";

export type ExampleTrack = {
  file: string;
  title: string;
  occasion: string;
  style: string;
  emoji: string;
  /** Classes Tailwind du dégradé de la pochette. */
  cover: string;
};

function formatTime(s: number) {
  if (!Number.isFinite(s)) return "0:00";
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

/** Lecteur des exemples : une grande pochette + la liste des 4 titres. Un seul <audio>, chargé au clic (3G). */
export function ExamplePlayer({ tracks }: { tracks: ExampleTrack[] }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [failed, setFailed] = useState(false);
  const track = tracks[index];

  // Changement de titre : on recharge et on lance la lecture si l'utilisateur écoutait déjà.
  const autoplay = useRef(false);
  useEffect(() => {
    const el = audio.current;
    if (!el || !autoplay.current) return;
    el.play().catch(() => setPlaying(false));
  }, [index]);

  function toggle() {
    const el = audio.current;
    if (!el) return;
    setFailed(false);
    if (el.paused) el.play().catch(() => setFailed(true));
    else el.pause();
  }

  function select(i: number) {
    if (i === index) return toggle();
    autoplay.current = true;
    setTime(0);
    setDuration(0);
    setFailed(false);
    setIndex(i);
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.15fr_1fr] md:items-center md:gap-10">
      <div className="min-w-0 overflow-hidden rounded-3xl bg-white shadow-lg shadow-ink/5 ring-1 ring-sand">
        <div className={`relative flex aspect-[16/10] items-end bg-gradient-to-br p-5 ${track.cover}`}>
          <span className="absolute top-4 right-4 rotate-6 text-6xl drop-shadow-md md:text-8xl" aria-hidden="true">
            {track.emoji}
          </span>
          <span className="rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-ink">{track.occasion}</span>
        </div>
        <div className="flex flex-col gap-3 p-5">
          <div>
            <p className="text-xl font-extrabold md:text-2xl">{track.title}</p>
            <p className="text-muted">Style {track.style} · extrait</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggle}
              aria-label={playing ? `Mettre en pause ${track.title}` : `Écouter ${track.title}`}
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-gold text-white shadow-md shadow-brand/30 transition active:scale-95"
            >
              {loading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : playing ? (
                <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden="true">
                  <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6 fill-current" aria-hidden="true">
                  <path d="M7 4.5v15l12-7.5z" />
                </svg>
              )}
            </button>
            <div className="flex flex-1 flex-col gap-1">
              <input
                type="range"
                min={0}
                max={duration || 80}
                step={0.1}
                value={time}
                onChange={(e) => {
                  if (audio.current) audio.current.currentTime = Number(e.target.value);
                }}
                aria-label="Position dans l’extrait"
                className="w-full accent-brand"
              />
              <p className="flex justify-between text-xs text-muted tabular-nums">
                <span>{formatTime(time)}</span>
                <span>{formatTime(duration)}</span>
              </p>
            </div>
          </div>
          {failed && (
            <p role="alert" className="text-sm font-medium text-brand-dark">
              L’extrait n’a pas pu se lancer. Vérifie ta connexion et réessaie.
            </p>
          )}
        </div>
        <audio
          ref={audio}
          src={`/examples/${track.file}`}
          preload="none"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onWaiting={() => setLoading(true)}
          onPlaying={() => setLoading(false)}
          onCanPlay={() => setLoading(false)}
          onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onEnded={() => setPlaying(false)}
          onError={() => {
            setLoading(false);
            setPlaying(false);
          }}
        />
      </div>

      <div className="flex min-w-0 flex-col gap-2">
      <p className="pt-2 text-sm font-semibold text-muted md:pt-0">4 chansons, 4 moments de vie</p>
      <ul className="flex flex-col gap-2 md:gap-3">
        {tracks.map((t, i) => {
          const active = i === index;
          return (
            <li key={t.file}>
              <button
                type="button"
                onClick={() => select(i)}
                aria-current={active ? "true" : undefined}
                className={`flex w-full items-center gap-3 rounded-2xl p-2 pr-4 text-left transition md:p-3 md:pr-5 ${
                  active ? "bg-white shadow-sm ring-2 ring-brand/60" : "bg-white/60 ring-1 ring-sand active:bg-white"
                }`}
              >
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-2xl ${t.cover}`}
                  aria-hidden="true"
                >
                  {t.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{t.title}</span>
                  <span className="block truncate text-sm text-muted">
                    {t.occasion} · {t.style}
                  </span>
                </span>
                <span className="text-brand" aria-hidden="true">
                  {active && playing ? "❚❚" : "▶"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      </div>
    </div>
  );
}
