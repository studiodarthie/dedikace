"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { formatXaf, whatsappLink } from "@/lib/format";
import {
  LANGUAGES,
  MEMORY_IDEAS,
  MEMORY_IDEAS_EN,
  OCCASIONS,
  type OccasionId,
} from "@/lib/occasions";
import { rememberOrder } from "@/lib/my-orders";
import { trackPixel } from "@/lib/pixels";
import { STYLE_TAGLINES, STYLE_TAGLINES_EN, STYLES, styleLabel, type StyleId } from "@/lib/styles";
import { localePath, type Locale } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";
import { RELATIONS, W, type WizardText } from "./wizard-text";
import { VoiceNote } from "./VoiceNote";
import { playExclusive } from "@/lib/single-audio";
import { CreateSkeleton } from "@/components/Skeletons";

// ---------- Brouillon (localStorage) ----------

const STORAGE_KEY = "dedikace:brouillon:v1";
const MAX_ANECDOTES_CHARS = 500;
const MAX_ANECDOTES = 3;
const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "";

type Form = {
  occasion: string;
  recipientName: string;
  relation: string;
  senderName: string;
  anecdotes: string[];
  styleId: string;
  songLanguage: string;
  chorusLanguage: string;
  voice: "male" | "female";
  whatsappPhone: string;
};

type Lyrics = {
  orderId: string;
  title: string;
  lyrics: string;
  rewritesLeft: number;
};

type Draft = {
  step: number;
  form: Form;
  saved?: Lyrics;
  editTitle?: string;
  editLyrics?: string;
};

// Interface en anglais : chanson et refrain en anglais par défaut.
const emptyForm = (locale: Locale): Form => ({
  occasion: "",
  recipientName: "",
  relation: "",
  senderName: "",
  anecdotes: [""],
  styleId: "",
  songLanguage: locale === "en" ? "en" : "fr",
  chorusLanguage: locale === "en" ? "en" : "fr",
  voice: "female",
  whatsappPhone: "+237 ",
});

function loadDraft(locale: Locale, defaults: Defaults = {}): Draft {
  const EMPTY_FORM = emptyForm(locale);
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const draft = JSON.parse(raw) as Draft;
      let step = draft.step === 4 && !draft.saved ? 3 : draft.step;
      const form = { ...EMPTY_FORM, ...draft.form };
      // Style retiré depuis (ex. ndombolo) et paroles pas encore créées : on refait choisir le style.
      if (form.styleId && !draft.saved && !STYLES.some((s) => s.id === form.styleId)) {
        form.styleId = "";
        step = Math.min(step, 2);
      }
      // Langue retirée depuis (ex. lingala) : on revient au français.
      const known = (id: string) => LANGUAGES.some((l) => l.id === id);
      if (!known(form.songLanguage)) form.songLanguage = "fr";
      if (!known(form.chorusLanguage)) form.chorusLanguage = form.songLanguage;
      // Arrivée depuis une page « chanson d'anniversaire »… sur un brouillon pas encore commencé.
      if (step === 0 && !form.occasion && defaults.occasion) {
        return { ...draft, step: 1, form: { ...form, occasion: defaults.occasion, styleId: form.styleId || defaults.styleId || "" } };
      }
      return { ...draft, step, form };
    }
  } catch {
    // localStorage indisponible (navigation privée) ou brouillon illisible : on repart de zéro.
  }
  const filled = Object.fromEntries(Object.entries(defaults).filter(([, v]) => v));
  return { step: defaults.occasion ? 1 : 0, form: { ...EMPTY_FORM, ...filled } };
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
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

// ---------- Validation (mêmes règles que /api/lyrics) ----------

const cleanPhone = (v: string) => v.replace(/[\s.\-()]/g, "");
const anecdotesLength = (list: string[]) =>
  list.reduce((n, a) => n + a.trim().length, 0);

