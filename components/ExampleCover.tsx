import { useId, type ReactNode } from "react";

export type CoverScene = "anniversaire" | "dot" | "bac" | "hommage";

// Illustrations originales en SVG : quelques Ko (3G), aucune photo de vraies personnes, aucun droit à payer.
// Les animations (classes cv-*) sont dans app/globals.css. Rappel : une animation CSS remplace l'attribut
// transform d'un élément SVG, donc la position va sur un <g> extérieur et l'animation sur l'élément intérieur.

const CREAM = "#fff8ee";
const INK = "#1d1410";
const BRAND = "#e0451b";
const BRAND_DARK = "#b8320f";
const LEAF = "#1d7a4f";
const GOLD = "#f2b233";

/** Étoile à 4 branches centrée en (x, y). */
function star(x: number, y: number, s: number) {
  return `M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z`;
}

const HEART = "M0 4C0-1 7-1 7 4C7-1 14-1 14 4C14 9 7 13 7 14C7 13 0 9 0 4Z";

type Bit = { x: number; c: string; d: number; t: number; w?: number };

function Confetti({ bits }: { bits: Bit[] }) {
  return bits.map((b, i) => (
    <rect
      key={i}
      x={b.x}
      y={-12}
      width={b.w ?? 5}
      height={9}
      rx={1.5}
      fill={b.c}
      className="cv-fall"
      style={{ animationDelay: `${b.d}s`, animationDuration: `${b.t}s` }}
    />
  ));
}

function Sparkles({ points, color = CREAM }: { points: [number, number, number, number][]; color?: string }) {
  return points.map(([x, y, s, d], i) => (
    <path key={i} d={star(x, y, s)} fill={color} className="cv-twinkle" style={{ animationDelay: `${d}s` }} />
  ));
}

function Birthday() {
  return (
    <>
      <g transform="translate(58 58)">
        <g className="cv-bob">
          <path d="M0 26q-5 20 4 44" stroke={CREAM} strokeOpacity=".7" strokeWidth="1.5" fill="none" />
          <ellipse cx="0" cy="0" rx="19" ry="24" fill={LEAF} />
          <ellipse cx="-6" cy="-9" rx="4" ry="7" fill={CREAM} opacity=".35" />
        </g>
      </g>
      <g transform="translate(264 50)">
        <g className="cv-bob" style={{ animationDelay: "1.3s" }}>
          <path d="M0 26q6 20-4 46" stroke={CREAM} strokeOpacity=".7" strokeWidth="1.5" fill="none" />
          <ellipse cx="0" cy="0" rx="19" ry="24" fill={CREAM} />
          <ellipse cx="-6" cy="-9" rx="4" ry="7" fill={GOLD} opacity=".5" />
        </g>
      </g>

      <ellipse cx="160" cy="178" rx="72" ry="7" fill={CREAM} opacity=".45" />
      <rect x="105" y="128" width="110" height="48" rx="10" fill={CREAM} />
      <rect x="105" y="128" width="110" height="14" rx="7" fill={BRAND_DARK} />
      {[118, 136, 154, 172, 190, 206].map((x) => (
        <circle key={x} cx={x} cy={142} r={4.5} fill={BRAND_DARK} />
      ))}
      <rect x="125" y="98" width="70" height="32" rx="8" fill={CREAM} />
      <rect x="125" y="98" width="70" height="9" rx="4.5" fill={GOLD} />
      {[143, 160, 177].map((x, i) => (
        <g key={x}>
          <rect x={x - 3} y="74" width="6" height="25" rx="2" fill={LEAF} />
          <path
            d={`M${x} 56q7 9 0 16q-7-7 0-16z`}
            fill={GOLD}
            className="cv-flicker"
            style={{ animationDelay: `${i * 0.25}s` }}
          />
          <path d={`M${x} 64q3 4 0 7q-3-3 0-7z`} fill={CREAM} />
        </g>
      ))}

      <Confetti
        bits={[
          { x: 22, c: CREAM, d: 0, t: 6 },
          { x: 96, c: LEAF, d: 2.2, t: 7 },
          { x: 128, c: INK, d: 4.1, t: 6.5 },
          { x: 206, c: CREAM, d: 1.1, t: 5.5 },
          { x: 236, c: LEAF, d: 3.4, t: 7.5 },
          { x: 300, c: INK, d: 0.6, t: 6 },
          { x: 180, c: GOLD, d: 5, t: 6.8 },
        ]}
      />
    </>
  );
}

function Wedding() {
  return (
    <>
      <g className="cv-bob" style={{ animationDuration: "6s" }}>
        <circle cx="142" cy="120" r="34" stroke={GOLD} strokeWidth="9" fill="none" />
        <circle cx="180" cy="120" r="34" stroke={CREAM} strokeWidth="9" fill="none" />
        {/* L'anneau doré repasse devant pour entrelacer les deux bagues. */}
        <path d="M168 97a34 34 0 0 1 6 33" stroke={GOLD} strokeWidth="9" fill="none" />
        <path d="M142 66l12 11-12 13-12-13z" fill={CREAM} />
        <path d="M130 77h24M142 66v24" stroke={GOLD} strokeOpacity=".5" strokeWidth="1.2" />
      </g>
      <Sparkles
        points={[
          [118, 62, 8, 0],
          [208, 72, 6, 0.8],
          [232, 140, 9, 1.6],
          [86, 150, 6, 0.4],
          [60, 70, 5, 1.2],
          [266, 60, 7, 2],
        ]}
      />
      {[
        [40, 0, CREAM],
        [104, 2.4, GOLD],
        [228, 1.2, CREAM],
        [282, 3.6, GOLD],
      ].map(([x, d, c], i) => (
        <g key={i} transform={`translate(${x} 190)`}>
          <path d={HEART} fill={c as string} className="cv-rise" style={{ animationDelay: `${d}s` }} />
        </g>
      ))}
    </>
  );
}

