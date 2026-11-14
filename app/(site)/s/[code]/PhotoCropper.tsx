"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/use-locale";

// Cadrage de la photo avant la vidéo : on la déplace au doigt et on zoome (curseur ou pincement),
// puis on envoie exactement le cadre vertical choisi (9:16).

const OW = 900;
const OH = 1600;
const MAX_ZOOM = 4;

type View = { zoom: number; cx: number; cy: number };

/** Garde la photo collée aux bords du cadre (jamais de bande vide). */
function clamp(v: View, iw: number, ih: number): View {
  const zoom = Math.min(MAX_ZOOM, Math.max(1, v.zoom));
  const s = Math.max(OW / iw, OH / ih) * zoom;
  const mx = (iw * s - OW) / 2;
  const my = (ih * s - OH) / 2;
  return { zoom, cx: Math.min(mx, Math.max(-mx, v.cx)), cy: Math.min(my, Math.max(-my, v.cy)) };
}

function draw(ctx: CanvasRenderingContext2D, img: ImageBitmap, v: View, k: number) {
  const s = Math.max(OW / img.width, OH / img.height) * v.zoom;
  const dw = img.width * s;
  const dh = img.height * s;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, OW, OH);
  ctx.drawImage(img, OW / 2 + v.cx - dw / 2, OH / 2 + v.cy - dh / 2, dw, dh);
}

/** Photo remise droite (EXIF) et réduite à 2000 px : léger pour un vieux téléphone. */
async function load(file: File): Promise<ImageBitmap> {
  const full = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, 2000 / Math.max(full.width, full.height));
  if (scale === 1) return full;
  const small = await createImageBitmap(full, {
    resizeWidth: Math.round(full.width * scale),
    resizeHeight: Math.round(full.height * scale),
    resizeQuality: "high",
  });
  full.close();
  return small;
}

export function PhotoCropper({
  file,
  onCancel,
  onConfirm,
}: {
  file: File;
  onCancel: () => void;
  onConfirm: (photo: Blob) => void;
}) {
  const en = useLocale() === "en";
  const [img, setImg] = useState<ImageBitmap | null>(null);
  const [failed, setFailed] = useState(false);
  const [view, setView] = useState<View>({ zoom: 1, cx: 0, cy: 0 });
  const canvas = useRef<HTMLCanvasElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);

  useEffect(() => {
    let alive = true;
    let loaded: ImageBitmap | null = null;
    load(file).then(
      (b) => {
        loaded = b;
        if (alive) setImg(b);
        else b.close();
      },
      () => alive && setFailed(true),
    );
    return () => {
      alive = false;
      loaded?.close();
    };
  }, [file]);

  // Aperçu redessiné à chaque geste.
  useEffect(() => {
    const c = canvas.current;
    if (!c || !img) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = c.clientWidth * dpr;
    if (c.width !== Math.round(w)) {
      c.width = Math.round(w);
      c.height = Math.round((w * OH) / OW);
    }
    draw(c.getContext("2d")!, img, view, c.width / OW);
  }, [img, view]);

  const update = (next: View) => img && setView(clamp(next, img.width, img.height));
  const unit = () => OW / (canvas.current?.clientWidth || 1); // px écran → px du cadre

  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom: view.zoom };
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      update({ ...view, zoom: pinch.current.zoom * (Math.hypot(a.x - b.x, a.y - b.y) / pinch.current.dist) });
    } else if (pointers.current.size === 1) {
      const k = unit();
      update({ ...view, cx: view.cx + (e.clientX - prev.x) * k, cy: view.cy + (e.clientY - prev.y) * k });
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
  }

  function confirm() {
    if (!img) return;
    const out = document.createElement("canvas");
    out.width = OW;
    out.height = OH;
    draw(out.getContext("2d")!, img, view, 1);
    out.toBlob((b) => (b ? onConfirm(b) : setFailed(true)), "image/jpeg", 0.88);
  }

  if (failed) {
    return (
      <div className="flex flex-col gap-3">
        <p role="alert" className="rounded-2xl bg-red-50 p-4 font-medium text-red-800 ring-1 ring-red-200">
          {en ? "We can’t open this photo. Try another one." : "On n’arrive pas à ouvrir cette photo. Essaie avec une autre."}
        </p>
        <button type="button" onClick={onCancel} className="h-12 rounded-2xl bg-cream font-bold ring-1 ring-sand">
          {en ? "Choose another photo" : "Choisir une autre photo"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center text-sm font-medium">
        {en ? "Drag the photo and zoom to frame the face nicely." : "Fais glisser la photo et zoome pour bien cadrer le visage."}
      </p>
      <div className="relative mx-auto w-full max-w-[260px]">
        <canvas
          ref={canvas}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="aspect-[9/16] w-full cursor-grab touch-none rounded-2xl bg-ink active:cursor-grabbing"
          aria-label={en ? "Framing preview: drag to move the photo" : "Aperçu du cadrage : fais glisser pour déplacer la photo"}
        />
        {!img && (
          <span
            className="absolute inset-0 m-auto h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent"
            aria-hidden="true"
          />
        )}
      </div>
      <label className="flex items-center gap-3 text-sm font-medium">
        <span aria-hidden="true">➖</span>
        <input
          type="range"
          min={1}
          max={MAX_ZOOM}
          step={0.01}
          value={view.zoom}
          onChange={(e) => update({ ...view, zoom: Number(e.target.value) })}
          className="w-full accent-brand"
          aria-label="Zoom"
        />
        <span aria-hidden="true">➕</span>
      </label>
      <button
        type="button"
        onClick={confirm}
        disabled={!img}
        className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-brand px-6 text-lg font-bold text-white shadow-md shadow-brand/30 transition active:scale-[0.98] disabled:opacity-70"
      >
        <span aria-hidden="true">🎬</span> {en ? "Create the video" : "Créer la vidéo"}
      </button>
      <button type="button" onClick={onCancel} className="text-sm font-medium text-muted underline">
        {en ? "Choose another photo" : "Choisir une autre photo"}
      </button>
    </div>
  );
}
