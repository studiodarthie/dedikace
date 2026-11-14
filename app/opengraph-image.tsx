import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

// Image d'aperçu partagée par toutes les pages (WhatsApp, Facebook…), générée une fois au build.
export const alt = "Dédikace — Ton nom dans une chanson";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const logo = await readFile(path.join(process.cwd(), "public/brand/logo-couleur.svg"));
  const icon = await readFile(path.join(process.cwd(), "public/brand/icone.svg"));
  const font = await readFile(path.join(process.cwd(), "assets/fonts/Outfit-ExtraBold.ttf"));
  const src = (svg: Buffer) => `data:image/svg+xml;base64,${svg.toString("base64")}`;
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
          position: "relative",
          background: "#fff8ee",
          color: "#1d1410",
          fontFamily: "Outfit",
        }}
      >
        <img src={src(logo)} width={302} height={70} alt="" />
        <img src={src(icon)} width={260} height={260} alt="" style={{ position: "absolute", right: 80, top: 80 }} />
        <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1.05, marginTop: 30 }}>Ton nom dans</div>
        <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1.05, color: "#d9401a" }}>une chanson. 🎶</div>
        <div style={{ fontSize: 36, marginTop: 40, color: "#6b5a4e" }}>
          Makossa · Bikutsi · Rumba · Afrobeats · Gospel…
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Outfit", data: font, weight: 800, style: "normal" }] },
  );
}
