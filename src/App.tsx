// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import Obiekty from "./pages/Obiekty";     // UWAGA: wielkie „O”
import Kalendarz from "./pages/Kalendarz"; // UWAGA: wielkie „K” — jak Twój plik

function Nav() {
  const loc = useLocation();
  const is = (p: string) => loc.pathname === p;
  return (
    <nav className="flex flex-wrap items-center gap-4 border-b px-4 py-3">
      <Link
        to="/obiekty"
        className={`text-sm ${is("/obiekty") ? "font-semibold underline" : "text-gray-700 hover:underline"}`}
      >
        Twoje obiekty
      </Link>
      <Link
        to="/kalendarz"
        className={`text-sm ${is("/kalendarz") ? "font-semibold underline" : "text-gray-700 hover:underline"}`}
      >
        Kalendarz
      </Link>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter basename="/app">
      <Nav />
      <Routes>
        <Route path="/" element={<Navigate to="/obiekty" replace />} />
        <Route path="/obiekty" element={<Obiekty />} />
        <Route path="/kalendarz" element={<Kalendarz />} />
        <Route path="*" element={<Navigate to="/obiekty" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
