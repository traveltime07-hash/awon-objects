// src/pages/Landing.tsx
import React, { useState, useEffect, useCallback } from "react";

declare global {
  interface Window {
    AWON_GALLERY_IMAGES?: string[];
  }
}

export default function Landing() {
  const year = new Date().getFullYear();

  // Ikonki:
  function CheckIcon() {
    return (
      <svg
        className="inline-block h-6 w-6 text-green-600"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path
          d="M5 13l4 4L19 7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  function CrossIcon() {
    return (
      <svg
        className="inline-block h-6 w-6 text-red-600"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path
          d="M18 6L6 18M6 6l12 12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // Smooth scroll do sekcji
  const smoothScroll = useCallback((id: string) => {
    if (typeof document === "undefined") return;
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // 🔑 Przyciski mają kierować do /app/*
  const onNavigateLogin = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault?.();
    if (typeof window !== "undefined") window.location.href = "/app/login";
  }, []);

  // na razie kierujemy do /app/login (można później zrobić /app/rejestracja)
  const onNavigateRegister = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault?.();
    if (typeof window !== "undefined") window.location.href = "/app/login";
  }, []);

  /* ---------- Galeria (mock) ---------- */
  function Gallery() {
    const [images, setImages] = useState<string[]>([]);
    const [idx, setIdx] = useState(0);

    useEffect(() => {
      if (typeof window === "undefined") return;
      const imgs = Array.isArray(window.AWON_GALLERY_IMAGES)
        ? window.AWON_GALLERY_IMAGES
        : [];
      if ((!imgs || imgs.length === 0) && window.localStorage) {
        try {
          const stored = window.localStorage.getItem("AWON_GALLERY_IMAGES");
          const parsed = stored ? (JSON.parse(stored) as string[]) : [];
          setImages(parsed || []);
          return;
        } catch {
          setImages([]);
          return;
        }
      }
      setImages(imgs || []);
    }, []);

    useEffect(() => {
      if (!images || images.length === 0) return;
      const t = setInterval(() => setIdx((i) => (i + 1) % images.length), 4000);
      return () => clearInterval(t);
    }, [images]);

    if (!images || images.length === 0) {
      return (
        <div className="flex h-64 w-full items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
          <div className="text-gray-400">
            Brak zrzutów — dodaj je w panelu administratora
          </div>
        </div>
      );
    }

    return (
      <div className="w-full">
        <div className="flex h-64 w-full items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
          <img
            src={images[idx]}
            alt={`Screenshot ${idx + 1}`}
            className="h-full w-full object-cover"
          />
        </div>

        {images.length > 1 && (
          <div className="mt-3 flex items-center justify-center gap-3">
            <button
              onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}
              className="rounded bg-white px-3 py-1 border"
            >
              ◀
            </button>
            <div className="flex items-center gap-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  aria-label={`Pokaż ${i + 1}`}
                  className={`h-3 w-3 rounded-full ${
                    i === idx ? "bg-[#0B6EFD]" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={() => setIdx((i) => (i + 1) % images.length)}
              className="rounded bg-white px-3 py-1 border"
            >
              ▶
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ---------- AdminUploader (mock) ---------- */
  function AdminUploader({ onDone }: { onDone?: () => void }) {
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

        const urls = await Promise.all(files.map((f) => readFile(f)));

        if (typeof window !== "undefined" && window.localStorage) {
          const prev = window.localStorage.getItem("AWON_GALLERY_IMAGES");
          const arr = prev ? (JSON.parse(prev) as string[]) : [];
          const merged = [...arr, ...urls];
          window.localStorage.setItem(
            "AWON_GALLERY_IMAGES",
            JSON.stringify(merged)
          );
          window.AWON_GALLERY_IMAGES = merged;
        }

        setMessage("Zapisano zdjęcia (mock).");
        window.dispatchEvent(new Event("AWON_GALLERY_UPDATED"));
        setFiles([]);
        onDone?.();
      } catch (err) {
        console.error(err);
        setMessage("Błąd podczas wgrywania.");
      } finally {
        setUploading(false);
      }
    };

    return (
      <div className="mt-6 rounded bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <div className="font-medium">Panel administratora (demo)</div>
          <button
            onClick={() => onDone?.()}
            className="text-sm text-gray-600"
          >
            Zamknij
          </button>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3">
          <input type="file" multiple accept="image/*" onChange={onSelect} />
          <div className="flex gap-2">
            <button
              onClick={onUpload}
              disabled={uploading}
              className="rounded bg-[#0B6EFD] px-4 py-2 text-white"
            >
              {uploading ? "Wgrywanie..." : "Wgraj (mock)"}
            </button>
            <button
              onClick={() => {
                setFiles([]);
                setMessage("");
              }}
              className="rounded border px-4 py-2"
            >
              Wyczyść
            </button>
          </div>
          <div className="text-sm text-gray-600">
            {files.length} plik(ów) wybrano.
          </div>
          {message && <div className="text-sm text-green-600">{message}</div>}
        </div>
      </div>
    );
  }

  const [isAdminOpen, setIsAdminOpen] = useState(false);

  useEffect(() => {
    const handler = () => {
      // placeholder do ewentualnego odświeżenia
    };
    window.addEventListener("AWON_GALLERY_UPDATED", handler);
    return () => window.removeEventListener("AWON_GALLERY_UPDATED", handler);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title =
        "AWON — system do zarządzania rezerwacjami, zadaniami i personelem";
      const content =
        "AWON — system do zarządzania rezerwacjami, zadaniami i personelem. " +
        "Korzystanie z podstawowych narzędzi jest całkowicie bezpłatne; " +
        "dodatkowe płatne funkcje są bardziej zaawansowane i możesz je włączyć w koncie Premium.";
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) (metaDesc as HTMLMetaElement).content = content;
      else {
        const m = document.createElement("meta");
        m.name = "description";
        m.content = content;
        document.head.appendChild(m);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-gray-800">
      {/* HEADER */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#0B6EFD] font-bold text-white">
            AW
          </div>
          <div>
            <h1 className="text-lg font-semibold">AWON</h1>
            <div className="text-sm text-gray-500">
              Administracja wynajmem obiektów noclegowych
            </div>
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
          <button
            onClick={onNavigateLogin}
            className="inline-block rounded-lg bg-[#0B6EFD] px-4 py-2 text-sm font-medium text-white"
          >
            Zaloguj
          </button>
          <button
            onClick={onNavigateRegister}
            className="ml-2 inline-block rounded-lg bg-[#0B6EFD] px-4 py-2 text-sm font-medium text-white"
          >
            Załóż bezpłatne konto
          </button>
        </nav>
      </header>

      {/* HERO */}
      <main>
        <section className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-6 py-12 md:grid-cols-2">
          <div>
            <h2 className="text-4xl font-extrabold leading-tight md:text-5xl">
              Bezpłatny system zarządzania dla właścicieli obiektów noclegowych
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              AWON — system do zarządzania rezerwacjami, zadaniami i personelem.
              Korzystanie z podstawowych narzędzi jest całkowicie bezpłatne;
              dodatkowe płatne funkcje są bardziej zaawansowane i możesz je
              włączyć w koncie Premium.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                onClick={onNavigateRegister}
                className="rounded-lg bg-[#0B6EFD] px-6 py-3 font-semibold text-white"
              >
                Korzystaj za darmo
              </button>
              <button
                onClick={() => smoothScroll("features")}
                className="rounded-lg border border-gray-200 px-6 py-3 text-sm"
              >
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

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setIsAdminOpen(true)}
                  className="rounded bg-gray-100 px-3 py-2 text-sm"
                >
                  Otwórz panel administratora
                </button>
              </div>

              {isAdminOpen && <AdminUploader onDone={() => setIsAdminOpen(false)} />}
            </div>
          </div>
        </section>

        {/* FUNKCJE */}
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
                  <td className="px-4 py-3 text-center">
                    <CheckIcon />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <CheckIcon />
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-3">Codzienne zadania (sprzątanie, naprawy)</td>
                  <td className="px-4 py-3 text-center">
                    <CheckIcon />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <CheckIcon />
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-3">Baza klientów (historia rezerwacji)</td>
                  <td className="px-4 py-3 text-center">
                    <CheckIcon />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <CheckIcon />
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-3">Zarządzanie wieloma obiektami</td>
                  <td className="px-4 py-3 text-center">
                    <CheckIcon />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <CrossIcon />
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-3">
                    Synchronizacja z innymi serwisami (Booking, Airbnb)
                  </td>
                  <td className="px-4 py-3 text-center">
                    <CrossIcon />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <CheckIcon />
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-3">API / Webhooks</td>
                  <td className="px-4 py-3 text-center">
                    <CrossIcon />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <CheckIcon />
                  </td>
                </tr>
              </tbody>
            </table>

            <p className="mt-4 text-xs text-gray-500">
              Legenda: zielone ✓ oznacza dostępne w podstawowym planie, czerwone ✕
              oznacza, że funkcja jest dostępna tylko w rozszerzonej wersji.
            </p>
          </div>
        </section>

        {/* CENNIK */}
        <section id="cennik" className="mx-auto max-w-7xl px-6 py-12">
          <h3 className="text-2xl font-semibold">Cennik — co zyskujesz wybierając Premium</h3>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h4 className="font-semibold">Plan Darmowy</h4>
              <p className="mt-2 text-sm text-gray-600">
                0 zł / miesiąc — podstawowe narzędzia do prowadzenia obiektu.
              </p>
              <ul className="mt-4 list-inside list-disc text-sm text-gray-700">
                <li>Kalendarz rezerwacji</li>
                <li>Codzienne zadania i harmonogram sprzątania</li>
                <li>Baza klientów</li>
              </ul>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h4 className="font-semibold">Plan Premium</h4>
              <p className="mt-2 text-sm text-gray-600">
                Więcej automatyzacji i integracji — idealne przy większej liczbie
                obiektów.
              </p>
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
                <button
                  onClick={onNavigateRegister}
                  className="inline-block rounded-lg bg-[#0B6EFD] px-5 py-3 font-semibold text-white"
                >
                  Wypróbuj Premium — 30 dni za darmo
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* KONTAKT */}
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
                <input
                  className="mt-1 w-full rounded-md border-gray-200 shadow-sm"
                  type="text"
                  name="name"
                  required
                />
              </label>

              <label className="block">
                <div className="text-sm text-gray-700">E-mail</div>
                <input
                  className="mt-1 w-full rounded-md border-gray-200 shadow-sm"
                  type="email"
                  name="email"
                  required
                />
              </label>

              <label className="block">
                <div className="text-sm text-gray-700">Wiadomość</div>
                <textarea
                  className="mt-1 w-full rounded-md border-gray-200 shadow-sm"
                  name="message"
                  rows={5}
                  required
                />
              </label>

              <div>
                <button
                  type="submit"
                  className="rounded-lg bg-[#0B6EFD] px-5 py-3 font-semibold text-white"
                >
                  Wyślij wiadomość
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>

      {/* FOOTER */}
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

        <div className="mt-6 text-xs text-gray-400">
          © {year} AWON — Wszelkie prawa zastrzeżone.
        </div>
      </footer>
    </div>
  );
}
