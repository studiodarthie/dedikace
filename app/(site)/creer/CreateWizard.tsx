"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { formatXaf, whatsappLink } from "@/lib/format";
import { CHORUS_LANGUAGES, MEMORY_IDEAS, OCCASIONS, type OccasionId } from "@/lib/occasions";
import { trackPixel } from "@/lib/pixels";
import { STYLE_TAGLINES, STYLES } from "@/lib/styles";
import { VoiceNote } from "./VoiceNote";

// ---------- Brouillon (localStorage) ----------

const STORAGE_KEY = "dedikace:brouillon:v1";
const MAX_ANECDOTES_CHARS = 500;
const MAX_ANECDOTES = 3;
const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "";
// « Pour qui ? » : libellé affiché → valeur envoyée aux paroles (champ relation).
const RELATIONS = [
  { emoji: "👩🏾", label: "Maman", value: "ma mère" },
  { emoji: "👨🏾", label: "Papa", value: "mon père" },
  { emoji: "❤️", label: "Ma chérie", value: "ma chérie" },
  { emoji: "💙", label: "Mon chéri", value: "mon chéri" },
  { emoji: "👧🏾", label: "Ma sœur", value: "ma sœur" },
  { emoji: "👦🏾", label: "Mon frère", value: "mon frère" },
  { emoji: "🧒🏾", label: "Mon enfant", value: "mon enfant" },
  { emoji: "🤝🏾", label: "Mon ami(e)", value: "mon ami(e)" },
  { emoji: "💼", label: "Collègue", value: "mon collègue" },
];

type Form = {
  occasion: string;
  recipientName: string;
  relation: string;
  senderName: string;
  anecdotes: string[];
  styleId: string;
  chorusLanguage: string;
  voice: "male" | "female";
  whatsappPhone: string;
};

type Lyrics = { orderId: string; title: string; lyrics: string; rewritesLeft: number };

type Draft = { step: number; form: Form; saved?: Lyrics; editTitle?: string; editLyrics?: string };

const EMPTY_FORM: Form = {
  occasion: "",
  recipientName: "",
  relation: "",
  senderName: "",
  anecdotes: [""],
  styleId: "",
  chorusLanguage: "fr",
  voice: "female",
  whatsappPhone: "+237 ",
};

function loadDraft(): Draft {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const draft = JSON.parse(raw) as Draft;
      const step = draft.step === 4 && !draft.saved ? 3 : draft.step;
      return { ...draft, step, form: { ...EMPTY_FORM, ...draft.form } };
    }
  } catch {
    // localStorage indisponible (navigation privée) ou brouillon illisible : on repart de zéro.
  }
  return { step: 0, form: EMPTY_FORM };
}

function saveDraft(draft: Draft) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Pas grave : le brouillon ne sera simplement pas conservé.
  }
}

/** Aussi appelée par la page d'attente une fois le paiement reçu. */
export function clearDraft() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

// Le brouillon n'existe que dans le navigateur : on attend d'y être pour l'afficher.
const noopSubscribe = () => () => {};
function useIsClient() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

// ---------- Validation (mêmes règles que /api/lyrics) ----------

const cleanPhone = (v: string) => v.replace(/[\s.\-()]/g, "");
const anecdotesLength = (list: string[]) => list.reduce((n, a) => n + a.trim().length, 0);

function stepError(step: number, f: Form): string | null {
  if (step === 0 && !f.occasion) return "Choisis une occasion.";
  if (step === 1) {
    if (!f.recipientName.trim()) return "Écris le prénom de la personne.";
    if (!f.anecdotes.some((a) => a.trim())) return "Ajoute au moins un souvenir ou un détail.";
    if (anecdotesLength(f.anecdotes) > MAX_ANECDOTES_CHARS) return "Tes souvenirs dépassent 500 caractères.";
  }
  if (step === 2 && !f.styleId) return "Choisis un style de musique.";
  if (step === 3 && !/^\+[1-9]\d{7,14}$/.test(cleanPhone(f.whatsappPhone))) {
    return "Écris ton numéro WhatsApp avec l'indicatif, par exemple +237 6XX XX XX XX.";
  }
  return null;
}

