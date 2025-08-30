import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import Kalendarz from "./pages/kalendarz"; // ← dostosuj do nazwy pliku

function Nav() {
  const loc = useLocation();
  const is = (p: string) => loc.pathname === p;
  return (
    <nav className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
      <Link to="/" className={is("/app/") || is("/") ? "font-semibold underline" : ""}>
        Strona główna
      </Link>
      <Link to="/kalendarz" className={is("/kalendarz") ? "font-semibold underline" : ""}>
        Kalendarz
      </Link>
      <span className="mx-2 text-gray-300">|</span>
      <Link to="/admin" className={is("/admin") ? "font-semibold underline" : ""}>
        Panel administratora
      </Link>
      <Link to="/login" className="ml-auto">
        Zaloguj
      </Link>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter basename="/app">
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/kalendarz" element={<Kalendarz />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
