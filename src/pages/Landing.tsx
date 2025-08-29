import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

/**
 * AWON — Landing (Vite + React Router)
 * - Gallery: obrazy z window.AWON_GALLERY_IMAGES lub localStorage('AWON_GALLERY_IMAGES')
 * - Feature flags: window.AWON_FEATURES lub localStorage('AWON_FEATURES')
 *   Struktura spodziewana (przykład):
 *   {
 *     "free":    { "calendar": true, "tasks": true, "crm": true, "multiProperty": true, "email": true, "bookingSync": false, "api": false },
 *     "premium": { "calendar": true, "tasks": true, "crm": true, "multiProperty": false,"email": true, "bookingSync": true,  "api": true  }
 *   }
 */

type Features = {
  free: {
    calendar: boolean;
    tasks: boolean;
    crm: boolean;
    multiProperty: boolean;
    email: boolean;
    bookingSync: boolean;
    api: boolean;
  };
  premium: {
    calendar: boolean;
    tasks: boolean;
    crm: boolean;
    multiProperty: boolean;
    email: boolean;
    bookingSync: boolean;
    api: boolean;
  };
};

const DEFAULT_FEATURES: Features = {
  // zgodnie z tabelą z Twojego opisu
  free:    { calendar: true, tasks: true, crm: true, multiProperty: true,  email: true,  bookingSync: false, api: false },
  premium: { calendar: true, tasks: true, crm: true, multiProperty: false, email: true,  bookingSync: true,  api: true  },
};

function loadFeatures(): Features {
  // 1) window.AWON_FEATURES
  if (typeof window !== "undefined" && (window as any).AWON_FEATURES) {
    try { return (window as any).AWON_FEATURES as Features; } catch { /* noop */ }
  }
  // 2) localStorage
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem("AWON_FEATURES");
      if (raw) return JSON.parse(raw) as Features;
    }
  } catch { /* noop */ }
  // fallback
  return DEFAULT_FEATURES;
}

function CheckIcon() {
  return (
    <svg className="inline-block h-5 w-5 text-green-600" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CrossIcon() {
  return (
    <svg className="inline-block h-5 w-5 text-red-600" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------------- Gallery ---------------- */
function Gallery() {
  const [images, setImages] = useState<string[]>([]);
  const [idx, setIdx] = useState(0);

  const readImages = useCallback(() => {
    try {
      const fromWindow =
        typeof window !== "undefined" && Array.isArray((window as any).AWON_GALLERY_IMAGES)
          ? (window as any).AWON_GALLERY_IMAGES as string[]
          : null;
      if (fromWindow && fromWindow.length) {
        setImages(fromWindow);
        return;
      }
      const stored =
        typeof window !== "undefined" && window.localStorage
          ? window.localStorage.getItem("AWON_GALLERY_IMAGES")
          : null;
      const parsed = stored ? JSON.parse(stored) : [];
      setImages(parsed || []);
    } catch {
      setImages([]);
    }
  }, []);

  useEffect(() => {
    readImages();
    const onUpdate = () => readImages();
    window.addEventListener("AWON_GALLERY_UPDATED" as any, onUpdate);
    return () => window.removeEventListener("AWON_GALLERY_UPDATED" as any, onUpdate);
  }, [readImages]);

  useEffect(() => {
    if (!images || images.length === 0) return;
    const t = setInterval(() => setIdx(i => (i + 1) % images.length), 4000);
    return () => clearInterval(t);
  }, [images]);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-64 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400">Brak zrzutów — dodaj je w panelu administratora</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="w-full h-64 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
        <img src={images[idx]} alt={`Screenshot ${idx + 1}`} className="w-full h-full object-cover" />
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-3">
          <button onClick={() => setIdx(i => (i - 1 + images.length) % images.length)} className="px-3 py-1 rounded bg-white border">◀</button>
          <div className="flex gap-2 items-center">
            {images.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)} aria-label={`Pokaż ${i + 1}`} className={`w-3 h-3 rounded-full ${i === idx ? 'bg-[#0B6EFD]' : 'bg-gray-300'}`} />
            ))}
          </div>
          <button onClick={() => setIdx(i => (i + 1) % images.length)} className="px-3 py-1 rounded bg-white border">▶</button>
        </div>
      )}
    </div>
  );
}

