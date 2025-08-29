import React, { useMemo, useState, useEffect } from "react";

/**
 * AWON — Panel Administratora Globalnego (Owner) — Vite + React Router + Tailwind
 * Integracje z landingiem:
 *  - Zapis funkcji do window/localStorage pod kluczem AWON_FEATURES (landing je czyta i rysuje ✓/✕).
 *    Reguła mapowania: jeśli funkcja jest oznaczona jako "Płatna", to FREE=false, PREMIUM=true.
 *    Jeśli "Bezpłatna" → FREE=true, PREMIUM=true.
 *    Rozpoznawane nazwy (po uproszczeniu/slug): calendar/kalendarz, tasks/zadania, crm,
 *    multiproperty/wielo_obiekt, email/powiadomienia, booking/airbnb/sync, api/webhooks.
 *
 *  - Wgrywanie screenów do galerii landingu: AWON_GALLERY_IMAGES (DataURL), event 'AWON_GALLERY_UPDATED'.
 */

declare global {
  interface Window {
    AWON_FEATURES?: any;
    AWON_GALLERY_IMAGES?: string[];
  }
}

// --- sample data ---
const sampleOverview = { objects: 18, users: 143, trialsExpiring7d: 3, incidentsOpen: 0 };

const sampleObjects = [
  { id: "obj_1", name: "Apartamenty Słoneczna", plan: "Premium", status: "Active", ownerEmail: "slawomir@przyklad.pl", trialEndsAt: "2025-09-10", subEndsAt: "2025-12-10" },
  { id: "obj_2", name: "Carpe Diem — Tarnów Jezierny", plan: "Trial", status: "Trial", ownerEmail: "joanna@przyklad.pl", trialEndsAt: "2025-09-01", subEndsAt: null },
  { id: "obj_3", name: "Baltic Rooms Sp. z o.o.", plan: "Basic", status: "Locked", ownerEmail: "kontakt@balticrooms.pl", trialEndsAt: null, subEndsAt: "2026-01-31" }
];

const sampleUsers = [
  { id: "usr_1", name: "Sławomir Piórkowski", email: "slawomir@przyklad.pl", objects: ["Apartamenty Słoneczna"], role: "OWNER", lastLogin: "2025-08-24 21:10", mfa: true, status: "Active" },
  { id: "usr_2", name: "Joanna Sobczak", email: "joanna@przyklad.pl", objects: ["Carpe Diem — Tarnów Jezierny"], role: "OWNER", lastLogin: "2025-08-23 09:44", mfa: false, status: "Active" },
  { id: "usr_3", name: "Jan Kowalski", email: "jan.kowalski@balticrooms.pl", objects: ["Baltic Rooms Sp. z o.o."], role: "MANAGER", lastLogin: "2025-08-22 16:02", mfa: true, status: "Suspended" }
];

const sampleAudit = [
  { id: 1, ts: "2025-08-24T22:10:00Z", actor: "owner", action: "CHANGE_PLAN", target: "obj_1", meta: "Basic -> Premium" },
  { id: 2, ts: "2025-08-23T14:02:00Z", actor: "owner", action: "RESET_PASSWORD", target: "usr_3", meta: "Admin-forced reset" },
  { id: 3, ts: "2025-08-22T09:31:00Z", actor: "owner", action: "LOCK_OBJECT", target: "obj_3", meta: "Unpaid invoices" }
];

