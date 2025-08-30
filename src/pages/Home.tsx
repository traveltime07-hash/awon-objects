import React, { useEffect, useState } from "react";
import { loadSiteState, saveSiteState, SiteState } from "../lib/siteState";

export default function Home() {
  const [state, setState] = useState<SiteState>(() => loadSiteState());

  useEffect(() => {
    const h = () => setState(loadSiteState());
    window.addEventListener("storage", h as any);
    window.addEventListener("awon:site-change", h as any);
    return () => {
      window.removeEventListener("storage", h as any);
      window.removeEventListener("awon:site-change", h as any);
    };
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">{state.heroTitle}</h1>
        <p className="text-gray-600">{state.heroText}</p>
      </header>

      <section className="rounded-2xl border p-4">
        <h2 className="mb-3 text-lg font-medium">Funkcje obiektu</h2>
        <ul className="space-y-2">
          {state.features.map((f) => (
            <li key={f.id} className="flex items-start justify-between rounded-lg border p-3">
              <div>
                <div className="font-medium">{f.name}</div>
                {f.description && <div className="text-sm text-gray-600">{f.description}</div>}
              </div>
              <span
                className={`rounded px-2 py-1 text-xs font-semibold ${
                  f.paid ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                }`}
                title={f.paid ? "Usługa płatna" : "Usługa bezpłatna"}
              >
                {f.paid ? "PŁATNE" : "BEZPŁATNE"}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