// ---------- Composant principal ----------

type Prices = { priceMomo: number; priceCard: number };

export function CreateWizard(prices: Prices) {
  const isClient = useIsClient();
  if (!isClient) {
    return <div className="mt-6 h-64 animate-pulse rounded-3xl bg-sand/60" aria-label="Chargement" />;
  }
  return <Wizard initial={loadDraft()} {...prices} />;
}

const STEP_TITLES = ["L'occasion", "La personne", "La musique", "Ton contact", "Tes paroles"];

function Wizard({ initial, priceMomo, priceCard }: { initial: Draft } & Prices) {
  const [step, setStep] = useState(initial.step);
  const [form, setForm] = useState<Form>(initial.form);
  const [saved, setSaved] = useState<Lyrics | undefined>(initial.saved);
  const [title, setTitle] = useState(initial.editTitle ?? initial.saved?.title ?? "");
  const [lyrics, setLyrics] = useState(initial.editLyrics ?? initial.saved?.lyrics ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "create" | "rewrite" | "save">(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [checkout, setCheckout] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  const checkoutRef = useRef<HTMLDivElement>(null);

  // Sauvegarde du brouillon à chaque changement.
  useEffect(() => {
    saveDraft({ step, form, saved, editTitle: title, editLyrics: lyrics });
  }, [step, form, saved, title, lyrics]);

  // « Formulaire commencé » : une fois par session, pour les compteurs du back-office et les pixels.
  useEffect(() => {
    try {
      if (sessionStorage.getItem("dedikace:form_started")) return;
      sessionStorage.setItem("dedikace:form_started", "1");
    } catch {}
    trackPixel("start");
    fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "form_started" }),
      keepalive: true,
    }).catch(() => {});
  }, []);

  const update = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setError(null);
  };

  // Une idée touchée prend la première case vide ; touchée à nouveau, elle est retirée.
  const toggleIdea = (idea: string) => {
    const list = form.anecdotes;
    if (list.some((a) => a.trim() === idea)) {
      const rest = list.filter((a) => a.trim() !== idea);
      return update("anecdotes", rest.length ? rest : [""]);
    }
    const empty = list.findIndex((a) => !a.trim());
    if (empty >= 0) return update("anecdotes", list.map((a, i) => (i === empty ? idea : a)));
    if (list.length < MAX_ANECDOTES) return update("anecdotes", [...list, idea]);
    setError("3 souvenirs au maximum. Retire-en un pour en ajouter un autre.");
  };

  // Texte d'un vocal : première case vide, sinon nouvelle case, sinon à la suite de la dernière.
  const addVoiceText = (text: string) => {
    const list = form.anecdotes;
    const room = MAX_ANECDOTES_CHARS - anecdotesLength(list);
    if (room <= 0) return setError("Tes souvenirs dépassent déjà 500 caractères. Raccourcis-les avant d'ajouter un vocal.");
    const clip = text.slice(0, room);
    const empty = list.findIndex((a) => !a.trim());
    if (empty >= 0) return update("anecdotes", list.map((a, i) => (i === empty ? clip : a)));
    if (list.length < MAX_ANECDOTES) return update("anecdotes", [...list, clip]);
    update("anecdotes", list.map((a, i) => (i === list.length - 1 ? `${a.trim()} ${clip}`.slice(0, MAX_ANECDOTES_CHARS) : a)));
  };

  const goTo = (next: number) => {
    setError(null);
    setNotice(null);
    setCheckout(false);
    setStep(next);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const next = () => {
    const err = stepError(step, form);
    if (err) return setError(err);
    if (step === 3) return void createLyrics();
    goTo(step + 1);
  };

  async function callLyrics(body: Record<string, unknown>): Promise<Lyrics | null> {
    try {
      const res = await fetch("/api/lyrics", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      // Limite anti-abus du pare-feu Vercel (réponse sans JSON).
      if (res.status === 429) {
        setError("Trop d’essais d’un coup. Attends une minute et réessaie.");
        return null;
      }
      const data = (await res.json()) as Partial<Lyrics> & { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue. Réessaie.");
        return null;
      }
      return data as Lyrics;
    } catch {
      setError("Pas de connexion internet. Vérifie ton réseau et réessaie.");
      return null;
    }
  }

  function applyLyrics(result: Lyrics) {
    setSaved(result);
    setTitle(result.title);
    setLyrics(result.lyrics);
  }

  async function createLyrics() {
    setBusy("create");
    setError(null);
    const result = await callLyrics({
      action: "create",
      ...form,
      whatsappPhone: cleanPhone(form.whatsappPhone),
      anecdotes: form.anecdotes.map((a) => a.trim()).filter(Boolean),
    });
    setBusy(null);
    if (result) {
      applyLyrics(result);
      goTo(4);
    }
  }

  const dirty = !!saved && (title !== saved.title || lyrics !== saved.lyrics);

  async function rewrite() {
    if (!saved) return;
    if (dirty && !window.confirm("Tes modifications seront remplacées par de nouvelles paroles. Continuer ?")) return;
    setBusy("rewrite");
    setError(null);
    setNotice(null);
    const result = await callLyrics({ action: "rewrite", orderId: saved.orderId });
    setBusy(null);
    if (result) applyLyrics(result);
  }

  async function saveEdits(): Promise<boolean> {
    if (!saved || !dirty) return true;
    if (!title.trim() || !lyrics.trim()) {
      setError("Le titre et les paroles ne peuvent pas être vides.");
      return false;
    }
    setBusy("save");
    setError(null);
    const result = await callLyrics({ action: "edit", orderId: saved.orderId, title, lyrics });
    setBusy(null);
    if (result) applyLyrics(result);
    return !!result;
  }

  async function openCheckout() {
    if (!(await saveEdits())) return;
    setCheckout(true);
    requestAnimationFrame(() => checkoutRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function restart() {
    if (!window.confirm("Tout effacer et recommencer ?")) return;
    clearDraft();
    setForm(EMPTY_FORM);
    setSaved(undefined);
    setTitle("");
    setLyrics("");
    goTo(0);
  }

  if (busy === "create") return <Writing name={form.recipientName} />;

  return (
    <div ref={topRef} className="flex scroll-mt-4 flex-col gap-6 pt-2">
      <Progress step={step} />

      {step === 0 && (
        <Step title="C'est pour quelle occasion ?">
          <TrustBanner price={priceMomo} />
          <div className="grid grid-cols-2 gap-3">
            {OCCASIONS.map((o) => (
              <Choice key={o.id} selected={form.occasion === o.id} onClick={() => update("occasion", o.id)}>
                <span className="block text-3xl" aria-hidden="true">
                  {o.emoji}
                </span>
                <span className="mt-1 block leading-tight">{o.label}</span>
              </Choice>
            ))}
          </div>
        </Step>
      )}

      {step === 1 && (
        <Step title="Pour qui est la chanson ?">
          <Field group label="C'est pour…">
            <div className="grid grid-cols-3 gap-2">
              {RELATIONS.map((r) => (
                <Choice key={r.value} selected={form.relation === r.value} onClick={() => update("relation", r.value)} compact>
                  <span className="block text-2xl" aria-hidden="true">
                    {r.emoji}
                  </span>
                  <span className="block text-sm leading-tight">{r.label}</span>
                </Choice>
              ))}
            </div>
            <input
              className={`${inputClass} mt-1`}
              value={RELATIONS.some((r) => r.value === form.relation) ? "" : form.relation}
              onChange={(e) => update("relation", e.target.value)}
              maxLength={40}
              aria-label="Autre lien avec la personne"
              placeholder="Autre ? Ex. ma tante, mon parrain"
            />
          </Field>
          <Field label="Son prénom" hint="Il sera chanté dans le refrain.">
            <input
              className={inputClass}
              value={form.recipientName}
              onChange={(e) => update("recipientName", e.target.value)}
              maxLength={40}
              autoComplete="off"
              placeholder="Ex. Mireille"
            />
          </Field>
          <Field
            group
            label="Ce qui rend cette personne unique"
            hint={`${anecdotesLength(form.anecdotes)}/${MAX_ANECDOTES_CHARS} caractères. Plus c'est précis (un plat, un surnom, un lieu), plus la chanson est belle.`}
          >
            <VoiceNote onText={addVoiceText} />
            {form.occasion && (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-muted">Ou touche une idée, puis complète-la si tu veux :</p>
                <div className="flex flex-wrap gap-2">
                  {MEMORY_IDEAS[form.occasion as OccasionId]?.map((idea) => {
                    const picked = form.anecdotes.some((a) => a.trim() === idea);
                    return (
                      <button
                        key={idea}
                        type="button"
                        aria-pressed={picked}
                        onClick={() => toggleIdea(idea)}
                        className={`rounded-full px-3 py-2 text-left text-sm font-medium transition active:scale-95 ${
                          picked ? "bg-brand text-white" : "bg-white ring-1 ring-sand"
                        }`}
                      >
                        {picked ? "✓ " : "+ "}
                        {idea}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="mt-1 flex flex-col gap-2">
              {form.anecdotes.map((a, i) => (
                <div key={i} className="flex gap-2">
                  <textarea
                    className={`${inputClass} min-h-20`}
                    value={a}
                    onChange={(e) => update("anecdotes", form.anecdotes.map((x, j) => (j === i ? e.target.value : x)))}
                    aria-label={`Souvenir ${i + 1}`}
                    placeholder={i === 0 ? "Ou écris ton propre souvenir. Ex. Tu prépares le meilleur ndolé de Douala" : "Un autre souvenir"}
                    maxLength={MAX_ANECDOTES_CHARS}
                  />
                  {form.anecdotes.length > 1 && (
                    <button
                      type="button"
                      aria-label="Retirer ce souvenir"
                      onClick={() => update("anecdotes", form.anecdotes.filter((_, j) => j !== i))}
                      className="h-12 w-12 shrink-0 rounded-xl bg-sand text-xl"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              {form.anecdotes.length < MAX_ANECDOTES && (
                <button
                  type="button"
                  onClick={() => update("anecdotes", [...form.anecdotes, ""])}
                  className="w-fit rounded-xl px-2 py-1 font-semibold text-brand"
                >
                  + Ajouter un souvenir
                </button>
              )}
            </div>
          </Field>
          <Field label="Ton prénom" optional hint="Pour signer la chanson.">
            <input
              className={inputClass}
              value={form.senderName}
              onChange={(e) => update("senderName", e.target.value)}
              maxLength={40}
              placeholder="Ex. Junior"
            />
          </Field>
        </Step>
      )}

      {step === 2 && (
        <Step title="Quelle musique ?">
          <div className="flex flex-col gap-2">
            {STYLES.map((s) => (
              <Choice key={s.id} selected={form.styleId === s.id} onClick={() => update("styleId", s.id)} align="left">
                <span className="block font-bold">{s.label}</span>
                <span className="block text-sm font-normal text-muted">{STYLE_TAGLINES[s.id]}</span>
              </Choice>
            ))}
          </div>
          <Field group label="Langue du refrain" hint="Les couplets restent en français.">
            <div className="grid grid-cols-2 gap-2">
              {CHORUS_LANGUAGES.map((l) => (
                <Choice key={l.id} selected={form.chorusLanguage === l.id} onClick={() => update("chorusLanguage", l.id)}>
                  {l.label}
                </Choice>
              ))}
            </div>
          </Field>
          <Field group label="Voix">
            <div className="grid grid-cols-2 gap-2">
              <Choice selected={form.voice === "female"} onClick={() => update("voice", "female")}>
                Femme
              </Choice>
              <Choice selected={form.voice === "male"} onClick={() => update("voice", "male")}>
                Homme
              </Choice>
            </div>
          </Field>
        </Step>
      )}

      {step === 3 && (
        <Step title="Où t'envoyer la chanson ?">
          <Field label="Ton numéro WhatsApp" hint="Avec l'indicatif du pays : +237 au Cameroun, +33 en France…">
            <input
              className={inputClass}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={form.whatsappPhone}
              onChange={(e) => update("whatsappPhone", e.target.value)}
              placeholder="+237 6XX XX XX XX"
            />
          </Field>
          <p className="rounded-2xl bg-sand/60 p-4 text-sm text-muted">
            Les paroles sont <strong className="text-ink">gratuites</strong>. Tu ne paies que si elles te plaisent.
          </p>
        </Step>
      )}

      {step === 4 && saved && (
        <Step title="Voici tes paroles">
          <p className="-mt-2 text-muted">Lis-les, modifie ce que tu veux, ou demande une autre version.</p>
          <Field label="Titre">
            <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
          </Field>
          <Field label="Paroles">
            <textarea
              className={`${inputClass} min-h-[28rem] leading-relaxed`}
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              maxLength={4000}
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={rewrite}
              disabled={!!busy || saved.rewritesLeft === 0}
              className="h-12 rounded-2xl bg-white font-semibold ring-1 ring-sand disabled:opacity-50"
            >
              {busy === "rewrite" ? "Réécriture…" : `Réécrire (${saved.rewritesLeft})`}
            </button>
            <button
              type="button"
              onClick={() => void saveEdits()}
              disabled={!!busy || !dirty}
              className="h-12 rounded-2xl bg-white font-semibold ring-1 ring-sand disabled:opacity-50"
            >
              {busy === "save" ? "Enregistrement…" : dirty ? "Enregistrer" : "Enregistré ✓"}
            </button>
          </div>
        </Step>
      )}

      {error && (
        <p role="alert" className="rounded-2xl bg-red-50 p-4 font-medium text-red-800 ring-1 ring-red-200">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="rounded-2xl bg-green-50 p-4 font-medium text-leaf ring-1 ring-green-200">
          {notice}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {step < 4 ? (
          <PrimaryButton onClick={next}>{step === 3 ? "Écrire mes paroles gratuites" : "Continuer"}</PrimaryButton>
        ) : checkout && saved && !dirty ? (
          <div ref={checkoutRef} className="scroll-mt-4">
            <Checkout
              orderId={saved.orderId}
              whatsappPhone={cleanPhone(form.whatsappPhone)}
              priceMomo={priceMomo}
              priceCard={priceCard}
            />
          </div>
        ) : (
          <>
            <PrimaryButton onClick={openCheckout} disabled={!!busy}>
              Créer ma chanson pour {formatXaf(priceMomo)}
            </PrimaryButton>
            <PayBadges className="justify-center" />
          </>
        )}
        <div className="flex items-center justify-between">
          {step > 0 ? (
            <button type="button" onClick={() => goTo(step - 1)} className="px-2 py-2 font-semibold text-muted">
              ← {step === 4 ? "Modifier mes infos" : "Retour"}
            </button>
          ) : (
            <span />
          )}
          {(step > 0 || form.occasion) && (
            <button type="button" onClick={restart} className="px-2 py-2 text-sm text-muted underline">
              Recommencer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Paiement (Tranzak) ----------

type PayChannel = "mtn" | "orange" | "card";

const CHANNELS: { id: PayChannel; label: string; hint: string }[] = [
  { id: "mtn", label: "MTN MoMo", hint: "Validation sur ton téléphone" },
  { id: "orange", label: "Orange Money", hint: "Validation sur ton téléphone" },
  { id: "card", label: "Carte bancaire", hint: "Visa, Mastercard — idéal depuis l'étranger" },
];

function Checkout({ orderId, whatsappPhone, priceMomo, priceCard }: { orderId: string; whatsappPhone: string } & Prices) {
  const [channel, setChannel] = useState<PayChannel>("mtn");
  // Le numéro WhatsApp camerounais sert souvent aussi pour le Mobile Money.
  const [phone, setPhone] = useState(whatsappPhone.startsWith("+237") ? whatsappPhone.slice(4) : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const price = channel === "card" ? priceCard : priceMomo;
  const label = CHANNELS.find((c) => c.id === channel)!.label;

  async function submit() {
    const local = phone.replace(/[\s.\-()]/g, "").replace(/^(\+|00)?237/, "");
    if (channel !== "card" && !/^6\d{8}$/.test(local)) {
      return setError("Écris ton numéro Mobile Money à 9 chiffres, par exemple 6XX XX XX XX.");
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/pay", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(channel === "card" ? { orderId, channel } : { orderId, channel, phone: local }),
      });
      const data = (await res.json()) as { redirectUrl?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Le paiement n'a pas pu démarrer. Réessaie.");
        setBusy(false);
        return;
      }
      window.location.assign(data.redirectUrl ?? `/commande/${orderId}`);
    } catch {
      setError("Pas de connexion internet. Vérifie ton réseau et réessaie.");
      setBusy(false);
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-sand" aria-label="Paiement">
      <h2 className="text-2xl font-extrabold">Comment veux-tu payer ?</h2>
      <div className="flex flex-col gap-2" role="group" aria-label="Moyen de paiement">
        {CHANNELS.map((c) => (
          <Choice key={c.id} selected={channel === c.id} onClick={() => setChannel(c.id)} align="left">
            <span className="flex items-center justify-between gap-3">
              <span>
                <span className="block font-bold">{c.label}</span>
                <span className="block text-sm font-normal text-muted">{c.hint}</span>
              </span>
              <span className="shrink-0 font-bold">{formatXaf(c.id === "card" ? priceCard : priceMomo)}</span>
            </span>
          </Choice>
        ))}
      </div>
      {channel !== "card" && (
        <Field label={`Ton numéro ${label}`} hint="Tu recevras une demande de paiement à valider avec ton code secret.">
          <div className="flex items-center gap-2">
            <span className="rounded-xl bg-sand px-3 py-3 font-semibold">+237</span>
            <input
              className={inputClass}
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setError(null);
              }}
              placeholder="6XX XX XX XX"
            />
          </div>
        </Field>
      )}
      {error && (
        <p role="alert" className="rounded-2xl bg-red-50 p-4 font-medium text-red-800 ring-1 ring-red-200">
          {error}
        </p>
      )}
      <PrimaryButton onClick={submit} disabled={busy}>
        {busy ? "Un instant…" : `Payer ${formatXaf(price)}`}
      </PrimaryButton>
      <ul className="flex flex-col gap-1.5 text-sm text-muted">
        <li>🔒 Paiement sécurisé par Tranzak, tu valides avec ton code secret.</li>
        <li>🎶 2 versions de ta chanson en 2 minutes environ, envoyées sur WhatsApp.</li>
        <li>
          ↩️ Un problème avec ta chanson ?{" "}
          <a href="/remboursement" target="_blank" className="font-semibold text-ink underline">
            On te rembourse
          </a>
          .
        </li>
        <SupportLine />
      </ul>
    </section>
  );
}

// ---------- Petits composants ----------

const inputClass =
  "w-full rounded-xl bg-white px-4 py-3 text-base ring-1 ring-sand placeholder:text-muted/60 focus:ring-2 focus:ring-brand focus:outline-none";

function Progress({ step }: { step: number }) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm font-semibold text-muted">
        <span>{STEP_TITLES[step]}</span>
        <span>
          {Math.min(step + 1, 5)}/{STEP_TITLES.length}
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-sand"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={STEP_TITLES.length}
        aria-valuenow={step + 1}
      >
        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${((step + 1) / STEP_TITLES.length) * 100}%` }} />
      </div>
    </div>
  );
}

function Step({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-5">
      <h1 className="text-3xl leading-tight font-extrabold tracking-tight">{title}</h1>
      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  optional,
  group,
  children,
}: {
  label: string;
  hint?: string;
  optional?: boolean;
  // Plusieurs boutons : un <label> ferait cliquer le premier quand on touche le texte.
  group?: boolean;
  children: ReactNode;
}) {
  const Tag = group ? "div" : "label";
  return (
    <Tag className="flex flex-col gap-1.5" {...(group && { role: "group", "aria-label": label })}>
      <span className="font-semibold">
        {label} {optional && <span className="font-normal text-muted">(facultatif)</span>}
      </span>
      {children}
      {hint && <span className="text-sm text-muted">{hint}</span>}
    </Tag>
  );
}

function Choice({
  selected,
  onClick,
  children,
  align = "center",
  compact,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  align?: "center" | "left";
  /** Petites cartes (grille de 3) : moins de marge intérieure. */
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`min-h-14 rounded-2xl ${compact ? "px-1 py-2.5" : "px-4 py-3"} font-semibold transition active:scale-[0.98] ${
        align === "left" ? "text-left" : "text-center"
      } ${selected ? "bg-brand text-white shadow-md shadow-brand/30 [&_.text-muted]:text-white/80" : "bg-white ring-1 ring-sand"}`}
    >
      {children}
    </button>
  );
}

/** Pastilles des moyens de paiement (texte coloré, pas de logos officiels). */
function PayBadges({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-1.5 text-xs font-bold ${className}`} aria-label="Moyens de paiement acceptés">
      <span className="rounded-md bg-[#ffcc00] px-2 py-1 text-ink">MTN MoMo</span>
      <span className="rounded-md bg-[#ff7900] px-2 py-1 text-white">Orange Money</span>
      <span className="rounded-md bg-ink px-2 py-1 text-white">Visa · Mastercard</span>
    </div>
  );
}

function TrustBanner({ price }: { price: number }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-2xl bg-white p-4 ring-1 ring-sand">
      <p className="font-semibold">
        ✍🏾 Tes paroles sont <span className="text-leaf">gratuites</span>.
      </p>
      <p className="-mt-1.5 text-sm text-muted">
        Tu paies seulement si elles te plaisent : {formatXaf(price)} pour 2 versions de ta chanson.
      </p>
      <PayBadges />
    </div>
  );
}

function SupportLine() {
  if (!/^\+\d{8,15}$/.test(SUPPORT_PHONE)) return null;
  return (
    <li>
      💬 Une question ?{" "}
      <a
        href={whatsappLink(SUPPORT_PHONE, "Bonjour Dédikace, j'ai une question avant de payer :")}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-leaf underline"
      >
        Écris-nous sur WhatsApp
      </a>
    </li>
  );
}

function PrimaryButton({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="h-14 rounded-2xl bg-brand px-6 text-lg font-bold text-white shadow-md shadow-brand/30 transition active:scale-[0.98] disabled:opacity-60"
    >
      {children}
    </button>
  );
}

const WRITING_MESSAGES = ["On cherche les bons mots…", "On trouve les rimes…", "On prépare le refrain…", "Presque fini…"];

function Writing({ name }: { name: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => Math.min(n + 1, WRITING_MESSAGES.length - 1)), 2500);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 py-20 text-center" role="status">
      <div className="flex gap-2" aria-hidden="true">
        {[0, 1, 2].map((d) => (
          <span key={d} className="h-4 w-4 animate-bounce rounded-full bg-brand" style={{ animationDelay: `${d * 150}ms` }} />
        ))}
      </div>
      <p className="text-2xl font-bold">On écrit la chanson de {name.trim() || "ton proche"}</p>
      <p className="text-muted">{WRITING_MESSAGES[i]} (environ 10 secondes)</p>
    </div>
  );
}
