// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import Kalendarz from "./pages/kalendarz"; // Twój istniejący kalendarz (nie zmieniamy)

function TopNav() {
  const loc = useLocation();
  const is = (p: string) => loc.pathname === p;
  return (
    <nav className="flex flex-wrap items-center gap-3 border-b bg-white px-4 py-3">
      <Link to="/" className="font-semibold">AWON</Link>
      <div className="flex items-center gap-3 text-sm">
        <Link to="/" className={is("/") ? "underline" : ""}>Strona główna</Link>
        <Link to="/app" className={is("/app") ? "underline" : ""}>Kalendarz</Link>
        <Link to="/admin" className={is("/admin") ? "underline" : ""}>Panel administratora</Link>
        <Link to="/login" className={is("/login") ? "underline" : ""}>Zaloguj</Link>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <TopNav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/app" element={<Kalendarz />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