/* ---------------- AdminUploader (mock) ---------------- */
function AdminUploader({ onDone }: { onDone?: (urls: string[]) => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(Array.from(e.target.files || []));
    setMessage("");
  };

  const onUpload = async () => {
    if (files.length === 0) return setMessage("Wybierz pliki do załadowania.");
    setUploading(true);
    try {
      const readFile = (file: File) =>
        new Promise<string>((res, rej) => {
          const fr = new FileReader();
          fr.onload = () => res(String(fr.result));
          fr.onerror = rej;
          fr.readAsDataURL(file);
        });
      const urls = await Promise.all(files.map(readFile));
      const prev =
        typeof window !== "undefined" && window.localStorage
          ? window.localStorage.getItem("AWON_GALLERY_IMAGES")
          : null;
      const arr = prev ? JSON.parse(prev) : [];
      const merged = [...arr, ...urls];
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem("AWON_GALLERY_IMAGES", JSON.stringify(merged));
        (window as any).AWON_GALLERY_IMAGES = merged;
      }
      window.dispatchEvent(new Event("AWON_GALLERY_UPDATED"));
      setMessage("Zapisano zdjęcia (mock).");
      setFiles([]);
      onDone?.(merged);
    } catch {
      setMessage("Błąd podczas wgrywania.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-6 bg-gray-50 p-4 rounded">
      <div className="flex items-center justify-between">
        <div className="font-medium">Panel administratora (demo)</div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3">
        <input type="file" multiple accept="image/*" onChange={onSelect} />
        <div className="flex gap-2">
          <button onClick={onUpload} disabled={uploading} className="px-4 py-2 rounded bg-[#0B6EFD] text-white">
            {uploading ? "Wgrywanie..." : "Wgraj (mock)"}
          </button>
          <button onClick={() => { setFiles([]); setMessage(""); }} className="px-4 py-2 rounded border">Wyczyść</button>
        </div>
        <div className="text-sm text-gray-600">{files.length} plik(ów) wybrano.</div>
        {message && <div className="text-sm text-green-600">{message}</div>}
      </div>
    </div>
  );
}

/* ---------------- Landing ---------------- */
export default function Landing() {
  const navigate = useNavigate();
  const year = new Date().getFullYear();
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [features, setFeatures] = useState<Features>(() => loadFeatures());

  const onNavigateRegister = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault();
    navigate("/app"); // tu później podlinkujemy prawdziwą rejestrację
  }, [navigate]);

  const onNavigateLogin = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault();
    navigate("/app");
  }, [navigate]);

  const smoothScroll = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    document.title = "AWON — system do zarządzania rezerwacjami, zadaniami i personelem";
    const content =
      "AWON — system do zarządzania rezerwacjami, zadaniami i personelem. Podstawowe narzędzia są bezpłatne; dodatkowe płatne funkcje w koncie Premium.";
    let metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = content;
  }, []);

  // odśwież feature flags, gdy admin je zmieni (np. zapisze w localStorage)
  useEffect(() => {
    const onFeaturesUpdated = () => setFeatures(loadFeatures());
    window.addEventListener("AWON_FEATURES_UPDATED" as any, onFeaturesUpdated);
    const onStorage = (e: StorageEvent) => {
      if (e.key === "AWON_FEATURES") setFeatures(loadFeatures());
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("AWON_FEATURES_UPDATED" as any, onFeaturesUpdated);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-gray-800">
      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#0B6EFD] text-white font-bold rounded-lg flex items-center justify-center">AW</div>
          <div>
            <h1 className="text-lg font-semibold">AWON</h1>
            <div className="text-sm text-gray-500">Administracja wynajmem obiektów noclegowych</div>
          </div>
        </div>

        <nav className="flex items-center gap-4">
          <button className="text-sm hover:underline" onClick={() => smoothScroll("features")}>Funkcje</button>
          <button className="text-sm hover:underline" onClick={() => smoothScroll("cennik")}>Cennik</button>
          <button className="text-sm hover:underline" onClick={() => smoothScroll("kontakt")}>Kontakt</button>
          <button onClick={onNavigateLogin} className="inline-block px-4 py-2 rounded-lg bg-[#0B6EFD] text-white text-sm font-medium">Zaloguj</button>
          <button onClick={onNavigateRegister} className="ml-1 inline-block px-4 py-2 rounded-lg bg-[#0B6EFD] text-white text-sm font-medium">Załóż bezpłatne konto</button>
        </nav>
      </header>

      <main>
        <section className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-extrabold leading-tight">
              Bezpłatny system zarządzania dla właścicieli obiektów noclegowych
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              AWON — system do zarządzania rezerwacjami, zadaniami i personelem. Korzystanie z podstawowych narzędzi
              jest całkowicie bezpłatne; dodatkowe płatne funkcje są dostępne w koncie Premium.
            </p>

            <div className="mt-6 flex gap-3">
              <button onClick={onNavigateRegister} className="px-6 py-3 rounded-lg bg-[#0B6EFD] text-white font-semibold">
                Korzystaj za darmo
              </button>
              <button onClick={() => smoothScroll("features")} className="px-6 py-3 rounded-lg border border-gray-200 text-sm">
                Zobacz funkcje
              </button>
            </div>

            <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
              <li>• Kalendarz rezerwacji</li>
              <li>• Codzienne zadania i harmonogram sprzątania</li>
              <li>• Baza klientów</li>
              <li>• Zarządzanie wieloma obiektami</li>
            </ul>
          </div>

          <div className="order-first md:order-last flex items-center justify-center">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-4">
              <div className="text-sm text-gray-500 mb-3">Podgląd systemu</div>
              <Gallery />
              <div className="mt-4 flex justify-end">
                <button onClick={() => setIsAdminOpen(true)} className="px-3 py-2 rounded bg-gray-100 text-sm">
                  Otwórz panel administratora
                </button>
              </div>
              {isAdminOpen && <AdminUploader onDone={() => setIsAdminOpen(false)} />}
            </div>
          </div>
        </section>

        {/* Funkcje — spięte z feature flags */}
        <section id="features" className="max-w-7xl mx-auto px-6 py-12">
          <h3 className="text-2xl font-semibold">Funkcje</h3>
          <div className="mt-6 bg-white p-6 rounded-lg shadow-sm overflow-auto">
            <table className="min-w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-3 font-medium">Funkcja</th>
                  <th className="px-4 py-3 font-medium text-center">Podstawowy</th>
                  <th className="px-4 py-3 font-medium text-center">Rozszerzony</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t"><td className="px-4 py-3">Kalendarz rezerwacji</td>
                  <td className="px-4 py-3 text-center">{features.free.calendar ? <CheckIcon/> : <CrossIcon/>}</td>
                  <td className="px-4 py-3 text-center">{features.premium.calendar ? <CheckIcon/> : <CrossIcon/>}</td></tr>

                <tr className="border-t"><td className="px-4 py-3">Codzienne zadania (sprzątanie, naprawy)</td>
                  <td className="px-4 py-3 text-center">{features.free.tasks ? <CheckIcon/> : <CrossIcon/>}</td>
                  <td className="px-4 py-3 text-center">{features.premium.tasks ? <CheckIcon/> : <CrossIcon/>}</td></tr>

                <tr className="border-t"><td className="px-4 py-3">Baza klientów</td>
                  <td className="px-4 py-3 text-center">{features.free.crm ? <CheckIcon/> : <CrossIcon/>}</td>
                  <td className="px-4 py-3 text-center">{features.premium.crm ? <CheckIcon/> : <CrossIcon/>}</td></tr>

                <tr className="border-t"><td className="px-4 py-3">Zarządzanie wieloma obiektami</td>
                  <td className="px-4 py-3 text-center">{features.free.multiProperty ? <CheckIcon/> : <CrossIcon/>}</td>
                  <td className="px-4 py-3 text-center">{features.premium.multiProperty ? <CheckIcon/> : <CrossIcon/>}</td></tr>

                <tr className="border-t"><td className="px-4 py-3">Powiadomienia e-mail</td>
                  <td className="px-4 py-3 text-center">{features.free.email ? <CheckIcon/> : <CrossIcon/>}</td>
                  <td className="px-4 py-3 text-center">{features.premium.email ? <CheckIcon/> : <CrossIcon/>}</td></tr>

                <tr className="border-t"><td className="px-4 py-3">Synchronizacja z Booking/Airbnb</td>
                  <td className="px-4 py-3 text-center">{features.free.bookingSync ? <CheckIcon/> : <CrossIcon/>}</td>
                  <td className="px-4 py-3 text-center">{features.premium.bookingSync ? <CheckIcon/> : <CrossIcon/>}</td></tr>

                <tr className="border-t"><td className="px-4 py-3">API / Webhooks</td>
                  <td className="px-4 py-3 text-center">{features.free.api ? <CheckIcon/> : <CrossIcon/>}</td>
                  <td className="px-4 py-3 text-center">{features.premium.api ? <CheckIcon/> : <CrossIcon/>}</td></tr>
              </tbody>
            </table>
            <p className="mt-4 text-xs text-gray-500">Legenda: zielone ✓ = dostępne, czerwone ✕ = niedostępne.</p>
          </div>
        </section>

        {/* Cennik */}
        <section id="cennik" className="max-w-7xl mx-auto px-6 py-12">
          <h3 className="text-2xl font-semibold">Cennik — co zyskujesz wybierając Premium</h3>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h4 className="font-semibold">Plan Darmowy</h4>
              <p className="mt-2 text-sm text-gray-600">0 zł / miesiąc — podstawowe narzędzia.</p>
              <ul className="mt-4 list-disc list-inside text-sm text-gray-700">
                <li>Kalendarz rezerwacji</li>
                <li>Codzienne zadania</li>
                <li>Baza klientów</li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h4 className="font-semibold">Plan Premium</h4>
              <p className="mt-2 text-sm text-gray-600">Automatyzacja i integracje.</p>
              <ul className="mt-4 list-disc list-inside text-sm text-gray-700">
                <li>Synchronizacja z Booking/Airbnb</li>
                <li>API / Webhooks</li>
                <li>Zaawansowane raporty</li>
              </ul>
              <div className="mt-6">
                <button onClick={onNavigateRegister} className="inline-block px-5 py-3 rounded-lg bg-[#0B6EFD] text-white font-semibold">
                  Wypróbuj Premium — 30 dni
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Kontakt */}
        <section id="kontakt" className="max-w-7xl mx-auto px-6 py-12">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-2xl font-semibold">Kontakt</h3>
            <form
              onSubmit={(e)=>{e.preventDefault(); alert('Dziękujemy — wiadomość wysłana (mock).');}}
              className="mt-4 grid grid-cols-1 gap-4"
            >
              <label className="block">
                <div className="text-sm text-gray-700">Imię i nazwisko</div>
                <input className="mt-1 w-full rounded-md border-gray-200 shadow-sm" type="text" name="name" required />
              </label>
              <label className="block">
                <div className="text-sm text-gray-700">E-mail</div>
                <input className="mt-1 w-full rounded-md border-gray-200 shadow-sm" type="email" name="email" required />
              </label>
              <label className="block">
                <div className="text-sm text-gray-700">Wiadomość</div>
                <textarea className="mt-1 w-full rounded-md border-gray-200 shadow-sm" name="message" rows={5} required />
              </label>
              <div>
                <button type="submit" className="px-5 py-3 rounded-lg bg-[#0B6EFD] text-white font-semibold">Wyślij wiadomość</button>
              </div>
            </form>
          </div>
        </section>
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-8 text-sm text-gray-500">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="font-semibold">AWON</div>
            <div>Administracja wynajmem obiektów noclegowych</div>
            <div className="mt-2">Adres: <span className="text-gray-700">[Twoje dane]</span></div>
          </div>
          <div className="flex gap-6">
            <div>
              <div className="font-medium">Szybkie linki</div>
              <ul className="mt-2"><li><a className="hover:underline" href="/pomoc">Pomoc</a></li></ul>
            </div>
            <div>
              <div className="font-medium">Kontakt</div>
              <div className="mt-2">E: <a className="hover:underline">kontakt@awon.example</a></div>
            </div>
          </div>
        </div>
        <div className="mt-6 text-xs text-gray-400">© {year} AWON — Wszelkie prawa zastrzeżone.</div>
      </footer>
    </div>
  );
}
