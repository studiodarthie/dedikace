import { ImageResponse } from "next/og";

// Image d'aperçu partagée par toutes les pages (WhatsApp, Facebook…), générée une fois au build.
export const alt = "Dédikace — Ton nom dans une chanson";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#fff8ee",
          color: "#1d1410",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 44, fontWeight: 800, color: "#e0451b" }}>Dédikace.</div>
        <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1.05, marginTop: 30 }}>Ton nom dans</div>
        <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1.05, color: "#e0451b" }}>une chanson. 🎶</div>
        <div style={{ fontSize: 36, marginTop: 40, color: "#6b5a4e" }}>
          Makossa · Bikutsi · Rumba · Afrobeats · Gospel…
        </div>
      </div>
    ),
    size,
  );
}
