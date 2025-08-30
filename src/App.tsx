// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import Obiekty from "./pages/Obiekty";      // DUŻE „O” — tak jak w repo
import Kalendarz from "./pages/kalendarz";  // małe „k” — tak jak w repo
import Login from "./pages/Login";

function Nav() {
  const loc = useLocation();
  const is = (p: string) => loc.pathname === p;
  return (
    <nav className="flex flex-wrap items-center gap-3 px-4 py-3 border-b bg-white">
      <Link to="/obiekty"   className={is("/obiekty")   ? "font-semibold underline" : ""}>Twoje obiekty</Link>
      <Link to="/kalendarz" className={is("/kalendarz") ? "font-semibold underline" : ""}>Kalendarz</Link>
      <span className="mx-2 text-gray-300">|</span>
      <Link to="/login"     className={is("/login")     ? "font-semibold underline" : ""}>Zaloguj</Link>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter basename="/app">
      <Nav />
      <Routes>
        <Route path="/" element={<Navigate to="/obiekty" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/obiekty" element={<Obiekty />} />
        <Route path="/kalendarz" element={<Kalendarz />} />
        <Route path="*" element={<Navigate to="/obiekty" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
