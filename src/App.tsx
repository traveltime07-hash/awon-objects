import React from "react";
import { HashRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import Kalendarz from "./pages/Kalendarz";

function Home() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold">AWON</h1>
        <p className="mt-2 text-gray-600">
          Przejdź do kalendarza rezerwacji.
        </p>
        <div className="mt-4">
          <Link
            to="/app/kalendarz"
            className="inline-block rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Otwórz kalendarz
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/app" element={<Navigate to="/app/kalendarz" replace />} />
        <Route path="/app/kalendarz" element={<Kalendarz />} />
        <Route path="*" element={<Navigate to="/app/kalendarz" replace />} />
      </Routes>
    </HashRouter>
  );
}
