"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

// Statistiques de visite Vercel : sans cookie et sans donnée personnelle, donc sans bandeau de consentement.
// On ignore le back-office et on ne garde dans l'adresse que les paramètres de campagne (utm_*, ref).
function clean(event: BeforeSendEvent): BeforeSendEvent | null {
  const url = new URL(event.url);
  if (url.pathname.startsWith("/admin")) return null;
  for (const key of [...url.searchParams.keys()]) {
    if (!key.startsWith("utm_") && key !== "ref") url.searchParams.delete(key);
  }
  url.hash = "";
  return { ...event, url: url.toString() };
}

export function WebAnalytics() {
  return (
    <>
      <Analytics beforeSend={clean} />
      <SpeedInsights sampleRate={0.5} />
    </>
  );
}
