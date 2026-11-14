// Un seul son à la fois sur la page : quand un lecteur démarre, celui qui jouait s'arrête.
// Code navigateur. Les <audio>/<video> de la page sont gérés par <SingleAudio /> (layout) ;
// un `new Audio()` hors de la page (extraits de styles) appelle playExclusive lui-même.

let current: { el: HTMLMediaElement; onStop?: () => void } | null = null;

/**
 * À appeler quand `el` commence à jouer : met en pause le lecteur précédent et prévient son composant
 * (onStop) pour qu'il remette son bouton sur « ▶ ».
 */
export function playExclusive(el: HTMLMediaElement, onStop?: () => void) {
  if (current && current.el !== el) {
    if (!current.el.paused) current.el.pause();
    current.onStop?.();
  }
  current = { el, onStop: onStop ?? (current?.el === el ? current.onStop : undefined) };
}
