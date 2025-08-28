import React from "react";
import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 text-slate-900">
      <header className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white grid place-items-center font-bold">
            AW
          </div>
          <div>
            <div className="font-semibold">AWON</div>
            <div className="text-xs text-slate-500">Administracja wynajmem</div>
          </div>
        </div>
        <nav className="flex gap-2">
          <Link
            to="/app"
            className="px-3 py-2 rounded-lg bg-indigo-600 text-white font-medium"
          >
            Przejdź do aplikacji
          </Link>
          <a
            href="https://github.com/traveltime07-hash/awon-objects"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 rounded-lg border border-indigo-200 text-indigo-700 font-medium"
          >
            Repozytorium
          </a>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-2 gap-8 items-center">
        <section>
          <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">
            Bezpłatny system do zarządzania rezerwacjami, zadaniami i personelem
          </h1>
          <p className="mt-3 text-slate-600">
            AWON pomaga prowadzić obiekty noclegowe: kalendarz rezerwacji,
            codzienne zadania, baza klientów, role i uprawnienia – a to dopiero
            początek.
          </p>
          <div className="mt-5 flex gap-3">
            <Link
              to="/app"
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold"
            >
              Otwórz aplikację
            </Link>
            <a
              href="https://github.com/traveltime07-hash/awon-objects"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl border border-indigo-200 text-indigo-700 font-semibold"
            >
              Zobacz kod
            </a>
          </div>

          <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
            <li>• Kalendarz rezerwacji</li>
            <li>• Codzienne zadania</li>
            <li>• Baza klientów</li>
            <li>• Role i uprawnienia zespołu</li>
          </ul>
        </section>

        <section>
          <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
            <div className="text-sm text-slate-500 mb-2">Podgląd</div>
            <div className="aspect-video rounded-xl border bg-slate-50 grid place-items-center">
              <span className="text-slate-400">Zrzut ekranu wkrótce 😉</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="max-w-6xl mx-auto px-4 py-6 text-sm text-slate-500 flex items-center justify-between">
        <div>© {new Date().getFullYear()} AWON</div>
        <div>kontakt@awon.example</div>
      </footer>
    </div>
  );
}
