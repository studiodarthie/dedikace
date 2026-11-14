// Fabrique les icônes et logos de l'app à partir du dossier logo/ (fourni par le porteur du projet).
// Usage : node scripts/make-brand.mjs
import fs from "node:fs";
import sharp from "sharp";

const src = (f) => fs.readFileSync(`logo/${f}`);
const icon = src("dedikace-icone-app.svg");
// Version carrée sans coins arrondis (Apple et Android arrondissent eux-mêmes).
const square = Buffer.from(icon.toString().replace(/ rx="\d+"/, ""));

for (const [from, to] of [
  ["dedikace-logo-couleur.svg", "logo-couleur.svg"],
  ["dedikace-logo-blanc.svg", "logo-blanc.svg"],
  ["dedikace-logo-noir.svg", "logo-noir.svg"],
  ["dedikace-icone-app.svg", "icone.svg"],
  ["dedikace-icone-app-sombre.svg", "icone-sombre.svg"],
]) fs.copyFileSync(`logo/${from}`, `public/brand/${to}`);
for (const f of ["logo-blanc.svg", "logo-couleur.svg", "icone.svg"]) fs.copyFileSync(`public/brand/${f}`, `assets/brand/${f}`);
fs.copyFileSync("logo/dedikace-icone-app.svg", "app/icon.svg");

const png = (svg, size) => sharp(svg, { density: 300 }).resize(size, size).png().toBuffer();
fs.writeFileSync("app/apple-icon.png", await png(square, 180));
fs.writeFileSync("public/brand/icone-192.png", await png(icon, 192));
fs.writeFileSync("public/brand/icone-512.png", await png(icon, 512));
fs.writeFileSync("public/brand/icone-maskable-512.png", await png(square, 512));
// Logo en PNG pour les e-mails (Gmail n'affiche pas le SVG).
await sharp(src("dedikace-logo-couleur.svg"), { density: 200 }).resize({ width: 480 }).png().toFile("public/brand/logo-email.png");

// favicon.ico : 16, 32 et 48 px (PNG dans un conteneur ICO).
const sizes = [16, 32, 48];
const imgs = await Promise.all(sizes.map((s) => png(icon, s)));
const head = Buffer.alloc(6 + 16 * sizes.length);
head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(sizes.length, 4);
let offset = head.length;
sizes.forEach((s, i) => {
  const e = 6 + 16 * i;
  head.writeUInt8(s, e); head.writeUInt8(s, e + 1); head.writeUInt16LE(1, e + 4); head.writeUInt16LE(32, e + 6);
  head.writeUInt32LE(imgs[i].length, e + 8); head.writeUInt32LE(offset, e + 12);
  offset += imgs[i].length;
});
fs.writeFileSync("app/favicon.ico", Buffer.concat([head, ...imgs]));
console.log("ok");
