"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { getConsent, resetConsent, setConsent, subscribeConsent, type Consent } from "@/lib/consent";

// Codes officiels de Meta et TikTok. Ils créent une file d'attente (fbq / ttq) tout de suite,
// puis chargent le vrai script après l'affichage : les événements envoyés entre-temps ne sont pas perdus.
const meta = (id: string) => `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;
n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init',${JSON.stringify(id)});fbq('track','PageView');`;

const tiktok = (id: string) => `!function (w, d, t) {w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],
ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},
ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,
ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=d.createElement("script");o.type="text/javascript",
o.async=!0,o.src=r+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
ttq.load(${JSON.stringify(id)});ttq.page();}(window, document, 'ttq');`;

const serverConsent = (): Consent | "loading" => "loading";

/**
 * Chargé sur toutes les pages publiques, jamais dans le back-office.
 * Les pixels ne se chargent qu'après « Accepter » (RGPD, visiteurs d'Europe et du Canada).
 */
export function Pixels({ metaId, tiktokId }: { metaId?: string; tiktokId?: string }) {
  const pathname = usePathname();
  const consent = useSyncExternalStore<Consent | "loading">(subscribeConsent, getConsent, serverConsent);
  const loaded = useRef(false);

  const validMeta = !!metaId && /^\d{5,20}$/.test(metaId);
  const validTiktok = !!tiktokId && /^[A-Z0-9]{10,30}$/.test(tiktokId);

  // Retrait du consentement après chargement : on recharge la page pour décharger les pixels.
  useEffect(() => {
    if (consent === "yes") loaded.current = true;
    else if (loaded.current && consent !== "loading") window.location.reload();
  }, [consent]);

  if (pathname.startsWith("/admin") || (!validMeta && !validTiktok) || consent === "loading") return null;
  if (consent === "unset") return <CookieBanner />;
  if (consent === "no") return null;
  return (
    <>
      {validMeta && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {meta(metaId)}
        </Script>
      )}
      {validTiktok && (
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {tiktok(tiktokId)}
        </Script>
      )}
    </>
  );
}

function CookieBanner() {
  return (
    <div
      role="dialog"
      aria-label="Cookies"
      className="fixed inset-x-0 bottom-0 z-[60] p-3 md:right-auto md:bottom-4 md:left-4 md:max-w-sm md:p-0"
    >
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 text-sm shadow-xl ring-1 shadow-ink/15 ring-sand">
        <p>
          🍪 On aimerait utiliser des cookies de mesure (Meta, TikTok) pour savoir quelles pubs t’amènent ici.
          Le site marche pareil si tu refuses.{" "}
          <Link href="/confidentialite#cookies" className="font-semibold underline">
            En savoir plus
          </Link>
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setConsent("no")}
            className="h-11 rounded-full bg-sand font-bold text-ink transition active:scale-[0.98]"
          >
            Refuser
          </button>
          <button
            type="button"
            onClick={() => setConsent("yes")}
            className="h-11 rounded-full bg-ink font-bold text-white transition active:scale-[0.98]"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}

/** Lien « Cookies » du pied de page : redemande le choix. Caché s'il n'y a aucun pixel. */
export function CookieSettingsLink({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;
  return (
    <button type="button" onClick={resetConsent} className="underline">
      Cookies
    </button>
  );
}
