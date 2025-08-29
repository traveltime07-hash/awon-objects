// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import Obiekty from "./pages/Obiekty";      // UWAGA: wielkie „O”
import Kalendarz from "./pages/kalendarz";  // UWAGA: małe „k” – tak jak Twój plik

function Nav() {
  const loc = useLocation();
  const is = (p: string) => loc.pathname === p;
  return (
    <nav className="flex gap-3 py-3 px-4">
      <Link to="/obiekty"   className={is("/obiekty")   ? "font-semibold underline" : ""}>Twoje obiekty</Link>
      <Link to="/kalendarz" className={is("/kalendarz") ? "font-semibold underline" : ""}>Kalendarz</Link>
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
