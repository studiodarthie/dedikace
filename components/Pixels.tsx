"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { META_PIXEL_ID, TIKTOK_PIXEL_ID } from "@/lib/pixels";

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

/** Chargé sur toutes les pages publiques, jamais dans le back-office. */
export function Pixels() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return (
    <>
      {/^\d{5,20}$/.test(META_PIXEL_ID) && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {meta(META_PIXEL_ID)}
        </Script>
      )}
      {/^[A-Z0-9]{10,30}$/.test(TIKTOK_PIXEL_ID) && (
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {tiktok(TIKTOK_PIXEL_ID)}
        </Script>
      )}
    </>
  );
}
