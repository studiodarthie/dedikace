import type { ReactNode } from "react";

// Squelettes de chargement : la forme de la page apparaît tout de suite (3G), le contenu se glisse dedans.
// Aucune animation pour les téléphones réglés en « animations réduites ».

function Bone({ className = "" }: { className?: string }) {
  return <div className={`bg-ink/10 ${className.includes("rounded") ? "" : "rounded-xl"} ${className}`} />;
}

function Skeleton({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div role="status" aria-label="Chargement" className={`flex animate-pulse flex-col motion-reduce:animate-none ${className}`}>
      <span className="sr-only">Chargement…</span>
      {children}
    </div>
  );
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-sand ${className}`}>{children}</div>;
}

/** /creer : barre d'étapes, titre, encadré « paroles gratuites », grille des occasions. */
export function CreateSkeleton() {
  return (
    <Skeleton className="gap-6 pt-6">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between">
          <Bone className="h-4 w-24" />
          <Bone className="h-4 w-8" />
        </div>
        <Bone className="h-2.5 w-full rounded-full" />
      </div>
      <div className="flex flex-col gap-2">
        <Bone className="h-9 w-4/5" />
        <Bone className="h-9 w-1/2" />
      </div>
      <Card>
        <Bone className="h-5 w-3/5" />
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-4/5" />
        <div className="flex gap-2">
          <Bone className="h-7 w-24 rounded-lg" />
          <Bone className="h-7 w-28 rounded-lg" />
        </div>
      </Card>
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex h-28 flex-col items-center justify-center gap-2 rounded-2xl bg-white ring-1 ring-sand">
            <Bone className="h-8 w-8 rounded-full" />
            <Bone className="h-4 w-20" />
          </div>
        ))}
      </div>
    </Skeleton>
  );
}

/** /s/[code] : étiquette, titre, « pour … », 2 lecteurs, bouton. */
export function SongSkeleton() {
  return (
    <Skeleton className="gap-6 pt-4">
      <div className="flex flex-col gap-2">
        <Bone className="h-7 w-40 rounded-full" />
        <Bone className="h-10 w-4/5" />
        <Bone className="h-5 w-3/5" />
      </div>
      {[1, 2].map((v) => (
        <Card key={v}>
          <Bone className="h-5 w-24" />
          <Bone className="h-12 w-full rounded-full" />
          <Bone className="h-11 w-full rounded-full" />
        </Card>
      ))}
      <Bone className="h-14 w-full rounded-2xl" />
    </Skeleton>
  );
}

/** /commande/[id] : titre, encadré de la commande, étapes, bouton de paiement. */
export function OrderSkeleton() {
  return (
    <Skeleton className="gap-6 pt-6">
      <div className="flex flex-col gap-2">
        <Bone className="h-9 w-3/4" />
        <Bone className="h-5 w-1/2" />
      </div>
      <Card>
        <Bone className="h-5 w-2/5" />
        {Array.from({ length: 5 }, (_, i) => (
          <Bone key={i} className={`h-4 ${i % 2 ? "w-4/5" : "w-full"}`} />
        ))}
      </Card>
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((i) => (
          <Bone key={i} className="h-16 rounded-2xl" />
        ))}
      </div>
      <Bone className="h-14 w-full rounded-full" />
    </Skeleton>
  );
}

/** /compte : bonjour, bouton « Créer », liste « Mes chansons ». */
export function AccountSkeleton() {
  return (
    <Skeleton className="gap-6 pt-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-1 flex-col gap-2">
          <Bone className="h-8 w-48" />
          <Bone className="h-4 w-32" />
        </div>
        <Bone className="h-12 w-12 rounded-full" />
      </div>
      <div className="flex items-center gap-4 rounded-3xl bg-white p-4 ring-1 ring-sand">
        <Bone className="h-14 w-14 rounded-2xl" />
        <div className="flex flex-1 flex-col gap-2">
          <Bone className="h-5 w-3/4" />
          <Bone className="h-4 w-full" />
        </div>
      </div>
      <Bone className="h-6 w-36" />
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-sand">
            <Bone className="h-12 w-12 rounded-xl" />
            <div className="flex flex-1 flex-col gap-2">
              <Bone className="h-4 w-3/5" />
              <Bone className="h-3 w-2/5" />
            </div>
          </div>
        ))}
      </div>
    </Skeleton>
  );
}
