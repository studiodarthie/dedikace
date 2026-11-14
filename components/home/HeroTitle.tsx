"use client";

import { useEffect, useState } from "react";

export type HeroLine = { top: string; bottom: string };

const INTERVAL_MS = 3200;

/**
 * Titre de l'accueil qui tourne : ligne du haut en noir, ligne du bas en dégradé orange.
 * Toutes les phrases sont empilées dans la même case (grille) : la hauteur ne saute pas d'un message à l'autre,
 * même quand une phrase passe sur deux lignes sur petit écran. Sans JavaScript : le premier message reste affiché.
 * La ligne du haut ne s'anime que si son texte change. Mouvement réduit demandé : pas de rotation.
 */
export function HeroTitle({ lines, label }: { lines: HeroLine[]; label: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      if (!document.hidden) setIndex((i) => (i + 1) % lines.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [lines.length]);

  const tops = [...new Set(lines.map((l) => l.top))];
  const current = lines[index];

  return (
    <h1 className="text-[clamp(1.9rem,8.8vw,3.4rem)] leading-[1.05] font-extrabold tracking-tight text-balance md:text-7xl lg:text-[5.25rem]">
      <span className="sr-only">{label}</span>
      <span aria-hidden="true" className="grid">
        {tops.map((top) => (
          <Slide key={top} active={top === current.top}>
            {top}
          </Slide>
        ))}
      </span>
      <span aria-hidden="true" className="grid">
        {lines.map((l, i) => (
          <Slide key={l.bottom} active={i === index}>
            <span className="bg-gradient-to-r from-brand to-gold bg-clip-text pb-[0.08em] text-transparent">{l.bottom}</span>
          </Slide>
        ))}
      </span>
    </h1>
  );
}

function Slide({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`[grid-area:1/1] transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none ${
        active ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      }`}
    >
      {children}
    </span>
  );
}