function stepError(step: number, f: Form, t: WizardText): string | null {
  if (step === 0 && !f.occasion) return t.errOccasion;
  if (step === 1) {
    if (!f.recipientName.trim()) return t.errName;
    if (!f.anecdotes.some((a) => a.trim())) return t.errMemory;
    if (anecdotesLength(f.anecdotes) > MAX_ANECDOTES_CHARS) return t.errTooLong;
  }
  if (step === 2 && !f.styleId) return t.errStyle;
  if (step === 3 && !/^\+[1-9]\d{7,14}$/.test(cleanPhone(f.whatsappPhone))) return t.errPhone;
  return null;
}

// ---------- Composant principal ----------

type Prices = { priceMomo: number; priceCard: number; /** Offre de lancement en cours : date de fin affichée. */ launchEnds?: string | null };

/**
 * Prérempli pour une nouvelle chanson : profil du client connecté, et occasion ou style
 * venus d'une page de présentation (/chanson/anniversaire, /style/makossa…).
 */
type Defaults = { senderName?: string; whatsappPhone?: string; occasion?: string; styleId?: string };

export function CreateWizard({ defaults, ...prices }: Prices & { defaults?: Defaults }) {
  const isClient = useIsClient();
  const locale = useLocale();
  if (!isClient) {
    return (
      <CreateSkeleton />
    );
  }
  return <Wizard initial={loadDraft(locale, defaults)} {...prices} />;
}

