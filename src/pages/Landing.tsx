import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-indigo-50 text-gray-900">
      {/* HEADER */}
      <header className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold grid place-items-center">AW</div>
          <div>
            <div className="font-semibold">AWON</div>
            <div className="text-xs text-gray-500">Administracja wynajmem obiektów noclegowych</div>
          </div>
        </div>
        <nav className="flex items-center gap-2">
          <a href="#funkcje" className="px-3 py-2 rounded-xl text-sm text-indigo-700 hover:bg-indigo-100">Funkcje</a>
          <a href="#cennik" className="px-3 py-2 rounded-xl text-sm text-indigo-700 hover:bg-indigo-100">Cennik</a>
          <a href="#kontakt" className="px-3 py-2 rounded-xl text-sm text-indigo-700 hover:bg-indigo-100">Kontakt</a>
          <Link to="/app" className="px-3 py-2 rounded-xl text-sm bg-indigo-600 text-white hover:bg-indigo-700">
            Przejdź do aplikacji
          </Link>
        </nav>
      </header>

      {/* HERO */}
      <main className="mx-auto max-w-6xl px-4 py-10">
        <section className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">
              Bezpłatny system zarządzania dla właścicieli obiektów noclegowych
            </h1>
            <p className="mt-4 text-gray-600">
              AWON — system do zarządzania rezerwacjami, zadaniami i personelem. Podstawowe narzędzia są darmowe; 
              funkcje Premium odblokowują integracje i automatyzacje.
            </p>
            <div className="mt-6 flex gap-3">
              <Link to="/app" className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700">
                Zacznij korzystać
              </Link>
              <a href="#funkcje" className="px-4 py-2 rounded-xl border border-indigo-200 text-indigo-700 font-medium hover:bg-indigo-50">
                Zobacz funkcje
              </a>
            </div>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-6 text-gray-600">
              <li>• Kalendarz rezerwacji</li>
              <li>• Codzienne zadania</li>
              <li>• Baza klientów</li>
              <li>• Zarządzanie wieloma obiektami</li>
            </ul>
          </div>

          <div className="rounded-2xl border bg-white shadow-sm p-4">
            <div className="text-sm text-gray-500 mb-2">Podgląd systemu</div>
            <div className="h-64 rounded-xl border bg-gradient-to-b from-white to-indigo-50 grid place-items-center text-gray-500">
              (tu możesz dodać obraz/zrzut ekranu)
            </div>
            <div className="flex justify-end mt-3">
              <Link to="/app" className="text-sm text-indigo-700 hover:underline">Otwórz aplikację →</Link>
            </div>
          </div>
        </section>

        {/* FUNKCJE */}
        <section id="funkcje" className="mt-16">
          <h2 className="text-xl font-semibold mb-3">Funkcje</h2>
          <div className="rounded-2xl border bg-white shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-indigo-50">
                <tr>
                  <th className="p-3">Funkcja</th>
                  <th className="p-3 text-center">Podstawowy</th>
                  <th className="p-3 text-center">Premium</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Kalendarz rezerwacji", "✔️", "✔️"],
                  ["Codzienne zadania", "✔️", "✔️"],
                  ["Baza klientów", "✔️", "✔️"],
                  ["Zarządzanie wieloma obiektami", "✔️", "✖️"],
                  ["Powiadomienia e-mail", "✔️", "✔️"],
                  ["Synchronizacja Booking/Airbnb", "✖️", "✔️"],
                  ["API / Webhooks", "✖️", "✔️"],
                ].map(([name, basic, pro]) => (
                  <tr key={name} className="border-t">
                    <td className="p-3">{name}</td>
                    <td className="p-3 text-center">{basic}</td>
                    <td className="p-3 text-center">{pro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* CENNIK */}
        <section id="cennik" className="mt-16">
          <h2 className="text-xl font-semibold mb-3">Cennik</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl border bg-white shadow-sm p-4">
              <h3 className="text-lg font-medium">Plan Darmowy</h3>
              <p className="text-sm text-gray-600">0 zł / miesiąc — podstawowe narzędzia.</p>
              <ul className="mt-3 text-gray-600 list-disc pl-5">
                <li>Kalendarz rezerwacji</li>
                <li>Codzienne zadania</li>
                <li>Baza klientów</li>
              </ul>
            </div>
            <div className="rounded-2xl border bg-white shadow-sm p-4">
              <h3 className="text-lg font-medium">Plan Premium</h3>
              <p className="text-sm text-gray-600">Integracje i automatyzacje.</p>
              <ul className="mt-3 text-gray-600 list-disc pl-5">
                <li>Synchronizacja z Booking/Airbnb</li>
                <li>API / Webhooks</li>
                <li>Zaawansowane raporty</li>
              </ul>
              <div className="mt-4">
                <Link to="/app" className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700">
                  Wypróbuj Premium – 30 dni
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* KONTAKT */}
        <section id="kontakt" className="mt-16">
          <h2 className="text-xl font-semibold mb-3">Kontakt</h2>
          <div className="rounded-2xl border bg-white shadow-sm p-4">
            <form className="grid md:grid-cols-2 gap-4">
              <label className="text-sm">
                Imię i nazwisko
                <input className="mt-1 w-full p-2 border rounded-xl" placeholder="Jan Kowalski" />
              </label>
              <label className="text-sm">
                E-mail
                <input type="email" className="mt-1 w-full p-2 border rounded-xl" placeholder="jan@example.com" />
              </label>
              <label className="text-sm md:col-span-2">
                Wiadomość
                <textarea rows={4} className="mt-1 w-full p-2 border rounded-xl" placeholder="Napisz wiadomość…" />
              </label>
              <div>
                <button type="button" onClick={() => alert("Wysłano (mock)")}
                        className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700">
                  Wyślij
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="mx-auto max-w-6xl px-4 py-8 text-sm text-gray-500">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>© {new Date().getFullYear()} AWON — Wszelkie prawa zastrzeżone.</div>
          <div>kontakt@awon.example</div>
        </div>
      </footer>
    </div>
  );
}
