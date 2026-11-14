import { exportSales, parsePeriod, PERIODS } from "@/lib/admin-stats";
import { requireAdmin } from "@/lib/auth";
import { occasionLabel } from "@/lib/occasions";
import { getStyle } from "@/lib/styles";
import { CHANNEL_LABELS } from "../labels";

// Export CSV des ventes payées (comptabilité), réservé au back-office. Ouvrable dans Excel ou Google Sheets.

const dateFormat = new Intl.DateTimeFormat("fr-FR", { timeZone: "Africa/Douala", dateStyle: "short", timeStyle: "short" });

/** Cellule CSV sûre : guillemets doublés, et pas de formule exécutée par le tableur (=, +, -, @). */
function cell(value: unknown): string {
  let text = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const { email } = await requireAdmin();
  const period = parsePeriod(new URL(request.url).searchParams.get("periode"));
  const sales = await exportSales(period);
  console.info(`[admin] ${email} exporte ${sales.length} ventes (${period})`);

  const header = ["Date", "Code", "Occasion", "Style", "Paiement", "Montant (FCFA)", "Téléphone", "Pour", "Référence"];
  const lines = sales.map((s) =>
    [
      dateFormat.format(new Date(s.paid_at)),
      s.code,
      occasionLabel(s.occasion),
      getStyle(s.style)?.label ?? s.style,
      CHANNEL_LABELS[s.channel] ?? s.channel,
      s.amount,
      s.phone,
      s.recipient,
      s.reference,
    ]
      .map(cell)
      .join(";"),
  );
  // BOM : Excel lit correctement les accents ; « ; » : séparateur attendu par Excel en français.
  const body = "﻿" + [header.map(cell).join(";"), ...lines].join("\r\n");
  const label = PERIODS[period].label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="dedikace-ventes-${label}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
