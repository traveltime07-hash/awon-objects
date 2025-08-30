// src/pages/Home.tsx
import React, { useState, useEffect, useCallback } from "react";

export default function AwonLanding() {
  const year = new Date().getFullYear();

  function CheckIcon() {
    return (
      <svg className="inline-block h-6 w-6 text-green-600" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  function CrossIcon() {
    return (
      <svg className="inline-block h-6 w-6 text-red-600" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  const smoothScroll = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const onNavigateRegister = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault();
    window.location.href = "/login"; // w MVP rejestracja == logowanie admina
  }, []);
  const onNavigateLogin = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault();
    window.location.href = "/login";
  }, []);

  function Gallery() {
    const [images, setImages] = useState<string[]>([]);
    const [idx, setIdx] = useState(0);

    useEffect(() => {
      const fromWin = (window as any).AWON_GALLERY_IMAGES;
      if (Array.isArray(fromWin) && fromWin.length) {
        setImages(fromWin);
        return;
      }
      try {
        const stored = localStorage.getItem("AWON_GALLERY_IMAGES");
        const parsed = stored ? JSON.parse(stored) : [];
        setImages(Array.isArray(parsed) ? parsed : []);
      } catch {
        setImages([]);
      }
    }, []);
    useEffect(() => {
      if (images.length < 2) return;
      const t = setInterval(() => setIdx((i) => (i + 1) % images.length), 4000);
      return () => clearInterval(t);
    }, [images]);

    if (!images.length) {
      return (
        <div className="flex h-64 w-full items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
          <div className="text-gray-400">Brak zrzutów — dodaj je w panelu administratora</div>
        </div>
      );
    }
    return (
      <div className="w-full">
        <div className="flex h-64 w-full items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
          <img src={images[idx]} alt={`Screenshot ${idx + 1}`} className="h-full w-full object-cover" />
        </div>
        {images.length > 1 && (
          <div className="mt-3 flex items-center justify-center gap-3">
            <button onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)} className="rounded border px-3 py-1 bg-white">
              ◀
            </button>
            <div className="flex items-center gap-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  aria-label={`Pokaż ${i + 1}`}
                  className={`h-3 w-3 rounded-full ${i === idx ? "bg-[#0B6EFD]" : "bg-gray-300"}`}
                />
              ))}
            </div>
            <button onClick={() => setIdx((i) => (i + 1) % images.length)} className="rounded border px-3 py-1 bg-white">
              ▶
            </button>
          </div>
        )}
      </div>
    );
  }

  // Flagi funkcji (czytane z panelu admina)
  type Plan = "free" | "premium" | "off";
  const [flags, setFlags] = useState<Record<string, Plan>>({
    calendar: "free",
    tasks: "free",
    customers: "free",
    multiobjects: "free",
    integrations: "premium",
    api: "premium",
  });
  useEffect(() => {
    try {
      const raw = localStorage.getItem("AWON_FEATURE_FLAGS");
      if (raw) setFlags(JSON.parse(raw));
    } catch {}
  }, []);

  const cell = (p: Plan, want: "free" | "premium") =>
    p === "off" ? <CrossIcon /> : want === "free" ? <CheckIcon /> : p === "premium" ? <CheckIcon /> : <CrossIcon />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-gray-800">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#0B6EFD] font-bold text-white">AW</div>
          <div>
            <h1 className="text-lg font-semibold">AWON</h1>
            <div className="text-sm text-gray-500">Administracja wynajmem obiektów noclegowych</div>
          </div>
        </div>

        <nav className="flex items-center gap-4">
          <button className="text-sm hover:underline" onClick={() => smoothScroll("features")}>
            Funkcje
          </button>
          <button className="text-sm hover:underline" onClick={() => smoothScroll("cennik")}>
            Cennik
          </button>
          <button className="text-sm hover:underline" onClick={() => smoothScroll("kontakt")}>
            Kontakt
          </button>
          <button onClick={onNavigateLogin} className="inline-block rounded-lg bg-[#0B6EFD] px-4 py-2 text-sm font-medium text-white">
            Zaloguj
          </button>
          <button onClick={onNavigateRegister} className="ml-2 inline-block rounded-lg bg-[#0B6EFD] px-4 py-2 text-sm font-medium text-white">
            Załóż bezpłatne konto
          </button>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-6 py-12 md:grid-cols-2">
          <div>
            <h2 className="text-4xl font-extrabold leading-tight md:text-5xl">
              Bezpłatny system zarządzania dla właścicieli obiektów noclegowych
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              AWON — system do zarządzania rezerwacjami, zadaniami i personelem. Podstawowe narzędzia są bezpłatne; płatne funkcje możesz włączyć
              w koncie Premium.
            </p>

            <div className="mt-6 flex gap-3">
              <button onClick={onNavigateRegister} className="rounded-lg bg-[#0B6EFD] px-6 py-3 font-semibold text-white">
                Korzystaj za darmo
              </button>
              <button onClick={() => smoothScroll("features")} className="rounded-lg border border-gray-200 px-6 py-3 text-sm">
                Zobacz funkcje
              </button>
            </div>

            <ul className="mt-6 grid grid-cols-1 gap-2 text-sm text-gray-600 sm:grid-cols-2">
              <li>• Kalendarz rezerwacji</li>
              <li>• Codzienne zadania i harmonogram sprzątania</li>
              <li>• Baza klientów</li>
              <li>• Zarządzanie wieloma obiektami</li>
            </ul>
          </div>

          <div className="order-first flex items-center justify-center md:order-last">
            <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-lg">
              <div className="mb-3 text-sm text-gray-500">Podgląd systemu</div>
              <Gallery />
              <div className="mt-4 text-right">
                <a href="/admin" className="rounded bg-gray-100 px-3 py-2 text-sm">
                  Panel administratora
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-6 py-12">
          <h3 className="text-2xl font-semibold">Funkcje</h3>
          <div className="mt-6 overflow-auto rounded-lg bg-white p-6 shadow-sm">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-3 font-medium">Funkcja</th>
                  <th className="px-4 py-3 text-center font-medium">Podstawowy</th>
                  <th className="px-4 py-3 text-center font-medium">Rozszerzony</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-4 py-3">Kalendarz rezerwacji</td>
                  <td className="px-4 py-3 text-center">{cell(flags.calendar, "free")}</td>
                  <td className="px-4 py-3 text-center">{cell(flags.calendar, "premium")}</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-3">Codzienne zadania (sprzątanie, naprawy)</td>
                  <td className="px-4 py-3 text-center">{cell(flags.tasks, "free")}</td>
                  <td className="px-4 py-3 text-center">{cell(flags.tasks, "premium")}</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-3">Baza klientów</td>
                  <td className="px-4 py-3 text-center">{cell(flags.customers, "free")}</td>
                  <td className="px-4 py-3 text-center">{cell(flags.customers, "premium")}</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-3">Zarządzanie wieloma obiektami</td>
                  <td className="px-4 py-3 text-center">{cell(flags.multiobjects, "free")}</td>
                  <td className="px-4 py-3 text-center">{cell(flags.multiobjects, "premium")}</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-3">Integracje (Booking, Airbnb)</td>
                  <td className="px-4 py-3 text-center">{cell(flags.integrations, "free")}</td>
                  <td className="px-4 py-3 text-center">{cell(flags.integrations, "premium")}</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-3">API / Webhooks</td>
                  <td className="px-4 py-3 text-center">{cell(flags.api, "free")}</td>
                  <td className="px-4 py-3 text-center">{cell(flags.api, "premium")}</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-4 text-xs text-gray-500">
              Legenda: zielone ✓ oznacza dostępne w planie, czerwone ✕ oznacza brak. Przełącz to w panelu administratora.
            </p>
          </div>
        </section>

        <section id="cennik" className="mx-auto max-w-7xl px-6 py-12">
          <h3 className="text-2xl font-semibold">Cennik — co zyskujesz wybierając Premium</h3>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h4 className="font-semibold">Plan Darmowy</h4>
              <p className="mt-2 text-sm text-gray-600">0 zł / miesiąc — podstawowe narzędzia do prowadzenia obiektu.</p>
              <ul className="mt-4 list-inside list-disc text-sm text-gray-700">
                <li>Kalendarz rezerwacji</li>
                <li>Codzienne zadania i harmonogram sprzątania</li>
                <li>Baza klientów</li>
              </ul>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h4 className="font-semibold">Plan Premium</h4>
              <p className="mt-2 text-sm text-gray-600">Więcej automatyzacji i integracji — idealne przy większej liczbie obiektów.</p>
              <div className="mt-4 text-lg font-bold">Cena: (do ustalenia)</div>
              <ul className="mt-4 list-inside list-disc text-sm text-gray-700">
                <li>Automatyczne przypisywanie zadań</li>
                <li>Synchronizacja z Booking i Airbnb</li>
                <li>API / Webhooks dla integracji</li>
                <li>Zaawansowane raporty i eksport do Excela</li>
                <li>Brak limitów użytkowników i obiektów</li>
                <li>Priorytetowe wsparcie</li>
                <li>Dłuższe przechowywanie kopii zapasowych</li>
              </ul>
              <div className="mt-6">
                <button onClick={onNavigateRegister} className="inline-block rounded-lg bg-[#0B6EFD] px-5 py-3 font-semibold text-white">
                  Wypróbuj Premium — 30 dni za darmo
                </button>
              </div>
            </div>
          </div>
        </section>

        <section id="kontakt" className="mx-auto max-w-7xl px-6 py-12">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="text-2xl font-semibold">Kontakt</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert("Dziękujemy — wiadomość wysłana (mock).");
              }}
              className="mt-4 grid grid-cols-1 gap-4"
            >
              <label className="block">
                <div className="text-sm text-gray-700">Imię i nazwisko</div>
                <input className="mt-1 w-full rounded-md border-gray-200 shadow-sm" type="text" required />
              </label>
              <label className="block">
                <div className="text-sm text-gray-700">E-mail</div>
                <input className="mt-1 w-full rounded-md border-gray-200 shadow-sm" type="email" required />
              </label>
              <label className="block">
                <div className="text-sm text-gray-700">Wiadomość</div>
                <textarea className="mt-1 w-full rounded-md border-gray-200 shadow-sm" rows={5} required />
              </label>
              <div>
                <button type="submit" className="rounded-lg bg-[#0B6EFD] px-5 py-3 font-semibold text-white">
                  Wyślij wiadomość
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-7xl px-6 py-8 text-sm text-gray-500">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="font-semibold">AWON</div>
            <div>Administracja wynajmem obiektów noclegowych</div>
            <div className="mt-2">
              Adres: <span className="text-gray-700">[Twoje dane]</span>
            </div>
          </div>
          <div className="flex gap-6">
            <div>
              <div className="font-medium">Szybkie linki</div>
              <ul className="mt-2">
                <li>
                  <a className="hover:underline" href="/pomoc">
                    Pomoc
                  </a>
                </li>
                <li>
                  <a className="hover:underline" href="/regulamin">
                    Regulamin
                  </a>
                </li>
                <li>
                  <a className="hover:underline" href="/polityka-prywatnosci">
                    Polityka prywatności
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <div className="font-medium">Kontakt</div>
              <div className="mt-2">
                E: <a className="hover:underline">kontakt@awon.example</a>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 text-xs text-gray-400">© {year} AWON — Wszelkie prawa zastrzeżone.</div>
      </footer>
    </div>
  );
}
