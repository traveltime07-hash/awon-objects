import React, { useEffect, useState } from "react";
import { loadSiteState, saveSiteState, SiteState, Feature } from "../lib/siteState";

type User = { email: string; role: "admin" | "user" } | null;

export default function Admin() {
  const [user, setUser] = useState<User>(null);
  const [state, setState] = useState<SiteState>(() => loadSiteState());
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    // sprawdź sesję
    fetch("/api/auth/me", { credentials: "include" })
      .then(async (r) => (r.ok ? (await r.json()).user : null))
      .then((u) => {
        if (!u) window.location.href = "/app/login";
        else setUser(u);
      })
      .catch(() => {
        window.location.href = "/app/login";
      });
  }, []);

  function addFeature() {
    const id = "f-" + Date.now().toString(36);
    setState((s) => ({
      ...s,
      features: [...s.features, { id, name: "Nowa funkcja", description: "", paid: false }],
    }));
  }

  function updateFeature(id: string, patch: Partial<Feature>) {
    setState((s) => ({
      ...s,
      features: s.features.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    }));
  }

  function removeFeature(id: string) {
    setState((s) => ({ ...s, features: s.features.filter((f) => f.id !== id) }));
  }

  async function onSave() {
    setSaving(true);
    setMsg("");
    try {
      saveSiteState(state);
      setMsg("Zapisano. Zmiany są od razu widoczne na stronie głównej.");
    } finally {
      setSaving(false);
    }
  }

  async function onLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/app/login";
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Panel administratora</h1>
          <div className="text-sm text-gray-600">Zalogowano: {user.email}</div>
        </div>
        <button
          onClick={onLogout}
          className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
          title="Wyloguj"
        >
          Wyloguj
        </button>
      </div>

      <section className="rounded-2xl border p-4">
        <h2 className="mb-3 text-lg font-medium">Strona główna — treści</h2>

        <label className="text-xs text-gray-600">Nagłówek</label>
        <input
          value={state.heroTitle}
          onChange={(e) => setState({ ...state, heroTitle: e.target.value })}
          className="mb-2 w-full rounded-lg border px-3 py-2"
        />

        <label className="text-xs text-gray-600">Opis (hero)</label>
        <textarea
          rows={3}
          value={state.heroText}
          onChange={(e) => setState({ ...state, heroText: e.target.value })}
          className="mb-4 w-full rounded-lg border px-3 py-2"
        />

        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-md font-medium">Funkcje na stronie głównej</h3>
          <button
            onClick={addFeature}
            className="rounded-xl bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
          >
            + Dodaj funkcję
          </button>
        </div>

        <div className="space-y-3">
          {state.features.map((f) => (
            <div key={f.id} className="rounded-xl border p-3">
              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  <label className="text-xs text-gray-600">Nazwa</label>
                  <input
                    value={f.name}
                    onChange={(e) => updateFeature(f.id, { name: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={!!f.paid}
                      onChange={(e) => updateFeature(f.id, { paid: e.target.checked })}
                    />
                    Płatne
                  </label>
                  <button
                    onClick={() => removeFeature(f.id)}
                    className="rounded-lg border px-2 py-1 text-sm hover:bg-red-50"
                  >
                    Usuń
                  </button>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-gray-600">Opis</label>
                  <textarea
                    rows={2}
                    value={f.description || ""}
                    onChange={(e) => updateFeature(f.id, { description: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            onClick={onSave}
            disabled={saving}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Zapisywanie…" : "Zapisz zmiany"}
          </button>
        </div>

        {msg && <div className="mt-2 text-sm text-emerald-700">{msg}</div>}
      </section>
    </div>
  );
}
