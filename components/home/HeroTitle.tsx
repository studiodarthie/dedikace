"use client";

import { useEffect, useState, type CSSProperties } from "react";

export type HeroLine = { top: string; bottom: string };

const INTERVAL_MS = 4200;

/**
 * Titre de l'accueil. Ligne du haut (noir) : posée, simple fondu quand elle change.
 * Ligne du bas (dégradé orange) : chaque lettre arrive et repart comme un papillon, puis flotte doucement
 * (animations fly-* dans app/globals.css). Toutes les phrases sont empilées dans la même case : la hauteur ne saute pas.
 * Sans JavaScript : le premier message reste affiché. Mouvement réduit demandé : pas de rotation ni d'envol.
 */
export function HeroTitle({ lines, label }: { lines: HeroLine[]; label: string }) {
  const [[index, prev], setPair] = useState<[number, number]>([0, -1]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      if (!document.hidden) setPair(([i]) => [(i + 1) % lines.length, i]);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [lines.length]);

  const tops = [...new Set(lines.map((l) => l.top))];
  const current = lines[index];

  return (
    <h1 className="text-[clamp(1.9rem,8.8vw,3.4rem)] leading-[1.08] font-extrabold tracking-tight text-balance md:text-7xl lg:text-[5.25rem]">
      <span className="sr-only">{label}</span>
      <span aria-hidden="true" className="grid">
        {tops.map((top) => (
          <span
            key={top}
            className="[grid-area:1/1] transition-opacity duration-700 ease-in-out"
            style={{ opacity: top === current.top ? 1 : 0 }}
          >
            {top}
          </span>
        ))}
      </span>
      <span aria-hidden="true" className="grid">
        {lines.map((l, i) => (
          <Butterflies key={l.bottom} text={l.bottom} seed={i} prevSeen={prev >= 0} state={i === index ? "in" : i === prev ? "out" : "idle"} />
        ))}
      </span>
    </h1>
  );
}

type State = "in" | "out" | "idle";
type Vars = CSSProperties & Record<`--${string}`, string>;

/** Nombre pseudo-aléatoire stable (0 à 1) : même résultat côté serveur et navigateur. */
function rnd(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/** Couleur du dégradé orange → doré à la position `t` (0 à 1) de la ligne. */
function mix(t: number) {
  return `color-mix(in oklab, var(--color-brand), var(--color-gold) ${Math.round(t * 100)}%)`;
}

function Butterflies({ text, seed, state, prevSeen }: { text: string; seed: number; state: State; prevSeen: boolean }) {
  const total = Math.max(1, text.length);
  const words = text.split(" ");
  // Position de la première lettre de chaque mot dans la phrase (pour le dégradé et le décalage).
  const starts = words.map((_, w) => words.slice(0, w).join(" ").length + (w ? 1 : 0));

  return (
    <span className="[grid-area:1/1]" style={{ visibility: state === "idle" ? "hidden" : undefined }}>
      {words.map((word, w) => (
        <span key={w}>
          <span className="inline-block whitespace-nowrap">
            {[...word].map((ch, c) => {
              const n = starts[w] + c;
              const k = seed * 101 + n;
              const fly: Vars = {
                "--x": `${((rnd(k) - 0.5) * 1.6).toFixed(2)}em`,
                "--y": `${(0.5 + rnd(k + 7) * 0.8).toFixed(2)}em`,
                "--r": `${((rnd(k + 13) - 0.5) * 80).toFixed(0)}deg`,
                animationDelay: state === "in" ? `${(prevSeen ? 520 : 150) + n * 45 + Math.round(rnd(k + 3) * 120)}ms` : `${n * 18}ms`,
                opacity: state === "in" ? 1 : 0,
              };
              const rest: Vars = {
                "--wobble": `${((rnd(k + 21) - 0.5) * 8).toFixed(1)}deg`,
                animationDelay: `${-(n * 0.22).toFixed(2)}s`,
                backgroundImage: `linear-gradient(90deg, ${mix(n / total)}, ${mix((n + 1) / total)})`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              };
              return (
                <span key={c} className={`inline-block ${state === "in" ? "fly-in" : state === "out" ? "fly-out" : ""}`} style={fly}>
                  <span className="fly-rest inline-block pb-[0.08em]" style={rest}>
                    {ch}
                  </span>
                </span>
              );
            })}
          </span>
          {w < words.length - 1 && " "}
        </span>
      ))}
    </span>
  );
}
