"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ExampleCover, type CoverScene } from "@/components/ExampleCover";

export type ExampleTrack = {
  file: string;
  title: string;
  style: string;
  emoji: string;
  tags: string[];
  /** Durée affichée dans la liste (les extraits font 80 s). */
  length: string;
  scene: CoverScene;
  /** Classes Tailwind du dégradé, utilisé tant qu'il n'y a pas de photo. */
  cover: string;
  /** Photo de pochette (public/examples/*.jpg) si elle existe. */
  image?: string;
};

function formatTime(s: number) {
  if (!Number.isFinite(s)) return "0:00";
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

/** Hauteurs (0–1) d'une fausse onde sonore, toujours la même pour un même titre. */
function waveform(seed: string, bars: number) {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return Array.from({ length: bars }, (_, i) => {
    h = (h * 1103515245 + 12345) >>> 0;
    const noise = (h % 1000) / 1000;
    const envelope = 0.55 + 0.45 * Math.sin((i / bars) * Math.PI * 3.2 + 0.6);
    return Math.max(0.18, Math.min(1, 0.25 + noise * 0.45 + envelope * 0.35));
  });
}

function Artwork({ track, still, sizes }: { track: ExampleTrack; still?: boolean; sizes: string }) {
  if (track.image) {
    return <Image src={track.image} alt="" fill sizes={sizes} className="object-cover" />;
  }
  return (
    <div className={`absolute inset-0 bg-gradient-to-br ${track.cover}`}>
      <ExampleCover scene={track.scene} still={still} className="h-full w-full" />
    </div>
  );
}

function Equalizer({ className = "" }: { className?: string }) {
  return (
    <span className={`flex h-4 items-end gap-0.5 ${className}`} aria-hidden="true">
      {[0, 0.3, 0.15].map((d) => (
        <span key={d} className="w-1 rounded-full bg-brand [animation:cv-eq_0.9s_ease-in-out_infinite]" style={{ animationDelay: `${d}s` }} />
      ))}
    </span>
  );
}

/**
 * Section des exemples : liste à gauche, grande pochette + lecteur à droite (empilés sur téléphone).
 * Un seul <audio>, chargé au premier clic (3G).
 */
export function ExamplePlayer({ tracks, header, cta }: { tracks: ExampleTrack[]; header: ReactNode; cta: ReactNode }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [failed, setFailed] = useState(false);
  const track = tracks[index];
  const bars = useMemo(() => waveform(track.file, 44), [track.file]);
  const progress = duration ? time / duration : 0;

  // Changement de titre : on recharge et on lance la lecture.
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

  const list = (
    <div className="flex min-w-0 flex-col gap-3">
      <p className="text-xs font-bold tracking-[0.2em] text-muted uppercase">4 chansons, 4 moments de vie</p>
      <ul className="flex flex-col gap-1.5">
        {tracks.map((t, i) => {
          const active = i === index;
          return (
            <li key={t.file}>
              <button
                type="button"
                onClick={() => select(i)}
                aria-current={active ? "true" : undefined}
                aria-label={`${active && playing ? "Mettre en pause" : "Écouter"} ${t.title}`}
                className={`flex w-full items-center gap-4 rounded-2xl p-2.5 pr-4 text-left transition md:p-3 md:pr-5 ${
                  active ? "bg-white shadow-sm ring-1 ring-gold/70" : "active:bg-white/70 md:hover:bg-white/60"
                }`}
              >
                <span className="relative h-14 w-14 shrink-0">
                  <span className="absolute inset-0 overflow-hidden rounded-xl">
                    <Artwork track={t} still sizes="56px" />
                  </span>
                  <span
                    className="absolute -right-1.5 -bottom-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs shadow ring-1 ring-sand"
                    aria-hidden="true"
                  >
                    {t.emoji}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block truncate font-bold md:text-lg ${active ? "text-brand" : ""}`}>{t.title}</span>
                  <span className="block truncate text-sm text-muted">Style {t.style}</span>
                </span>
                {active && playing ? (
                  <Equalizer />
                ) : (
                  <span className="text-sm text-muted tabular-nums">{t.length}</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_1.05fr] md:grid-rows-[1fr_auto_1fr] md:gap-x-16 md:gap-y-8">
      <div className="min-w-0 md:self-end">{header}</div>

      {/* Pochette + lecteur */}
      <div className="min-w-0 rounded-[2rem] bg-white p-5 shadow-xl shadow-ink/5 ring-1 ring-sand md:col-start-2 md:row-span-3 md:row-start-1 md:self-center md:p-8">
        <div className="relative w-[80%] md:w-[76%]">
          {/* Vinyle qui dépasse à droite et tourne pendant l'écoute */}
          <div
            className={`absolute top-[5%] bottom-[5%] aspect-square rounded-full shadow-lg transition-[right] duration-700 ${
              playing ? "-right-[26%]" : "-right-[18%]"
            }`}
            aria-hidden="true"
          >
            <div
              className="relative h-full w-full animate-spin rounded-full bg-[repeating-radial-gradient(circle,#1d1410_0_2px,#2c211b_2px_4px)] [animation-duration:3.5s]"
              style={{ animationPlayState: playing ? "running" : "paused" }}
            >
              <div className="absolute inset-[34%] rounded-full bg-gradient-to-br from-brand to-gold">
                <div className="absolute inset-[42%] rounded-full bg-cream" />
              </div>
            </div>
          </div>

          <div className="relative aspect-square overflow-hidden rounded-2xl shadow-xl shadow-ink/20">
            <Artwork key={track.file} track={track} sizes="(min-width: 768px) 380px, 75vw" />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/60 to-transparent" aria-hidden="true" />
            <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5 md:bottom-4 md:left-4">
              {track.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-ink/30 px-2.5 py-1 text-[10px] font-bold tracking-widest text-white uppercase ring-1 ring-white/60 backdrop-blur-sm md:px-3 md:text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Autocollant sur le coin */}
          <span
            className="absolute -top-4 -left-4 flex h-14 w-14 -rotate-12 animate-float items-center justify-center rounded-2xl bg-white text-3xl shadow-lg ring-1 ring-sand md:h-16 md:w-16 md:text-4xl"
            aria-hidden="true"
          >
            {track.emoji}
          </span>
        </div>

        <div className="mt-6 flex flex-col gap-1 md:mt-8">
          <p className="flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-brand uppercase">
            <span className={`h-2 w-2 rounded-full bg-brand ${playing ? "animate-pulse" : ""}`} aria-hidden="true" />
            {playing ? "En lecture" : "Prêt à écouter"}
          </p>
          <p className="text-2xl leading-tight font-extrabold tracking-tight md:text-4xl">{track.title}</p>
          <p className="text-muted md:text-lg">Style {track.style}</p>
        </div>

        <div className="mt-5 flex items-center gap-4">
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? `Mettre en pause ${track.title}` : `Écouter ${track.title}`}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold to-brand text-white shadow-lg shadow-brand/30 transition active:scale-95 md:h-16 md:w-16"
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
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="relative flex h-12 items-center gap-[2px] md:gap-[3px]">
              {bars.map((b, i) => (
                <span
                  key={i}
                  className={`flex-1 rounded-full transition-colors ${i / bars.length < progress ? "bg-brand" : "bg-ink/15"}`}
                  style={{ height: `${Math.round(b * 100)}%` }}
                  aria-hidden="true"
                />
              ))}
              {/* Curseur invisible par-dessus l'onde : glisser ou toucher pour avancer, accessible au clavier. */}
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
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </div>
            <p className="flex justify-between text-xs text-muted tabular-nums">
              <span>{formatTime(time)}</span>
              <span>{duration ? formatTime(duration) : track.length}</span>
            </p>
          </div>
        </div>
        {failed && (
          <p role="alert" className="mt-3 text-sm font-medium text-brand-dark">
            L’extrait n’a pas pu se lancer. Vérifie ta connexion et réessaie.
          </p>
        )}
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

      {list}
      <div className="min-w-0 md:self-start">{cta}</div>
    </div>
  );
}
