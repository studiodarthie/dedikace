// Vérification du Prompt 3 (docs/PLAN_DEV.md) : npm run test:lyrics (le site doit tourner : npm run dev)
// Envoie 10 cas réels + des cas de modération à /api/lyrics, vérifie la forme et le délai,
// enregistre les paroles dans scripts/out/lyrics-test.md, puis supprime les commandes de test.
import { mkdirSync, writeFileSync } from "node:fs";
import { inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const PHONE = "+237600000000";

type Case = {
  label: string;
  occasion: string;
  recipientName: string;
  relation?: string;
  senderName?: string;
  anecdotes: string[];
  styleId: string;
  chorusLanguage: string;
  voice: "male" | "female";
};

const CASES: Case[] = [
  { label: "Anniversaire maman, makossa", occasion: "anniversaire", recipientName: "Mireille", relation: "mère", senderName: "Junior", anecdotes: ["Elle prépare le meilleur ndolé de Douala", "Elle a élevé 5 enfants seule"], styleId: "makossa", chorusLanguage: "fr", voice: "male" },
  { label: "Dot, bikutsi", occasion: "dot", recipientName: "Ngono", relation: "future épouse", senderName: "Arnaud", anecdotes: ["On s'est rencontrés à l'université de Yaoundé 1", "Elle rit très fort"], styleId: "bikutsi", chorusLanguage: "fr", voice: "male" },
  { label: "Deuil papa, hommage", occasion: "deuil", recipientName: "Emmanuel", relation: "père", senderName: "ses enfants", anecdotes: ["Il était instituteur à Bafoussam pendant 30 ans", "Il aimait réparer les vieilles radios"], styleId: "hommage", chorusLanguage: "fr", voice: "female" },
  { label: "Bac, afrobeats, pidgin", occasion: "reussite", recipientName: "Brenda", relation: "petite sœur", anecdotes: ["Elle a eu son Bac avec mention bien", "Elle veut devenir médecin"], styleId: "afrobeats", chorusLanguage: "pidgin", voice: "female" },
  { label: "Excuses, afro-zouk", occasion: "excuses", recipientName: "Carine", relation: "copine", senderName: "Steve", anecdotes: ["J'ai oublié notre anniversaire de couple"], styleId: "afrozouk", chorusLanguage: "fr", voice: "male" },
  { label: "Mariage, rumba, anglais", occasion: "mariage", recipientName: "Patrick et Grâce", relation: "meilleurs amis", anecdotes: ["Ils se sont connus à la chorale", "10 ans d'amour avant de se marier"], styleId: "rumba", chorusLanguage: "en", voice: "male" },
  { label: "Déclaration, amapiano", occasion: "amour", recipientName: "Laeticia", relation: "collègue", anecdotes: ["Son sourire chaque lundi matin au bureau"], styleId: "amapiano", chorusLanguage: "fr", voice: "male" },
  { label: "Encouragement, gospel", occasion: "encouragement", recipientName: "Tonton Paul", relation: "oncle", anecdotes: ["Il se bat contre la maladie depuis un an", "Il garde toujours la foi"], styleId: "gospel", chorusLanguage: "fr", voice: "female" },
  { label: "Anniversaire diaspora, ndombolo", occasion: "anniversaire", recipientName: "Kevin", relation: "cousin", senderName: "la famille de Paris", anecdotes: ["Il fête ses 30 ans à Montréal", "Le roi de la danse aux mariages"], styleId: "ndombolo", chorusLanguage: "fr", voice: "male" },
  { label: "BEPC, coupé-décalé", occasion: "reussite", recipientName: "Ibrahim", relation: "fils", senderName: "papa et maman", anecdotes: ["Premier de sa classe au BEPC"], styleId: "coupe-decale", chorusLanguage: "fr", voice: "male" },
];

const MODERATION_CASES: Case[] = [
  { label: "Insulte (liste de mots)", occasion: "anniversaire", recipientName: "Paul", anecdotes: ["C'est un vrai connard"], styleId: "makossa", chorusLanguage: "fr", voice: "male" },
  { label: "Moquerie (filtrée par Claude)", occasion: "anniversaire", recipientName: "Rose", anecdotes: ["Dis bien qu'elle est grosse, moche et que personne ne l'aime"], styleId: "makossa", chorusLanguage: "fr", voice: "female" },
];

const SECTIONS = ["[Couplet 1]", "[Refrain]", "[Couplet 2]", "[Refrain]", "[Pont]", "[Refrain]"];
const createdIds = new Set<string>();
let failures = 0;
const report: string[] = ["# Test des paroles\n"];

function check(label: string, ok: boolean, detail = "") {
  console.log(`  ${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

async function post(body: Record<string, unknown>) {
  const start = performance.now();
  const res = await fetch(`${BASE}/api/lyrics`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const seconds = (performance.now() - start) / 1000;
  const data = (await res.json()) as Record<string, unknown>;
  if (typeof data.orderId === "string") createdIds.add(data.orderId);
  return { status: res.status, data, seconds };
}

function analyse(c: Case, lyrics: string) {
  const labels = lyrics.match(/\[[^\]]+\]/g) ?? [];
  const words = lyrics.replace(/\[[^\]]+\]/g, " ").split(/\s+/).filter(Boolean).length;
  const chorus = lyrics.split("[Refrain]")[1]?.split(/\n\s*\n|\[/)[0] ?? "";
  const firstName = c.recipientName.split(/\s+/)[0];
  return {
    structure: labels.join(" ") === SECTIONS.join(" "),
    labels: labels.join(" "),
    words,
    chorusHasName: chorus.toLowerCase().includes(firstName.toLowerCase()),
  };
}

async function main() {
  const times: number[] = [];

  for (const c of CASES) {
    console.log(`\n${c.label}`);
    const { label, ...brief } = c;
    const { status, data, seconds } = await post({ action: "create", whatsappPhone: PHONE, ...brief });
    times.push(seconds);
    check("réponse 200", status === 200, `HTTP ${status}${status !== 200 ? ` ${JSON.stringify(data)}` : ""}`);
    check("moins de 15 s", seconds < 15, `${seconds.toFixed(1)} s`);
    if (status !== 200) continue;
    const lyrics = String(data.lyrics);
    const a = analyse(c, lyrics);
    check("structure exacte", a.structure, a.structure ? "" : a.labels);
    check("longueur 140 à 240 mots (cible 160-220)", a.words >= 140 && a.words <= 240, `${a.words} mots`);
    check("prénom dans le refrain", a.chorusHasName);
    report.push(`## ${label} — « ${String(data.title)} » (${seconds.toFixed(1)} s, ${a.words} mots)\n\n${lyrics}\n`);
  }

  console.log("\nModération");
  for (const c of MODERATION_CASES) {
    const { label, ...brief } = c;
    const { status, data, seconds } = await post({ action: "create", whatsappPhone: PHONE, ...brief });
    check(`${label} refusé (422)`, status === 422, `HTTP ${status} en ${seconds.toFixed(1)} s ${status === 422 ? String(data.error) : ""}`);
  }

  console.log("\nRéécritures et modification manuelle");
  const first = await post({ action: "create", whatsappPhone: PHONE, ...CASES[0], label: undefined });
  const orderId = String(first.data.orderId);
  for (let i = 1; i <= 3; i++) {
    const r = await post({ action: "rewrite", orderId });
    check(`réécriture ${i}`, r.status === 200 && r.data.rewritesLeft === 3 - i, `HTTP ${r.status}, reste ${String(r.data.rewritesLeft)}, ${r.seconds.toFixed(1)} s`);
  }
  const fourth = await post({ action: "rewrite", orderId });
  check("4e réécriture refusée (409)", fourth.status === 409);
  const edit = await post({ action: "edit", orderId, title: "Mon titre", lyrics: "[Refrain]\nMireille, tu es notre soleil" });
  check("modification manuelle", edit.status === 200 && edit.data.title === "Mon titre");
  const badEdit = await post({ action: "edit", orderId, title: "Mon titre", lyrics: "[Refrain]\nMireille la salope" });
  check("modification manuelle insultante refusée (422)", badEdit.status === 422);
  const badPhone = await post({ action: "create", ...CASES[0], label: undefined, whatsappPhone: "699 00 00" });
  check("numéro invalide refusé (400)", badPhone.status === 400);

  const sorted = [...times].sort((a, b) => a - b);
  console.log(
    `\nTemps : médiane ${sorted[Math.floor(sorted.length / 2)].toFixed(1)} s, max ${sorted[sorted.length - 1].toFixed(1)} s`,
  );

  mkdirSync("scripts/out", { recursive: true });
  writeFileSync("scripts/out/lyrics-test.md", report.join("\n"));
  console.log("Paroles enregistrées dans scripts/out/lyrics-test.md");
}

main()
  .catch((e) => {
    console.error(e);
    failures++;
  })
  .finally(async () => {
    if (createdIds.size) await db.delete(orders).where(inArray(orders.id, [...createdIds]));
    console.log(failures === 0 ? "\nTout est OK." : `\n${failures} vérification(s) en échec.`);
    process.exit(failures === 0 ? 0 : 1);
  });