function Graduation() {
  return (
    <>
      <Sparkles
        points={[
          [270, 150, 6, 0.2],
          [258, 46, 7, 1],
          [280, 130, 6, 1.8],
          [44, 50, 6, 0.6],
        ]}
      />
      <g transform="translate(160 92)">
        <g className="cv-bob" style={{ animationDuration: "3.6s" }}>
          <path d="M-34 0v24q34 16 68 0v-24z" fill="#2c211b" />
          <path d="M0-32l62 22-62 22-62-22z" fill={INK} />
          <path d="M0-32l62 22-62 22-62-22z" fill="none" stroke={CREAM} strokeOpacity=".15" strokeWidth="2" />
          <g transform="translate(0 -10)">
            <g className="cv-swing">
              <path d="M0 0L46 6v28" stroke={GOLD} strokeWidth="3" fill="none" strokeLinecap="round" />
              <rect x="41" y="32" width="10" height="14" rx="3" fill={GOLD} />
            </g>
          </g>
          <circle cx="0" cy="-10" r="4.5" fill={GOLD} />
        </g>
      </g>
      <g transform="translate(56 104) rotate(-20) scale(.8)">
        <rect x="-36" y="-10" width="72" height="20" rx="10" fill={CREAM} />
        <circle cx="-36" cy="0" r="10" fill="#efe2cf" />
        <rect x="-4" y="-11" width="9" height="22" fill={BRAND} />
      </g>
      <Confetti
        bits={[
          { x: 30, c: CREAM, d: 0.4, t: 6 },
          { x: 120, c: BRAND, d: 2.6, t: 7 },
          { x: 214, c: CREAM, d: 1.4, t: 6.2 },
          { x: 250, c: INK, d: 3.8, t: 7.4 },
          { x: 296, c: BRAND, d: 0.9, t: 5.8 },
        ]}
      />
    </>
  );
}

function Tribute() {
  return (
    <>
      <circle cx="160" cy="84" r="56" fill={GOLD} opacity=".22" className="cv-glow" />
      <g transform="translate(0 34)">
        <g className="cv-glide">
          <path
            d="M0 12q10-5 19-1q7-12 19-14q-5 9-11 15q9 2 16-3q-5 10-18 10q-12 5-25-7z"
            fill={CREAM}
            opacity=".9"
          />
        </g>
      </g>
      <ellipse cx="160" cy="178" rx="44" ry="7" fill={GOLD} opacity=".55" />
      <rect x="145" y="100" width="30" height="76" rx="5" fill={CREAM} />
      <path d="M145 108q4 10 8 0q4 14 8 0" fill="#efe2cf" />
      <path d="M160 100v-8" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      <path d="M160 62q12 17 0 30q-12-13 0-30z" fill={GOLD} className="cv-flicker" />
      <path d="M160 76q5 8 0 14q-5-6 0-14z" fill={CREAM} />
      {[
        [138, 0],
        [178, 1.8],
        [152, 3.4],
        [192, 4.6],
        [124, 2.6],
      ].map(([x, d], i) => (
        <g key={i} transform={`translate(${x} 150)`}>
          <circle r="2.2" fill={GOLD} className="cv-rise" style={{ animationDelay: `${d}s` }} />
        </g>
      ))}
    </>
  );
}

const SCENES: Record<CoverScene, () => ReactNode> = {
  anniversaire: Birthday,
  dot: Wedding,
  bac: Graduation,
  hommage: Tribute,
};

/**
 * Pochette illustrée d'un exemple. `still` : version figée (vignettes de la liste).
 * Le dégradé de fond vient de la classe passée par le parent.
 */
export function ExampleCover({ scene, still = false, className = "" }: { scene: CoverScene; still?: boolean; className?: string }) {
  const patternId = `wax-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;
  const Scene = SCENES[scene];
  return (
    <svg
      viewBox="0 0 320 200"
      preserveAspectRatio="xMidYMid slice"
      className={`cv ${still ? "cv-still" : ""} ${className}`}
      aria-hidden="true"
    >
      <defs>
        {/* Motif losange discret, clin d'œil aux pagnes. */}
        <pattern id={patternId} width="26" height="26" patternUnits="userSpaceOnUse">
          <path d="M13 3l10 10-10 10L3 13z" fill="none" stroke={CREAM} strokeOpacity=".13" strokeWidth="1.5" />
          <circle cx="13" cy="13" r="1.6" fill={CREAM} fillOpacity=".18" />
        </pattern>
      </defs>
      <rect width="320" height="200" fill={`url(#${patternId})`} />
      <circle cx="160" cy="112" r="86" fill={CREAM} opacity=".12" />
      <Scene />
    </svg>
  );
}
