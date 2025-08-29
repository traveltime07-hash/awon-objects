// src/App.tsx
import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
} from "react-router-dom";

// ⬇️ DOPASUJ DO RZECZYWISTYCH NAZW PLIKÓW W SRC/PAGES
//  - jeśli Twój plik to "src/pages/Obiekty.tsx" lub "src/pages/Obiekty/index.tsx" → OK
//  - jeśli masz inną nazwę (np. TwojeObiekty.tsx albo obiekty.tsx), zmień import poniżej!
import Obiekty from "./pages/Obiekty";     // UWAGA: wielkość liter ma znaczenie
import Kalendarz from "./pages/kalendarz"; // UWAGA: małe „k” jak w repo

function Nav() {
  const loc = useLocation();
  const is = (p: string) => loc.pathname === p;
  return (
    <nav className="flex gap-3 py-3 px-4">
      <Link
        to="/obiekty"
        className={is("/obiekty") ? "font-semibold underline" : ""}
      >
        Twoje obiekty
      </Link>
      <Link
        to="/kalendarz"
        className={is("/kalendarz") ? "font-semibold underline" : ""}
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
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/obiekty" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
