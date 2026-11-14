"use client";

import { useEffect } from "react";
import { playExclusive } from "@/lib/single-audio";

/** Écoute tous les lecteurs de la page (l'événement « play » ne remonte pas : on l'attrape en phase de capture). */
export function SingleAudio() {
  useEffect(() => {
    const onPlay = (e: Event) => {
      if (e.target instanceof HTMLMediaElement) playExclusive(e.target);
    };
    document.addEventListener("play", onPlay, true);
    return () => document.removeEventListener("play", onPlay, true);
  }, []);
  return null;
}