// --- helpers & utils ---
let _nextId = 1000;
function genId(prefix = "id") { _nextId += 1; return `${prefix}_${_nextId}`; }
const nowISO = () => new Date().toISOString();
function parseDate(d?: string | null) { if (!d) return null; const t = new Date(d); return Number.isNaN(t.getTime()) ? null : t; }
function isTrialExpiringOrExpired(dateStr?: string | null, windowDays = 7) {
  const d = parseDate(dateStr);
  if (!d) return false;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const cutoff = new Date(today); cutoff.setDate(cutoff.getDate() + windowDays);
  return d <= cutoff;
}
function slugify(s: string) {
  return (s || "")
    .toLowerCase()
    .replace(/ą/g, "a").replace(/ć/g, "c").replace(/ę/g, "e").replace(/ł/g, "l").replace(/ń/g, "n").replace(/ó/g, "o").replace(/ś/g, "s").replace(/ż|ź/g, "z")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

// --- UI primitives ---
function KpiCard({ label, value, foot }: { label: string; value: React.ReactNode; foot?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-white/0 p-5 shadow">
      <div className="text-sm text-slate-300">{label}</div>
      <div className="mt-2 text-3xl font-bold text-white">{value}</div>
      {foot && <div className="mt-2 text-xs text-slate-400">{foot}</div>}
    </div>
  );
}

function Section({ title, subtitle, children, right }: { title: string; subtitle?: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-lg">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

function Badge({ children, tone = "slate" }: { children: React.ReactNode; tone?: "green" | "yellow" | "red" | "slate" | "blue" | "violet" }) {
  const map: Record<string, string> = {
    green: "bg-green-400/15 text-green-300 border-green-400/30",
    yellow: "bg-yellow-400/15 text-yellow-200 border-yellow-400/30",
    red: "bg-red-400/15 text-red-300 border-red-400/30",
    slate: "bg-slate-400/15 text-slate-200 border-slate-400/30",
    blue: "bg-blue-400/15 text-blue-200 border-blue-400/30",
    violet: "bg-violet-400/15 text-violet-200 border-violet-400/30"
  };
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${map[tone]}`}>{children}</span>;
}

function LabelWithHelp({ label, help }: { label: string; help: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-xs text-slate-300">{label}</div>
      <div className="relative inline-block group" tabIndex={0} aria-label={`${label} — pomoc`}>
        <div className="h-5 w-5 select-none rounded-full bg-white/6 text-center text-xs leading-5 text-slate-200">i</div>
        <div className="pointer-events-none absolute left-1/2 bottom-full mb-2 invisible -translate-x-1/2 w-64 transform rounded-md bg-slate-800 p-2 text-xs text-slate-200 shadow transition-opacity group-hover:visible group-hover:opacity-100 group-focus:visible group-focus:opacity-100">
          {help}
        </div>
      </div>
    </div>
  );
}

function Toasts({ toasts, remove }: { toasts: any[]; remove: (id: string) => void }) {
  return (
    <div className="fixed right-4 top-6 z-50 space-y-2">
      {toasts.map((t) => (
        <div key={t.id} className={`rounded-md px-3 py-2 text-sm shadow-lg ${t.type === "error" ? "bg-red-600 text-white" : "bg-emerald-600 text-white"}`}>
          <div className="flex items-center justify-between gap-4">
            <div>{t.msg}</div>
            <button className="ml-3 text-xs opacity-80" onClick={() => remove(t.id)}>✕</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Simple confirm / reason box ---
function ConfirmBox({ text, onConfirm, onCancel, confirmLabel = "OK", tone = "slate", showReason = false }:
  { text: string; onConfirm: (reason?: string) => void; onCancel: () => void; confirmLabel?: string; tone?: "slate" | "red" | "blue" | "yellow" | "green"; showReason?: boolean; }) {
  const [reason, setReason] = useState("");
  const toneMap: Record<string, string> = {
    slate: "border-white/10 bg-white/5 hover:bg-white/10 text-white",
    red: "border-red-500/30 bg-red-500/20 hover:bg-red-500/25 text-red-100",
    blue: "border-sky-500/30 bg-sky-500/20 hover:bg-sky-500/25 text-sky-100",
    yellow: "border-yellow-500/30 bg-yellow-500/20 hover:bg-yellow-500/25 text-yellow-100",
    green: "border-green-500/30 bg-green-500/20 hover:bg-green-500/25 text-green-100"
  };
  return (
    <div>
      <p className="text-slate-200">{text}</p>
      {showReason && (
        <div className="mt-3">
          <div className="text-xs text-slate-300 mb-1">Powód (opcjonalnie):</div>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white text-sm" rows={3} />
        </div>
      )}
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onCancel} className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10">Anuluj</button>
        <button onClick={() => onConfirm(reason)} className={`rounded-xl px-3 py-1.5 text-sm ${toneMap[tone]}`}>{confirmLabel}</button>
      </div>
    </div>
  );
}

// --- Forms / managers ---
function ChangePlanForm({ obj, onClose, onSave, paymentInstruction = "", paymentVisible = false }:
  { obj: any; onClose: () => void; onSave: (p: any) => void; paymentInstruction?: string; paymentVisible?: boolean; }) {
  const [plan, setPlan] = useState(obj?.plan || "Basic");
  const [trialEndsAt, setTrialEndsAt] = useState(obj?.trialEndsAt || "");
  const [subEndsAt, setSubEndsAt] = useState(obj?.subEndsAt || "");
  const [extendDays, setExtendDays] = useState<number | string>(0);

  function addDaysTo(dateStr: string, days: number | string) {
    const base = dateStr ? new Date(dateStr) : new Date();
    const d = new Date(base);
    d.setDate(d.getDate() + Number(days));
    return d.toISOString().slice(0, 10);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    let newSub = subEndsAt;
    if (extendDays && Number(extendDays) > 0) newSub = addDaysTo(subEndsAt, extendDays);
    onSave({ id: obj.id, plan, trialEndsAt, subEndsAt: newSub });
    onClose();
  }

  function copyInstruction() {
    const txt = paymentInstruction || "";
    if (!txt) { alert("Brak instrukcji do skopiowania."); return; }
    navigator.clipboard?.writeText(txt).then(() => alert("Instrukcja skopiowana do schowka")).catch(() => alert("Kopiowanie nieudane"));
  }

  return (
    <form className="space-y-3" onSubmit={submit}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <label className="text-sm">
          <div className="mb-1 text-slate-300">Plan</div>
          <select value={plan} onChange={(e) => setPlan(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50">
            <option value="Trial">Trial</option>
            <option value="Basic">Basic</option>
            <option value="Premium">Premium</option>
          </select>
        </label>
        <label className="text-sm">
          <div className="mb-1 text-slate-300">Trial do</div>
          <input type="date" value={trialEndsAt || ""} onChange={(e) => setTrialEndsAt(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white" />
        </label>
        <label className="text-sm">
          <div className="mb-1 text-slate-300">Subskrypcja do</div>
          <input type="date" value={subEndsAt || ""} onChange={(e) => setSubEndsAt(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white" />
        </label>
        <label className="text-sm">
          <div className="mb-1 text-slate-300">Przedłuż o (dni)</div>
          <input type="number" value={extendDays} onChange={(e) => setExtendDays(e.target.value)} min={0} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white" />
        </label>
      </div>

      {paymentVisible && (
        <div>
          <div className="text-xs text-slate-400 mb-2">Instrukcja płatności widoczna klientowi — edytuj w Ustawieniach płatności.</div>
          <div className="rounded-md border border-white/10 bg-white/5 p-3 text-sm text-slate-200">
            <div className="whitespace-pre-wrap">{paymentInstruction || "Brak instrukcji płatności. Uzupełnij ustawienia płatności, aby klient otrzymał instrukcję."}</div>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={copyInstruction} className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm">Kopiuj instrukcję</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center gap-2 pt-2">
        <div className="text-xs text-slate-400">Możesz ręcznie przedłużyć subskrypcję płatną. Zmiany będą zapisane po kliknięciu Zapisz.</div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm">Anuluj</button>
          <button type="submit" className="rounded-xl border border-emerald-500/30 bg-emerald-500/20 px-3 py-1.5 text-sm font-semibold text-emerald-100">Zapisz</button>
        </div>
      </div>
    </form>
  );
}

function EditUserForm({ user, onClose, onSave, onSetPassword }:
  { user: any; onClose: () => void; onSave: (u: any) => void; onSetPassword: (userId: string, password: string) => void; }) {
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [role, setRole] = useState(user?.role || "USER");
  const [mfa, setMfa] = useState(!!user?.mfa);
  const [status, setStatus] = useState(user?.status || "Active");
  const [objectsStr, setObjectsStr] = useState((user?.objects || []).join(", "));
  const [password, setPassword] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const updated = { id: user.id, name: name.trim(), email: email.trim(), role, mfa, status, objects: objectsStr.split(",").map((s) => s.trim()).filter(Boolean) };
    onSave(updated);
    if (password.trim()) onSetPassword(user.id, password.trim());
    onClose();
  }

  return (
    <form onSubmit={submit} className="space-y-3 text-sm">
      <div>
        <label className="text-xs text-slate-300">Imię i nazwisko</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white text-sm" />
      </div>
      <div>
        <label className="text-xs text-slate-300">Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white text-sm" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <div className="flex items-center justify-between">
            <LabelWithHelp label="Rola" help={"Rola określa uprawnienia użytkownika: OWNER — pełne uprawnienia, MANAGER — operacyjne, USER — podstawowe."} />
          </div>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white text-sm">
            <option value="OWNER">OWNER</option>
            <option value="MANAGER">MANAGER</option>
            <option value="USER">USER</option>
          </select>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <LabelWithHelp label="MFA" help={"Uwierzytelnianie wieloskładnikowe."} />
          </div>
          <select value={mfa ? "yes" : "no"} onChange={(e) => setMfa(e.target.value === "yes")} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white text-sm">
            <option value="yes">Włączone</option>
            <option value="no">Wyłączone</option>
          </select>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <LabelWithHelp label="Status" help={"Active — aktywne; Suspended — zawieszone."} />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white text-sm">
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-300">Obiekty (oddzielone przecinkiem)</label>
        <input value={objectsStr} onChange={(e) => setObjectsStr(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white text-sm" />
      </div>
      <div>
        <label className="text-xs text-slate-300">Ustaw (nowe) hasło globalne — wpisz tylko jeśli chcesz zmienić</label>
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Nowe hasło" className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white text-sm" />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm">Anuluj</button>
        <button type="submit" className="rounded-xl border border-emerald-500/30 bg-emerald-500/20 px-3 py-1.5 text-sm font-semibold text-emerald-100">Zapisz</button>
      </div>
    </form>
  );
}

function FeatureEditor({ feature, onSave, onCancel }: { feature: any; onSave: (l: string, d: string, p: boolean) => void; onCancel: () => void; }) {
  const [label, setLabel] = useState(feature.label || "");
  const [desc, setDesc] = useState(feature.desc || "");
  const [paid, setPaid] = useState(!!feature.paid);
  return (
    <div className="space-y-2">
      <input value={label} onChange={(e) => setLabel(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white text-sm" />
      <input value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white text-sm" />
      <label className="inline-flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} /> Płatna</label>
      <div className="flex gap-2">
        <button onClick={() => onSave(label.trim() || feature.label, desc.trim(), paid)} className="rounded-xl border border-emerald-500/30 bg-emerald-500/20 px-2 py-1 text-xs text-emerald-100">Zapisz</button>
        <button onClick={onCancel} className="rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-xs">Anuluj</button>
      </div>
    </div>
  );
}

function FeatureManager({ obj = null, config = { features: [], perObject: {} }, onSave = () => {}, onClose = () => {} }:
  { obj?: any; config?: any; onSave?: (cfg: any) => void; onClose?: () => void; }) {
  const initial = { features: Array.isArray(config.features) ? config.features : [], perObject: config.perObject || {} };
  const [local, setLocal] = useState<any>(() => ({ ...initial }));
  useEffect(() => setLocal({ ...initial }), [config]);

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPaid, setNewPaid] = useState(false);

  function addFeature() {
    const label = newLabel.trim();
    if (!label) return alert("Podaj nazwę funkcji.");
    const key = slugify(label) || `f_${genId("f")}`;
    if ((local.features || []).some((f: any) => f.key === key)) return alert("Funkcja o takiej nazwie już istnieje.");
    const f = { key, label, desc: newDesc.trim(), paid: !!newPaid };
    setLocal((prev: any) => ({ ...prev, features: [...(prev.features || []), f] }));
    setNewLabel(""); setNewDesc(""); setNewPaid(false);
  }

  function saveEdit(key: string, label: string, desc: string, paid: boolean) {
    setLocal((prev: any) => ({ ...prev, features: (prev.features || []).map((f: any) => (f.key === key ? { ...f, label, desc, paid } : f)) }));
    setEditingKey(null);
  }

  function removeFeature(key: string) {
    if (!confirm("Usunąć funkcję?")) return;
    setLocal((prev: any) => ({ ...prev, features: (prev.features || []).filter((f: any) => f.key !== key) }));
  }

  function toggleGlobalPaid(key: string) {
    setLocal((prev: any) => ({ ...prev, features: (prev.features || []).map((f: any) => (f.key === key ? { ...f, paid: !f.paid } : f)) }));
  }
  function toggleObjectPaid(key: string) {
    if (!obj) return;
    setLocal((prev: any) => {
      const per = { ...(prev.perObject || {}) };
      per[obj.id] = { ...(per[obj.id] || {}) };
      per[obj.id][key] = !per[obj.id][key];
      return { ...prev, perObject: per };
    });
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-slate-200">Zarządzaj funkcjami (dodaj/edytuj/usuń, oznacz jako płatne). Zapis wpływa na stronę główną.</div>

      <div className="rounded-md border border-white/10 bg-slate-900/50 p-3">
        <div className="text-sm font-medium text-white mb-2">Dodaj nową funkcję</div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Nazwa funkcji (np. Faktury)" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white text-sm" />
          <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Krótki opis" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white text-sm" />
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={newPaid} onChange={(e) => setNewPaid(e.target.checked)} /> <span className="text-sm text-slate-300">Płatna</span></label>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <button onClick={() => { setNewLabel(""); setNewDesc(""); setNewPaid(false); }} className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm">Wyczyść</button>
          <button onClick={addFeature} className="rounded-xl border border-emerald-500/30 bg-emerald-500/20 px-3 py-1.5 text-sm font-semibold text-emerald-100">Dodaj funkcję</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {(local.features || []).map((f: any) => (
          <div key={f.key} className="flex items-start justify-between gap-3 rounded-md border border-white/5 p-3 bg-slate-900/50">
            <div className="w-3/4">
              {editingKey === f.key ? (
                <FeatureEditor feature={f} onCancel={() => setEditingKey(null)} onSave={(label, desc, paid) => saveEdit(f.key, label, desc, paid)} />
              ) : (
                <>
                  <div className="font-medium text-white flex items-center gap-2"><div>{f.label}</div>{f.paid ? <Badge tone="yellow">Płatna</Badge> : <Badge tone="green">Bezpłatna</Badge>}</div>
                  <div className="text-xs text-slate-300 mt-1">{f.desc}</div>
                  {obj && local.perObject?.[obj.id]?.[f.key] !== undefined && <div className="text-xs text-slate-400 mt-1">Nadpisanie dla obiektu: {local.perObject[obj.id][f.key] ? "Płatna" : "Bezpłatna"}</div>}
                </>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              {editingKey !== f.key && (
                <div className="flex flex-col gap-2">
                  <button onClick={() => toggleGlobalPaid(f.key)} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs">Przełącz globalnie</button>
                  {obj && (
                    <div className="flex items-center gap-2">
                      <input id={`obj-${obj.id}-${f.key}`} type="checkbox" checked={!!local.perObject?.[obj.id]?.[f.key]} onChange={() => toggleObjectPaid(f.key)} />
                      <label htmlFor={`obj-${obj.id}-${f.key}`} className="text-xs text-slate-300">Płatna dla tego obiektu</label>
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-2">
                {editingKey !== f.key ? (
                  <>
                    <button onClick={() => setEditingKey(f.key)} className="rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-xs">Edytuj</button>
                    <button onClick={() => removeFeature(f.key)} className="rounded-xl border border-red-500/30 bg-red-500/20 px-2 py-1 text-xs text-red-100">Usuń</button>
                  </>
                ) : (
                  <button onClick={() => setEditingKey(null)} className="rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-xs">Anuluj edycję</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onClose} className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm">Anuluj</button>
        <button onClick={() => onSave(local)} className="rounded-xl border border-emerald-500/30 bg-emerald-500/20 px-3 py-1.5 text-sm font-semibold text-emerald-100">Zapisz</button>
      </div>
    </div>
  );
}

function PaymentsForm({ settings, onSave, onClose }:
  { settings: any; onSave: (s: any) => void; onClose: () => void; }) {
  const [businessName, setBusinessName] = useState(settings?.businessName || "");
  const [address, setAddress] = useState(settings?.address || "");
  const [iban, setIban] = useState(settings?.iban || "");
  const [phone, setPhone] = useState(settings?.phone || "");
  const [blikPhone, setBlikPhone] = useState(settings?.blikPhone || "");
  const [confirmEmail, setConfirmEmail] = useState(settings?.confirmEmail || "");
  const [paymentInstruction, setPaymentInstruction] = useState(settings?.paymentInstruction || "");
  const [visibleToClient, setVisibleToClient] = useState(!!settings?.visibleToClient);
  const [error, setError] = useState("");

  function handleSave() {
    if (!confirmEmail.trim() || !confirmEmail.includes("@")) { setError("Wprowadź poprawny adres email potwierdzeń."); return; }
    setError("");
    onSave({ businessName: businessName.trim(), address: address.trim(), iban: iban.trim(), phone: phone.trim(), blikPhone: blikPhone.trim(), confirmEmail: confirmEmail.trim(), paymentInstruction: paymentInstruction.trim(), visibleToClient });
  }

  function copyInstruction() {
    const txt = paymentInstruction || "";
    if (!txt) { alert("Brak instrukcji do skopiowania."); return; }
    navigator.clipboard?.writeText(txt).then(() => alert("Instrukcja skopiowana do schowka")).catch(() => alert("Kopiowanie nieudane"));
  }

  const examplePlaceholder = "Przykład:\n1) Zrób przelew na rachunek: PLxx xxxx xxxx...\n2) W tytule przelewu podaj: Nazwa obiektu / miesiąc";

  return (
    <div>
      <div className="space-y-3 text-sm text-slate-200">
        <div>
          <label className="text-xs text-slate-300">Nazwa (np. nazwa firmy)</label>
          <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Nazwa firmy / odbiorcy" className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white text-sm" />
        </div>
        <div>
          <label className="text-xs text-slate-300">Adres (ulica, miasto, kod pocztowy)</label>
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="ul. Przykładowa 1, 00-000 Miasto" className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white text-sm" />
        </div>
        <div>
          <label className="text-xs text-slate-300">Numer rachunku (IBAN) — opcjonalny</label>
          <input value={iban} onChange={(e) => setIban(e.target.value)} placeholder="PLxx xxxx xxxx xxxx xxxx xxxx xxxx" className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white text-sm" />
        </div>
        <div>
          <label className="text-xs text-slate-300">Numer telefonu (kontaktowy)</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+48 600 000 000" className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white text-sm" />
        </div>
        <div>
          <label className="text-xs text-slate-300">Numer telefonu do BLIK (opcjonalnie)</label>
          <input value={blikPhone} onChange={(e) => setBlikPhone(e.target.value)} placeholder="+48 600 000 001" className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white text-sm" />
        </div>
        <div>
          <label className="text-xs text-slate-300">Adres e-mail do potwierdzeń</label>
          <input value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} placeholder="potwierdzenia@twojadomena.pl" className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white text-sm" />
        </div>
        <div>
          <label className="text-xs text-slate-300">Instrukcja płatności widoczna klientowi</label>
          <textarea value={paymentInstruction} onChange={(e) => setPaymentInstruction(e.target.value)} placeholder={examplePlaceholder} className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white text-sm" rows={5} />
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={copyInstruction} className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm">Kopiuj instrukcję</button>
            <div className="text-xs text-slate-400">Instrukcja będzie widoczna klientowi, jeśli zaznaczysz „Widoczne dla klienta”.</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input id="visibleToClient" type="checkbox" checked={visibleToClient} onChange={(e) => setVisibleToClient(e.target.checked)} />
          <label htmlFor="visibleToClient" className="text-xs text-slate-300">Widoczne dla klienta</label>
        </div>
        {error && <div className="text-xs text-red-400">{error}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm">Anuluj</button>
          <button onClick={handleSave} className="rounded-xl border border-emerald-500/30 bg-emerald-500/20 px-3 py-1.5 text-sm font-semibold text-emerald-100">Zapisz</button>
        </div>
      </div>
    </div>
  );
}

function EditObjectInline({ obj, onClose, onSave, onSetPasswordForObject, users }:
  { obj: any; onClose: () => void; onSave: (o: any) => void; onSetPasswordForObject: (objectId: string, userId: string, pass: string) => void; users: any[]; }) {
  const [name, setName] = useState(obj?.name || "");
  const [ownerEmail, setOwnerEmail] = useState(obj?.ownerEmail || "");
  const [plan, setPlan] = useState(obj?.plan || "Basic");
  const [status, setStatus] = useState(obj?.status || "Active");
  const [trialEndsAt, setTrialEndsAt] = useState(obj?.trialEndsAt || "");
  const [subEndsAt, setSubEndsAt] = useState(obj?.subEndsAt || "");

  const owners = users.filter((u) => (u.objects || []).includes(obj?.name));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSave({ id: obj.id, name: name.trim(), ownerEmail: ownerEmail.trim(), plan, status, trialEndsAt, subEndsAt });
    onClose();
  }

  function setObjPasswordForUser(userId: string, pass: string) {
    if (!pass) return; onSetPasswordForObject(obj.id, userId, pass);
  }

  return (
    <form onSubmit={submit} className="space-y-3 text-sm">
      <div>
        <label className="text-xs text-slate-300">Nazwa obiektu</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white text-sm" />
      </div>
      <div>
        <label className="text-xs text-slate-300">Email właściciela</label>
        <input value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white text-sm" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div>
          <label className="text-xs text-slate-300">Plan</label>
          <select value={plan} onChange={(e) => setPlan(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white text-sm">
            <option value="Trial">Trial</option>
            <option value="Basic">Basic</option>
            <option value="Premium">Premium</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-300">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white text-sm">
            <option value="Active">Active</option>
            <option value="Trial">Trial</option>
            <option value="Locked">Locked</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-300">Trial do</label>
          <input type="date" value={trialEndsAt || ""} onChange={(e) => setTrialEndsAt(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white text-sm" />
        </div>
        <div>
          <label className="text-xs text-slate-300">Subskrypcja do</label>
          <input type="date" value={subEndsAt || ""} onChange={(e) => setSubEndsAt(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white text-sm" />
        </div>
      </div>

      <div className="mt-4">
        <div className="text-xs text-slate-400 mb-2">Hasła użytkowników w tym obiekcie (demo)</div>
        <div className="space-y-2">
          {owners.length === 0 && <div className="text-xs text-slate-400">Brak przypisanych użytkowników.</div>}
          {owners.map((u) => (
            <div key={u.id} className="flex items-center gap-2">
              <div className="w-44 text-xs text-slate-300">{u.name}</div>
              <input
                type="password"
                placeholder="Nowe hasło dla obiektu"
                className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1 text-white text-xs"
                onKeyDown={(e) => {
                  const el = e.currentTarget as HTMLInputElement;
                  if (e.key === "Enter") { setObjPasswordForUser(u.id, el.value); el.value = ""; }
                }}
              />
              <button
                type="button"
                onClick={(e) => {
                  const el = (e.currentTarget.previousSibling as HTMLInputElement);
                  if (el && el.value) { setObjPasswordForUser(u.id, el.value); el.value = ""; }
                }}
                className="rounded-md border border-emerald-500/30 bg-emerald-500/20 px-2 py-1 text-xs text-emerald-100"
              >
                Zapisz
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm">Anuluj</button>
        <button type="submit" className="rounded-xl border border-emerald-500/30 bg-emerald-500/20 px-3 py-1.5 text-sm font-semibold text-emerald-100">Zapisz</button>
      </div>
    </form>
  );
}

// --- Landing gallery manager (upload to AWON_GALLERY_IMAGES) ---
function LandingGalleryManager({ onClose }: { onClose: () => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");

  function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setFiles(Array.from(e.target.files || []));
    setMsg("");
  }

  async function onUpload() {
    if (!files.length) { setMsg("Wybierz obrazy."); return; }
    setUploading(true);
    try {
      const read = (f: File) => new Promise<string>((res, rej) => {
        const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(f);
      });
      const urls = await Promise.all(files.map(read));
      const prev = typeof window !== "undefined" && window.localStorage ? window.localStorage.getItem("AWON_GALLERY_IMAGES") : null;
      const arr = prev ? JSON.parse(prev) : [];
      const merged = [...arr, ...urls];
      window.localStorage?.setItem("AWON_GALLERY_IMAGES", JSON.stringify(merged));
      window.AWON_GALLERY_IMAGES = merged;
      window.dispatchEvent(new Event("AWON_GALLERY_UPDATED"));
      setMsg("Zapisano screeny do landingu.");
      setFiles([]);
    } catch {
      setMsg("Błąd uploadu.");
    } finally {
      setUploading(false);
    }
  }

  function clearAll() {
    window.localStorage?.setItem("AWON_GALLERY_IMAGES", JSON.stringify([]));
    window.AWON_GALLERY_IMAGES = [];
    window.dispatchEvent(new Event("AWON_GALLERY_UPDATED"));
    setMsg("Wyczyszczono galerię landingu.");
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-slate-200">Wgraj screeny — będą rotować na stronie głównej.</div>
      <input type="file" multiple accept="image/*" onChange={onSelect} />
      <div className="flex gap-2">
        <button onClick={onUpload} disabled={uploading} className="rounded-xl border border-emerald-500/30 bg-emerald-500/20 px-3 py-1.5 text-sm font-semibold text-emerald-100">
          {uploading ? "Wgrywanie..." : "Wgraj"}
        </button>
        <button onClick={clearAll} className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm">Wyczyść galerię</button>
        <button onClick={onClose} className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm">Zamknij</button>
      </div>
      {msg && <div className="text-xs text-slate-300">{msg}</div>}
    </div>
  );
}

// --- Main component ---
export default function AdminOwnerPanel() {
  const [objectQuery, setObjectQuery] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [objects, setObjects] = useState(sampleObjects);
  const [users, setUsers] = useState(sampleUsers);
  const [audit, setAudit] = useState(sampleAudit);
  const [credentials, setCredentials] = useState<any>({});

  const [paymentSettings, setPaymentSettings] = useState({ businessName: "", address: "", iban: "", phone: "", blikPhone: "", confirmEmail: "", paymentInstruction: "", visibleToClient: true });
  const [modal, setModal] = useState<{ type: string; payload?: any } | null>(null);
  const [toasts, setToasts] = useState<any[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [notInterested, setNotInterested] = useState<Record<string, boolean>>({});

  const [featuresConfig, setFeaturesConfig] = useState<any>({ features: [], perObject: {} });
  const [currentUser, setCurrentUser] = useState(sampleUsers[0]);

  useEffect(() => {
    if (!toasts.length) return;
    const timers = toasts.map((t) => setTimeout(() => setToasts((prev) => prev.filter((p) => p.id !== t.id)), 5000));
    return () => timers.forEach(clearTimeout);
  }, [toasts]);

  function addToast(msg: string, type = "success") { const id = genId("toast"); setToasts((prev) => [{ id, msg, type }, ...prev]); }
  function removeToast(id: string) { setToasts((prev) => prev.filter((t) => t.id !== id)); }

  const filteredObjects = useMemo(() => {
    const q = objectQuery.trim().toLowerCase();
    if (!q) return objects;
    return objects.filter((o) => o.name.toLowerCase().includes(q) || o.ownerEmail.toLowerCase().includes(q) || (o.plan || "").toLowerCase().includes(q));
  }, [objectQuery, objects]);

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.objects.join(", ").toLowerCase().includes(q));
  }, [userQuery, users]);

  function openModal(type: string, payload?: any) { setModal({ type, payload }); }
  function closeModal() { setModal(null); }

  // Mock API actions
  function apiLockObject(obj: any, reason?: string) {
    setObjects((prev) => prev.map((o) => (o.id === obj.id ? { ...o, status: "Locked" } : o)));
    setAudit((prev) => [{ id: genId("audit"), ts: nowISO(), actor: "owner", action: "LOCK_OBJECT", target: obj.id, meta: reason || "manual" }, ...prev]);
    addToast("Obiekt zablokowany.");
  }
  function apiUnlockObject(obj: any, reason?: string) {
    setObjects((prev) => prev.map((o) => (o.id === obj.id ? { ...o, status: "Active" } : o)));
    setAudit((prev) => [{ id: genId("audit"), ts: nowISO(), actor: "owner", action: "UNLOCK_OBJECT", target: obj.id, meta: reason || "manual" }, ...prev]);
    addToast("Obiekt odblokowany.");
  }
  function apiDisableUser(user: any, reason?: string) {
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: "Suspended" } : u)));
    setAudit((prev) => [{ id: genId("audit"), ts: nowISO(), actor: "owner", action: "DISABLE_USER", target: user.id, meta: reason || "manual" }, ...prev]);
    addToast("Użytkownik zawieszony.");
  }
  function apiEnableUser(user: any, reason?: string) {
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: "Active" } : u)));
    setAudit((prev) => [{ id: genId("audit"), ts: nowISO(), actor: "owner", action: "ENABLE_USER", target: user.id, meta: reason || "manual" }, ...prev]);
    addToast("Użytkownik przywrócony.");
  }
  function apiChangeSubscription(payload: any) {
    setObjects((prev) => prev.map((o) => (o.id === payload.id ? { ...o, plan: payload.plan, trialEndsAt: payload.trialEndsAt, subEndsAt: payload.subEndsAt } : o)));
    setAudit((prev) => [{ id: genId("audit"), ts: nowISO(), actor: "owner", action: "CHANGE_PLAN", target: payload.id, meta: `Plan -> ${payload.plan}` }, ...prev]);
    addToast("Subskrypcja zaktualizowana.");
  }
  function apiUpdateUser(updated: any) {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)));
    setAudit((prev) => [{ id: genId("audit"), ts: nowISO(), actor: "owner", action: "UPDATE_USER", target: updated.id, meta: JSON.stringify({ name: updated.name, email: updated.email }) }, ...prev]);
    addToast("Użytkownik zaktualizowany.");
  }
  function apiUpdateObject(updated: any) {
    setObjects((prev) => prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)));
    setAudit((prev) => [{ id: genId("audit"), ts: nowISO(), actor: "owner", action: "UPDATE_OBJECT", target: updated.id, meta: JSON.stringify({ name: updated.name }) }, ...prev]);
    addToast("Obiekt zaktualizowany.");
  }
  function apiSetGlobalPassword(userId: string, password: string) {
    void password;
    addToast("Globalne hasło ustawione (demo).");
    setAudit((prev) => [{ id: genId("audit"), ts: nowISO(), actor: "owner", action: "SET_GLOBAL_PASSWORD", target: userId, meta: "admin-set" }, ...prev]);
  }
  function apiSetPasswordForObject(objectId: string, userId: string, password: string) {
    setCredentials((prev: any) => ({ ...prev, [objectId]: { ...(prev[objectId] || {}), [userId]: { password } } }));
    setAudit((prev) => [{ id: genId("audit"), ts: nowISO(), actor: "owner", action: "SET_OBJECT_PASSWORD", target: `${objectId}:${userId}`, meta: "admin-set" }, ...prev]);
    addToast("Hasło dla użytkownika w obiekcie zapisane (demo).");
  }

  const contactObjects = useMemo(() => objects.filter((o) => isTrialExpiringOrExpired(o.trialEndsAt, 7)), [objects]);
  function getUsersForObject(obj: any) { return users.filter((u) => u.objects.includes(obj.name)); }
  function saveNoteForObject(objectId: string, value: string) { setNotes((prev) => ({ ...prev, [objectId]: value })); addToast("Notatka zapisana."); }
  function toggleNotInterested(objectId: string) { setNotInterested((prev) => ({ ...prev, [objectId]: !prev[objectId] })); addToast("Zmieniono flagę zainteresowania."); }
  function handleSavePayments(payload: any) { setPaymentSettings(payload); addToast("Ustawienia płatności zapisane."); closeModal(); }

  // --- MAPPING: Feature list -> AWON_FEATURES for landing ---
  function mapFeaturesForLanding(list: Array<{ label: string; paid: boolean }>) {
    // start from "all true" so brak wpisu też pokaże ✓ w obu planach
    const out = {
      free:    { calendar: true, tasks: true, crm: true, multiProperty: true,  email: true,  bookingSync: false, api: false },
      premium: { calendar: true, tasks: true, crm: true, multiProperty: false, email: true,  bookingSync: true,  api: true  },
    };
    list.forEach((f) => {
      const s = slugify(f.label);
      const paid = !!f.paid;
      const is = (names: string[]) => names.some((n) => s.includes(n));
      let key: keyof typeof out.free | null = null;
      if (is(["calendar", "kalendarz"])) key = "calendar";
      else if (is(["tasks", "zadania"])) key = "tasks";
      else if (is(["crm"])) key = "crm";
      else if (is(["multi", "wielo", "obiekt"])) key = "multiProperty";
      else if (is(["email", "powiadom"])) key = "email";
      else if (is(["booking", "airbnb", "sync", "synchron"])) key = "bookingSync";
      else if (is(["api", "webhook"])) key = "api";

      if (key) {
        // jeśli płatna → w planie FREE = false, PREMIUM = true
        // jeśli bezpłatna → FREE = true, PREMIUM = true
        (out.free as any)[key] = !paid;
        (out.premium as any)[key] = true;
      }
    });
    return out;
  }

  function handleSaveFeatures(cfg: any) {
    setFeaturesConfig(cfg);
    // zapis do window/localStorage dla Landingu:
    const canonical = mapFeaturesForLanding(cfg.features || []);
    try {
      window.AWON_FEATURES = canonical;
      window.localStorage?.setItem("AWON_FEATURES", JSON.stringify(canonical));
      window.dispatchEvent(new Event("AWON_FEATURES_UPDATED"));
    } catch {}
    addToast("Ustawienia funkcji zapisane i wysłane na Landing.");
    closeModal();
  }

  function goToObjectPage(obj: any) {
    if (!obj) return;
    const url = `/objects/${obj.id}`;
    try { window.open(url, "_blank"); addToast(`Otwieranie: ${obj.name}`); } catch { addToast("Nie można otworzyć nowej karty."); }
  }

  function ModalContent() {
    if (!modal) return null;
    const { type, payload } = modal;
    const titleMap: Record<string, string> = {
      changePlan: "Ręczna zmiana subskrypcji / przedłużenie",
      lockObject: "Zablokuj obiekt",
      unlockObject: "Odblokuj obiekt",
      resetPassword: "Reset hasła użytkownika",
      disableUser: "Zawieś użytkownika",
      enableUser: "Przywróć użytkownika",
      impersonate: "Wejście jako…",
      features: "Zarządzanie funkcjami (Landing)",
      payments: "Ustawienia płatności",
      editUser: "Edycja użytkownika",
      editObject: "Edycja obiektu",
      myObjects: "Moje obiekty",
      landingGallery: "Landing — Galeria (screeny)"
    };

    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" role="dialog" aria-modal="true">
        <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">{titleMap[type]}</h3>
            <button onClick={closeModal} className="text-slate-400 hover:text-white" aria-label="Zamknij">✕</button>
          </div>
          <div className="space-y-3 text-sm text-slate-200">
            {type === "changePlan" && <ChangePlanForm obj={payload} onClose={closeModal} onSave={apiChangeSubscription} paymentInstruction={paymentSettings?.paymentInstruction} paymentVisible={paymentSettings?.visibleToClient} />}
            {type === "lockObject" && <ConfirmBox text={`Czy na pewno zablokować obiekt "${payload?.name || ""}"?`} onConfirm={(reason) => { apiLockObject(payload, reason); closeModal(); }} onCancel={closeModal} confirmLabel="Zablokuj" tone="red" showReason />}
            {type === "unlockObject" && <ConfirmBox text={`Odblokować obiekt "${payload?.name || ""}"?`} onConfirm={(reason) => { apiUnlockObject(payload, reason); closeModal(); }} onCancel={closeModal} confirmLabel="Odblokuj" tone="green" showReason />}
            {type === "resetPassword" && <ConfirmBox text={`Wysłać reset hasła do ${payload?.name || ""} (${payload?.email || ""})?`} onConfirm={() => { console.log("RESET_PASSWORD", payload?.id); closeModal(); }} onCancel={closeModal} confirmLabel="Wyślij reset" tone="blue" />}
            {type === "disableUser" && <ConfirmBox text={`Zawieś konto użytkownika ${payload?.name || ""}?`} onConfirm={(reason) => { apiDisableUser(payload, reason); closeModal(); }} onCancel={closeModal} confirmLabel="Zawieś" tone="yellow" showReason />}
            {type === "enableUser" && <ConfirmBox text={`Przywrócić konto użytkownika ${payload?.name || ""}?`} onConfirm={(reason) => { apiEnableUser(payload, reason); closeModal(); }} onCancel={closeModal} confirmLabel="Przywróć" tone="green" showReason />}
            {type === "impersonate" && (
              <div>
                <p className="text-slate-200">Wejdziesz jako <span className="font-semibold text-white">{payload?.name || "–"}</span>. Wszystkie akcje są logowane.</p>
                <div className="mt-3 flex justify-end gap-2">
                  <button onClick={closeModal} className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm">Anuluj</button>
                  <button onClick={() => { console.log("IMPERSONATE", payload); closeModal(); }} className="rounded-xl border border-emerald-500/30 bg-emerald-500/20 px-3 py-1.5 text-sm font-semibold text-emerald-100">Wejdź jako</button>
                </div>
              </div>
            )}
            {type === "features" && <FeatureManager obj={payload} config={featuresConfig} onSave={handleSaveFeatures} onClose={closeModal} />}
            {type === "payments" && <PaymentsForm settings={paymentSettings} onSave={handleSavePayments} onClose={closeModal} />}
            {type === "editUser" && <EditUserForm user={payload} onClose={closeModal} onSave={apiUpdateUser} onSetPassword={apiSetGlobalPassword} />}
            {type === "editObject" && <EditObjectInline obj={payload} onClose={closeModal} onSave={apiUpdateObject} onSetPasswordForObject={apiSetPasswordForObject} users={users} />}
            {type === "myObjects" && (
              <div>
                <div className="text-xs text-slate-400 mb-2">Lista Twoich obiektów (demo).</div>
                <div className="space-y-2">
                  {objects.filter((o) => o.ownerEmail === currentUser.email || (currentUser.objects || []).includes(o.name)).map((o) => (
                    <div key={o.id} className="flex items-center justify-between rounded-md border border-white/5 p-3">
                      <div>
                        <div className="font-medium text-white">{o.name}</div>
                        <div className="text-xs text-slate-300">{o.ownerEmail}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { goToObjectPage(o); closeModal(); }} className="rounded-xl border border-emerald-500/30 bg-emerald-500/20 px-3 py-1 text-sm font-semibold text-emerald-100">Otwórz stronę</button>
                        <button onClick={() => openModal("editObject", o)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-sm">Edytuj</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {type === "landingGallery" && <LandingGalleryManager onClose={closeModal} />}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100">
      <Toasts toasts={toasts} remove={removeToast} />
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Panel Administratora — Właściciel systemu</h1>
            <p className="text-sm text-slate-400">Użytkownicy, obiekty, subskrypcje, płatności, landing.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => openModal("payments")} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10">Ustawienia płatności</button>
            <button onClick={() => openModal("features")} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10">Funkcje (Landing)</button>
            <button onClick={() => openModal("landingGallery")} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10">Landing: Galeria</button>
            <button onClick={() => openModal("myObjects")} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10">Moje obiekty</button>
          </div>
        </header>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Obiekty" value={sampleOverview.objects} />
          <KpiCard label="Użytkownicy" value={sampleOverview.users} />
          <KpiCard label="Trial kończy się ≤7 dni" value={sampleOverview.trialsExpiring7d} />
          <KpiCard label="Otwarte incydenty" value={sampleOverview.incidentsOpen} foot="Zerknij na zakładkę Incydenty" />
        </div>

        <div className="mb-6">
          <Section title="Do kontaktu — trial" subtitle="Obiekty z kończącym się lub zakończonym trialem.">
            {contactObjects.length === 0 ? (
              <div className="text-sm text-slate-400">Brak obiektów do kontaktu.</div>
            ) : (
              <ul className="space-y-3">
                {contactObjects.map((o) => {
                  const owners = getUsersForObject(o);
                  return (
                    <li key={o.id} className="rounded-md border border-white/5 p-3 bg-slate-900/50">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-white">{o.name}</div>
                            {notInterested[o.id] && <Badge tone="slate">Nie zainteresowany</Badge>}
                            {o.plan === "Trial" && <Badge tone="yellow">Trial</Badge>}
                          </div>
                          <div className="text-xs text-slate-300">Właściciel: {o.ownerEmail}</div>
                          <div className="text-xs text-slate-300">Trial do: {o.trialEndsAt || "—"}</div>
                          <div className="mt-2 text-xs text-slate-300">Kontaktowane osoby: {owners.map((u) => u.name).join(", ") || "brak"}</div>
                          <div className="mt-2">
                            <textarea value={notes[o.id] || ""} onChange={(e) => setNotes((prev) => ({ ...prev, [o.id]: e.target.value }))} placeholder="Dodaj notatkę" className="w-full rounded-md border border-white/10 bg-white/2 px-2 py-1 text-sm text-white" rows={2} />
                            <div className="mt-2 flex items-center gap-2">
                              <button onClick={() => saveNoteForObject(o.id, notes[o.id] || "")} className="rounded-xl border border-emerald-500/30 bg-emerald-500/20 px-3 py-1 text-sm font-semibold text-emerald-100">Zapisz notatkę</button>
                              <label className="inline-flex items-center gap-2 text-sm text-slate-300">
                                <input type="checkbox" checked={!!notInterested[o.id]} onChange={() => toggleNotInterested(o.id)} />
                                Nie zainteresowany
                              </label>
                              <button onClick={() => openModal("editObject", o)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-sm">Edytuj obiekt</button>
                              <button onClick={() => goToObjectPage(o)} className="rounded-xl border border-emerald-500/30 bg-emerald-500/20 px-3 py-1 text-sm text-emerald-100">Otwórz stronę</button>
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-xs text-slate-400">{o.subEndsAt ? `Subskrypcja do: ${o.subEndsAt}` : "Brak subskrypcji"}</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Section
              title="Obiekty"
              subtitle="Zarządzaj planami, statusem i dostępem."
              right={
                <div className="flex items-center gap-2">
                  <input value={objectQuery} onChange={(e) => setObjectQuery(e.target.value)} placeholder="Szukaj: nazwa, email, plan" className="w-72 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
                  <button onClick={() => openModal("features")} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">Funkcje</button>
                </div>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-slate-300">
                    <tr className="border-b border-white/10">
                      <th className="py-2 pr-3">Obiekt</th>
                      <th className="py-2 pr-3">Plan</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2 pr-3">Trial do</th>
                      <th className="py-2 pr-3">Subskrypcja do</th>
                      <th className="py-2 pr-3">Właściciel</th>
                      <th className="py-2 pr-3">Akcje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredObjects.map((o) => (
                      <tr key={o.id} className="border-b border-white/5 align-top">
                        <td className="py-2 pr-3 font-medium text-white">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <div>{o.name}</div>
                              {notInterested[o.id] && <Badge tone="slate">Nie zainteresowany</Badge>}
                            </div>
                            {notes[o.id] && <div className="text-xs text-slate-400">Notatka: {notes[o.id]}</div>}
                          </div>
                        </td>
                        <td className="py-2 pr-3"><Badge tone="violet">{o.plan}</Badge></td>
                        <td className="py-2 pr-3">
                          {o.status === "Active" && <Badge tone="green">Aktywna</Badge>}
                          {o.status === "Trial" && <Badge tone="yellow">Trial</Badge>}
                          {o.status === "Locked" && <Badge tone="red">Zablokowana</Badge>}
                        </td>
                        <td className="py-2 pr-3 text-slate-300">{o.trialEndsAt || "—"}</td>
                        <td className="py-2 pr-3 text-slate-300">{o.subEndsAt || "—"}</td>
                        <td className="py-2 pr-3 text-slate-300">{o.ownerEmail}</td>
                        <td className="py-2 pr-3">
                          <div className="flex flex-wrap gap-1.5">
                            <button onClick={() => openModal("changePlan", o)} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs">Subskrypcja / Przedłuż</button>
                            {o.status !== "Locked" ? (
                              <button onClick={() => openModal("lockObject", o)} className="rounded-lg border border-red-500/30 bg-red-500/20 px-2.5 py-1 text-xs text-red-200">Zablokuj</button>
                            ) : (
                              <button onClick={() => openModal("unlockObject", o)} className="rounded-lg border border-green-500/30 bg-green-500/20 px-2.5 py-1 text-xs text-green-200">Odblokuj</button>
                            )}
                            <button onClick={() => openModal("editObject", o)} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs">Edytuj</button>
                            <button onClick={() => openModal("features", o)} className="rounded-lg border border-emerald-500/30 bg-emerald-500/20 px-2.5 py-1 text-xs text-emerald-200">Funkcje obiektu</button>
                            <button onClick={() => openModal("impersonate", { type: "object", id: o.id, name: o.name })} className="rounded-lg border border-emerald-500/30 bg-emerald-500/20 px-2.5 py-1 text-xs text-emerald-200">Wejdź jako</button>
                            <button onClick={() => goToObjectPage(o)} className="rounded-lg border border-emerald-500/30 bg-emerald-500/20 px-2.5 py-1 text-xs text-emerald-100">Otwórz stronę</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          </div>

          <div className="lg:col-span-1">
            <Section title="Użytkownicy" subtitle="Szybkie akcje na kontach."
              right={<input value={userQuery} onChange={(e) => setUserQuery(e.target.value)} placeholder="Szukaj: imię, email, obiekt" className="w-56 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />}>
              <ul className="divide-y divide-white/5">
                {filteredUsers.map((u) => (
                  <li key={u.id} className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-white">{u.name}</div>
                        <div className="text-xs text-slate-400">{u.email}</div>
                        <div className="mt-1 text-xs text-slate-300">{u.objects.join(", ")}</div>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          <Badge tone={u.mfa ? "green" : "slate"}>{u.mfa ? "MFA" : "Bez MFA"}</Badge>
                          <Badge tone={u.status === "Active" ? "green" : "red"}>{u.status}</Badge>
                          <Badge tone="blue">{u.role}</Badge>
                        </div>
                      </div>
                      <div className="text-right text-xs text-slate-400">Ostatnio: {u.lastLogin}</div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <button onClick={() => openModal("resetPassword", u)} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs">Reset hasła</button>
                      {u.status !== "Suspended" ? (
                        <button onClick={() => openModal("disableUser", u)} className="rounded-lg border border-yellow-500/30 bg-yellow-500/20 px-2.5 py-1 text-xs text-yellow-100">Zawieś</button>
                      ) : (
                        <button onClick={() => openModal("enableUser", u)} className="rounded-lg border border-green-500/30 bg-green-500/20 px-2.5 py-1 text-xs text-green-100">Przywróć</button>
                      )}
                      <button onClick={() => openModal("editUser", u)} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs">Edytuj</button>
                      <button onClick={() => openModal("impersonate", { type: "user", id: u.id, name: u.name })} className="rounded-lg border border-emerald-500/30 bg-emerald-500/20 px-2.5 py-1 text-xs text-emerald-200">Wejdź jako</button>
                    </div>
                  </li>
                ))}
              </ul>
            </Section>
          </div>
        </div>

        <div className="mt-6">
          <Section title="Logi audytu" subtitle="Każda akcja admina jest rejestrowana">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-slate-300">
                  <tr className="border-b border-white/10">
                    <th className="py-2 pr-3">Czas</th>
                    <th className="py-2 pr-3">Aktor</th>
                    <th className="py-2 pr-3">Akcja</th>
                    <th className="py-2 pr-3">Obiekt</th>
                    <th className="py-2 pr-3">Szczegóły</th>
                  </tr>
                </thead>
                <tbody>
                  {audit.map((e) => (
                    <tr key={e.id} className="border-b border-white/5">
                      <td className="py-2 pr-3 text-slate-300">{e.ts}</td>
                      <td className="py-2 pr-3 text-slate-300">{e.actor}</td>
                      <td className="py-2 pr-3 font-medium text-white">{e.action}</td>
                      <td className="py-2 pr-3 text-slate-300">{e.target}</td>
                      <td className="py-2 pr-3 text-slate-300">{e.meta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </div>
      </div>

      {ModalContent()}
    </div>
  );
}