function Wizard({
  initial,
  priceMomo,
  priceCard,
  launchEnds,
}: { initial: Draft } & Prices) {
  const locale = useLocale();
  const t = W[locale];
  const en = locale === "en";
  const [step, setStep] = useState(initial.step);
  const [form, setForm] = useState<Form>(initial.form);
  const [saved, setSaved] = useState<Lyrics | undefined>(initial.saved);
  const [title, setTitle] = useState(
    initial.editTitle ?? initial.saved?.title ?? "",
  );
  const [lyrics, setLyrics] = useState(
    initial.editLyrics ?? initial.saved?.lyrics ?? "",
  );
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
    if (empty >= 0)
      return update(
        "anecdotes",
        list.map((a, i) => (i === empty ? idea : a)),
      );
    if (list.length < MAX_ANECDOTES)
      return update("anecdotes", [...list, idea]);
    setError(t.errMaxMemories);
  };

  // Texte d'un vocal : première case vide, sinon nouvelle case, sinon à la suite de la dernière.
  const addVoiceText = (text: string) => {
    const list = form.anecdotes;
    const room = MAX_ANECDOTES_CHARS - anecdotesLength(list);
    if (room <= 0)
      return setError(t.errVoiceFull);
    const clip = text.slice(0, room);
    const empty = list.findIndex((a) => !a.trim());
    if (empty >= 0)
      return update(
        "anecdotes",
        list.map((a, i) => (i === empty ? clip : a)),
      );
    if (list.length < MAX_ANECDOTES)
      return update("anecdotes", [...list, clip]);
    update(
      "anecdotes",
      list.map((a, i) =>
        i === list.length - 1
          ? `${a.trim()} ${clip}`.slice(0, MAX_ANECDOTES_CHARS)
          : a,
      ),
    );
  };

  const goTo = (next: number) => {
    setError(null);
    setNotice(null);
    setCheckout(false);
    setStep(next);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const next = () => {
    const err = stepError(step, form, t);
    if (err) return setError(err);
    if (step === 3) return void createLyrics();
    goTo(step + 1);
  };

  async function callLyrics(
    body: Record<string, unknown>,
  ): Promise<Lyrics | null> {
    try {
      const res = await fetch("/api/lyrics", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...body, locale }),
      });
      // Limite anti-abus du pare-feu Vercel (réponse sans JSON).
      if (res.status === 429) {
        setError(t.errTooMany);
        return null;
      }
      const data = (await res.json()) as Partial<Lyrics> & { error?: string };
      if (!res.ok) {
        setError(data.error ?? t.errGeneric);
        return null;
      }
      return data as Lyrics;
    } catch {
      setError(t.errOffline);
      return null;
    }
  }

  function applyLyrics(result: Lyrics) {
    rememberOrder(result.orderId);
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
    if (
      dirty &&
      !window.confirm(t.confirmRewrite)
    )
      return;
    setBusy("rewrite");
    setError(null);
    setNotice(null);
    const result = await callLyrics({
      action: "rewrite",
      orderId: saved.orderId,
    });
    setBusy(null);
    if (result) applyLyrics(result);
  }

  async function saveEdits(): Promise<boolean> {
    if (!saved || !dirty) return true;
    if (!title.trim() || !lyrics.trim()) {
      setError(t.errEmpty);
      return false;
    }
    setBusy("save");
    setError(null);
    const result = await callLyrics({
      action: "edit",
      orderId: saved.orderId,
      title,
      lyrics,
    });
    setBusy(null);
    if (result) applyLyrics(result);
    return !!result;
  }

  async function openCheckout() {
    if (!(await saveEdits())) return;
    setCheckout(true);
    requestAnimationFrame(() =>
      checkoutRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      }),
    );
  }

  function restart() {
    if (!window.confirm(t.confirmRestart)) return;
    clearDraft();
    setForm(emptyForm(locale));
    setSaved(undefined);
    setTitle("");
    setLyrics("");
    goTo(0);
  }

  if (busy === "create") return <Writing name={form.recipientName} t={t} />;

  return (
    <div ref={topRef} className="flex scroll-mt-4 flex-col gap-6 pt-2">
      <Progress step={step} titles={t.steps} />

      {step === 0 && (
        <Step title={t.titleOccasion}>
          <TrustBanner price={priceMomo} priceCard={priceCard} launchEnds={launchEnds} t={t} locale={locale} />
          <div className="grid grid-cols-2 gap-3">
            {OCCASIONS.map((o) => (
              <Choice
                key={o.id}
                selected={form.occasion === o.id}
                onClick={() => update("occasion", o.id)}
              >
                <span className="block text-3xl" aria-hidden="true">
                  {o.emoji}
                </span>
                <span className="mt-1 block leading-tight">{en ? o.labelEn : o.label}</span>
              </Choice>
            ))}
          </div>
        </Step>
      )}

      {step === 1 && (
        <Step title={t.titleWho}>
          <Field group label={t.forWho} optionalText={t.optional}>
            <div className="grid grid-cols-3 gap-2">
              {RELATIONS[locale].map((r) => (
                <Choice
                  key={r.value}
                  selected={form.relation === r.value}
                  onClick={() => update("relation", r.value)}
                  compact
                >
                  <span className="block text-2xl" aria-hidden="true">
                    {r.emoji}
                  </span>
                  <span className="block text-sm leading-tight">{r.label}</span>
                </Choice>
              ))}
            </div>
            <input
              className={`${inputClass} mt-1`}
              value={
                RELATIONS[locale].some((r) => r.value === form.relation)
                  ? ""
                  : form.relation
              }
              onChange={(e) => update("relation", e.target.value)}
              maxLength={40}
              aria-label={t.otherRelation}
              placeholder={t.otherRelationPlaceholder}
            />
          </Field>
          <Field label={t.nameLabel} hint={t.nameHint} optionalText={t.optional}>
            <input
              className={inputClass}
              value={form.recipientName}
              onChange={(e) => update("recipientName", e.target.value)}
              maxLength={40}
              autoComplete="off"
              placeholder={t.namePlaceholder}
            />
          </Field>
          <Field
            group
            label={t.uniqueLabel}
            hint={t.uniqueHint(anecdotesLength(form.anecdotes), MAX_ANECDOTES_CHARS)}
            optionalText={t.optional}
          >
            <VoiceNote onText={addVoiceText} />
            {form.occasion && (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-muted">
                  {t.ideasIntro}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(en ? MEMORY_IDEAS_EN : MEMORY_IDEAS)[form.occasion as OccasionId]?.map((idea) => {
                    const picked = form.anecdotes.some(
                      (a) => a.trim() === idea,
                    );
                    return (
                      <button
                        key={idea}
                        type="button"
                        aria-pressed={picked}
                        onClick={() => toggleIdea(idea)}
                        className={`rounded-full px-3 py-2 text-left text-sm font-medium transition active:scale-95 ${
                          picked
                            ? "bg-brand text-white"
                            : "bg-white ring-1 ring-sand"
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
                    onChange={(e) =>
                      update(
                        "anecdotes",
                        form.anecdotes.map((x, j) =>
                          j === i ? e.target.value : x,
                        ),
                      )
                    }
                    aria-label={t.memory(i + 1)}
                    placeholder={i === 0 ? t.memoryPlaceholder : t.memoryPlaceholderMore}
                    maxLength={MAX_ANECDOTES_CHARS}
                  />
                  {form.anecdotes.length > 1 && (
                    <button
                      type="button"
                      aria-label={t.removeMemory}
                      onClick={() =>
                        update(
                          "anecdotes",
                          form.anecdotes.filter((_, j) => j !== i),
                        )
                      }
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
                  {t.addMemory}
                </button>
              )}
            </div>
          </Field>
          <Field label={t.senderLabel} optional optionalText={t.optional} hint={t.senderHint}>
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
        <Step title={t.titleMusic}>
          <Field group label={t.songLanguage} optionalText={t.optional}>
            <div className="grid grid-cols-3 gap-2">
              {LANGUAGES.map((l) => (
                <Choice
                  key={l.id}
                  selected={form.songLanguage === l.id}
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      songLanguage: l.id,
                      chorusLanguage: l.id,
                    }))
                  }
                >
                  {en ? l.labelEn : l.label}
                </Choice>
              ))}
            </div>
          </Field>
          <Field group label={t.chorusLanguage} hint={t.chorusHint} optionalText={t.optional}>
            <div className="grid grid-cols-3 gap-2">
              {LANGUAGES.map((l) => (
                <Choice
                  key={l.id}
                  selected={form.chorusLanguage === l.id}
                  onClick={() => update("chorusLanguage", l.id)}
                >
                  {en ? l.labelEn : l.label}
                  {l.id === form.songLanguage && (
                    <span className="block text-xs font-normal opacity-80">
                      {t.same}
                    </span>
                  )}
                </Choice>
              ))}
            </div>
          </Field>
          <Field group label={t.style} hint={t.styleHint} optionalText={t.optional}>
            <StylePicker
              t={t}
              locale={locale}
              value={form.styleId}
              onChange={(id) => update("styleId", id)}
            />
          </Field>
          <Field group label={t.voice} optionalText={t.optional}>
            <div className="grid grid-cols-2 gap-2">
              <Choice
                selected={form.voice === "female"}
                onClick={() => update("voice", "female")}
              >
                {t.female}
              </Choice>
              <Choice
                selected={form.voice === "male"}
                onClick={() => update("voice", "male")}
              >
                {t.male}
              </Choice>
            </div>
          </Field>
        </Step>
      )}

      {step === 3 && (
        <Step title={t.titleContact}>
          <Field label={t.phoneLabel} hint={t.phoneHint} optionalText={t.optional}>
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
            {t.freeNote[0]}
            <strong className="text-ink">{t.freeNote[1]}</strong>
            {t.freeNote[2]}
          </p>
        </Step>
      )}

      {step === 4 && saved && (
        <Step title={t.titleLyrics}>
          <p className="-mt-2 text-muted">{t.lyricsIntro}</p>
          <Field label={t.lyricsTitle} optionalText={t.optional}>
            <input
              className={inputClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
            />
          </Field>
          <Field label={t.lyricsLabel} optionalText={t.optional}>
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
              {busy === "rewrite" ? t.rewriting : t.rewrite(saved.rewritesLeft)}
            </button>
            <button
              type="button"
              onClick={() => void saveEdits()}
              disabled={!!busy || !dirty}
              className="h-12 rounded-2xl bg-white font-semibold ring-1 ring-sand disabled:opacity-50"
            >
              {busy === "save" ? t.saving : dirty ? t.save : t.saved}
            </button>
          </div>
        </Step>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-2xl bg-red-50 p-4 font-medium text-red-800 ring-1 ring-red-200"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="rounded-2xl bg-green-50 p-4 font-medium text-leaf ring-1 ring-green-200"
        >
          {notice}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {step < 4 ? (
          <PrimaryButton onClick={next}>
            {step === 3 ? t.writeLyrics : t.next}
          </PrimaryButton>
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
              {t.createFor(formatXaf(priceMomo, locale))}
            </PrimaryButton>
            <PayBadges className="justify-center" label={t.payBadges} />
          </>
        )}
        <div className="flex items-center justify-between">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => goTo(step - 1)}
              className="px-2 py-2 font-semibold text-muted"
            >
              ← {step === 4 ? t.editInfo : t.back}
            </button>
          ) : (
            <span />
          )}
          {(step > 0 || form.occasion) && (
            <button
              type="button"
              onClick={restart}
              className="px-2 py-2 text-sm text-muted underline"
            >
              {t.restart}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Paiement (Tranzak) ----------

type PayChannel = "mtn" | "orange" | "card";

const CHANNEL_IDS: PayChannel[] = ["mtn", "orange", "card"];

/** Bloc de paiement, réutilisé sur /commande/[id] pour finaliser une commande depuis « Mon espace ». */
export function Checkout({
  orderId,
  whatsappPhone,
  priceMomo,
  priceCard,
}: { orderId: string; whatsappPhone: string } & Prices) {
  const locale = useLocale();
  const t = W[locale];
  const [channel, setChannel] = useState<PayChannel>("mtn");
  // Le numéro WhatsApp camerounais sert souvent aussi pour le Mobile Money.
  const [phone, setPhone] = useState(
    whatsappPhone.startsWith("+237") ? whatsappPhone.slice(4) : "",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const price = channel === "card" ? priceCard : priceMomo;
  const label = t.channels[channel].label;

  async function submit() {
    const local = phone.replace(/[\s.\-()]/g, "").replace(/^(\+|00)?237/, "");
    if (channel !== "card" && !/^6\d{8}$/.test(local)) {
      return setError(t.errMomo);
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/pay", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          channel === "card"
            ? { orderId, channel, locale }
            : { orderId, channel, phone: local, locale },
        ),
      });
      const data = (await res.json()) as {
        redirectUrl?: string;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? t.errPayStart);
        setBusy(false);
        return;
      }
      window.location.assign(data.redirectUrl ?? localePath(locale, `/commande/${orderId}`));
    } catch {
      setError(t.errOffline);
      setBusy(false);
    }
  }

  return (
    <section
      className="flex flex-col gap-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-sand"
      aria-label={t.payment}
    >
      <h2 className="text-2xl font-extrabold">{t.howPay}</h2>
      <div
        className="flex flex-col gap-2"
        role="group"
        aria-label={t.payMethod}
      >
        {CHANNEL_IDS.map((id) => ({ id, ...t.channels[id] })).map((c) => (
          <Choice
            key={c.id}
            selected={channel === c.id}
            onClick={() => setChannel(c.id)}
            align="left"
          >
            <span className="flex items-center justify-between gap-3">
              <span>
                <span className="block font-bold">{c.label}</span>
                <span className="block text-sm font-normal text-muted">
                  {c.hint}
                </span>
              </span>
              <span className="shrink-0 font-bold">
                {formatXaf(c.id === "card" ? priceCard : priceMomo, locale)}
              </span>
            </span>
          </Choice>
        ))}
      </div>
      {channel !== "card" && (
        <Field
          label={t.yourNumber(label)}
          hint={t.momoHint}
          optionalText={t.optional}
        >
          <div className="flex items-center gap-2">
            <span className="rounded-xl bg-sand px-3 py-3 font-semibold">
              +237
            </span>
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
        <p
          role="alert"
          className="rounded-2xl bg-red-50 p-4 font-medium text-red-800 ring-1 ring-red-200"
        >
          {error}
        </p>
      )}
      <PrimaryButton onClick={submit} disabled={busy}>
        {busy ? t.wait : t.pay(formatXaf(price, locale))}
      </PrimaryButton>
      <ul className="flex flex-col gap-1.5 text-sm text-muted">
        <li>{t.secure}</li>
        <li>{t.delivery}</li>
        <li>{t.redo}</li>
        <li>
          {t.refund[0]}
          <a
            href={localePath(locale, "/remboursement")}
            target="_blank"
            className="font-semibold text-ink underline"
          >
            {t.refund[1]}
          </a>
          {t.refund[2]}
        </li>
        <SupportLine t={t} />
      </ul>
    </section>
  );
}

// ---------- Petits composants ----------

/**
 * Cartes de style + bouton ▶ (extrait de 15 s, public/styles/<style>.mp3, ~90 Ko).
 * Un seul lecteur pour tous les styles, chargé seulement au toucher (3G).
 */
function StylePicker({
  value,
  onChange,
  t,
  locale,
}: {
  value: string;
  onChange: (id: StyleId) => void;
  t: WizardText;
  locale: Locale;
}) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  // On coupe le son si la personne quitte l'étape.
  useEffect(() => () => audio.current?.pause(), []);

  function toggle(id: StyleId) {
    audio.current ??= new Audio();
    const el = audio.current;
    if (playing === id) {
      el.pause();
      setPlaying(null);
      return;
    }
    el.pause();
    el.src = `/styles/${id}.mp3`;
    el.onended = () => setPlaying(null);
    // Un seul son à la fois : si un autre lecteur de la page démarre, ce bouton revient sur ▶.
    el.onplay = () =>
      playExclusive(el, () => {
        setPlaying(null);
        setLoading(null);
      });
    el.onplaying = () => setLoading(null);
    setLoading(id);
    setPlaying(id);
    onChange(id);
    el.play().catch(() => {
      setPlaying(null);
      setLoading(null);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {STYLES.map((s) => (
        <div key={s.id} className="flex items-stretch gap-2">
          <div className="flex min-w-0 flex-1 [&>button]:w-full">
            <Choice selected={value === s.id} onClick={() => onChange(s.id)} align="left">
              <span className="block font-bold">{styleLabel(s.id, locale)}</span>
              <span className="block text-sm font-normal text-muted">
                {(locale === "en" ? STYLE_TAGLINES_EN : STYLE_TAGLINES)[s.id]}
              </span>
            </Choice>
          </div>
          <button
            type="button"
            onClick={() => toggle(s.id)}
            aria-label={playing === s.id ? t.stopSample(styleLabel(s.id, locale)) : t.playSample(styleLabel(s.id, locale))}
            className={`flex w-14 shrink-0 items-center justify-center rounded-2xl transition active:scale-95 ${
              playing === s.id ? "bg-ink text-white" : "bg-white text-brand ring-1 ring-sand"
            }`}
          >
            {loading === s.id ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
            ) : playing === s.id ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="ml-0.5 h-5 w-5 fill-current" aria-hidden="true">
                <path d="M7 4.5v15l12-7.5z" />
              </svg>
            )}
          </button>
        </div>
      ))}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl bg-white px-4 py-3 text-base ring-1 ring-sand placeholder:text-muted/60 focus:ring-2 focus:ring-brand focus:outline-none";

function Progress({ step, titles }: { step: number; titles: string[] }) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm font-semibold text-muted">
        <span>{titles[step]}</span>
        <span>
          {Math.min(step + 1, 5)}/{titles.length}
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-sand"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={titles.length}
        aria-valuenow={step + 1}
      >
        <div
          className="h-full rounded-full bg-brand transition-all"
          style={{ width: `${((step + 1) / titles.length) * 100}%` }}
        />
      </div>
    </div>
  );
}

function Step({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-5">
      <h1 className="text-3xl leading-tight font-extrabold tracking-tight">
        {title}
      </h1>
      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  optional,
  optionalText,
  group,
  children,
}: {
  label: string;
  hint?: string;
  optional?: boolean;
  optionalText: string;
  // Plusieurs boutons : un <label> ferait cliquer le premier quand on touche le texte.
  group?: boolean;
  children: ReactNode;
}) {
  const Tag = group ? "div" : "label";
  return (
    <Tag
      className="flex flex-col gap-1.5"
      {...(group && { role: "group", "aria-label": label })}
    >
      <span className="font-semibold">
        {label}{" "}
        {optional && (
          <span className="font-normal text-muted">{optionalText}</span>
        )}
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
      className={`min-h-14 min-w-0 rounded-2xl break-words hyphens-auto ${compact ? "px-1 py-2.5" : align === "left" ? "px-4 py-3" : "px-2 py-3 sm:px-4"} font-semibold transition active:scale-[0.98] ${
        align === "left" ? "text-left" : "text-center"
      } ${selected ? "bg-brand text-white shadow-md shadow-brand/30 [&_.text-muted]:text-white/80" : "bg-white ring-1 ring-sand"}`}
    >
      {children}
    </button>
  );
}

/** Pastilles des moyens de paiement (texte coloré, pas de logos officiels). */
function PayBadges({ className = "", label }: { className?: string; label: string }) {
  return (
    <div
      className={`flex flex-wrap items-center gap-1.5 text-xs font-bold ${className}`}
      aria-label={label}
    >
      <span className="rounded-md bg-[#ffcc00] px-2 py-1 text-ink">
        MTN MoMo
      </span>
      <span className="rounded-md bg-[#ff7900] px-2 py-1 text-white">
        Orange Money
      </span>
      <span className="rounded-md bg-ink px-2 py-1 text-white">
        Visa · Mastercard
      </span>
    </div>
  );
}

function TrustBanner({
  price,
  priceCard,
  launchEnds,
  t,
  locale,
}: {
  price: number;
  priceCard: number;
  launchEnds?: string | null;
  t: WizardText;
  locale: Locale;
}) {
  return (
    <div className="flex flex-col gap-2.5 rounded-2xl bg-white p-4 ring-1 ring-sand">
      <p className="font-semibold">
        {t.trustFree[0]}
        <span className="text-leaf">{t.trustFree[1]}</span>
        {t.trustFree[2]}
      </p>
      <p className="-mt-1.5 text-sm text-muted">
        {t.trustPay(formatXaf(price, locale), priceCard !== price ? formatXaf(priceCard, locale) : null)}
      </p>
      {launchEnds && (
        <p className="-mt-1 w-fit rounded-full bg-gold/25 px-3 py-1 text-sm font-bold text-brand-dark">{t.launch(launchEnds)}</p>
      )}
      <p className="-mt-1.5 text-sm text-muted">{t.trustRedo}</p>
      <PayBadges label={t.payBadges} />
    </div>
  );
}

function SupportLine({ t }: { t: WizardText }) {
  if (!/^\+\d{8,15}$/.test(SUPPORT_PHONE)) return null;
  return (
    <li>
      {t.question}
      <a
        href={whatsappLink(SUPPORT_PHONE, t.questionMessage)}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-leaf underline"
      >
        {t.writeUs}
      </a>
    </li>
  );
}

function PrimaryButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
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

function Writing({ name, t }: { name: string; t: WizardText }) {
  const [i, setI] = useState(0);
  const count = t.writing.length;
  useEffect(() => {
    const id = setInterval(() => setI((n) => Math.min(n + 1, count - 1)), 2500);
    return () => clearInterval(id);
  }, [count]);
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-6 py-20 text-center"
      role="status"
    >
      <div className="flex gap-2" aria-hidden="true">
        {[0, 1, 2].map((d) => (
          <span
            key={d}
            className="h-4 w-4 animate-bounce rounded-full bg-brand"
            style={{ animationDelay: `${d * 150}ms` }}
          />
        ))}
      </div>
      <p className="text-2xl font-bold">
        {t.writingTitle(name.trim())}
      </p>
      <p className="text-muted">
        {t.writing[i]} {t.writingTime}
      </p>
    </div>
  );
}
