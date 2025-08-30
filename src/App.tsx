// src/App.tsx
import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import Obiekty from "./pages/Obiekty";     // wielkie "O" (tak jak u Ciebie)
import Kalendarz from "./pages/kalendarz"; // małe "k" (tak jak u Ciebie)

// Jeżeli endpoint /api/auth/me nie istnieje (404) lub jest błąd sieci,
// guard nie zablokuje wejścia do aplikacji.
const FAIL_OPEN_WHEN_ME_MISSING = true;

function RequireAuth({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"checking" | "allowed" | "denied">("checking");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/auth/me", { credentials: "include" });
        if (cancelled) return;
        if (r.ok) {
          setStatus("allowed");
        } else if (r.status === 404 && FAIL_OPEN_WHEN_ME_MISSING) {
          // brak endpointu -> nie blokuj
          setStatus("allowed");
        } else if ((r.status === 401 || r.status === 403) && !FAIL_OPEN_WHEN_ME_MISSING) {
          setStatus("denied");
          window.location.href = "/login";
        } else {
          // inne kody — traktuj jako brak autoryzacji, ale „fail-open” jeśli włączony
          setStatus(FAIL_OPEN_WHEN_ME_MISSING ? "allowed" : "denied");
          if (!FAIL_OPEN_WHEN_ME_MISSING) window.location.href = "/login";
        }
      } catch {
        if (cancelled) return;
        setStatus(FAIL_OPEN_WHEN_ME_MISSING ? "allowed" : "denied");
        if (!FAIL_OPEN_WHEN_ME_MISSING) window.location.href = "/login";
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "checking") {
    return (
      <div className="min-h-screen grid place-items-center text-gray-700">
        Sprawdzanie sesji…
      </div>
    );
  }
  return <>{children}</>;
}

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
      <RequireAuth>
        <Nav />
        <Routes>
          <Route path="/" element={<Navigate to="/obiekty" replace />} />
          <Route path="/obiekty" element={<Obiekty />} />
          <Route path="/kalendarz" element={<Kalendarz />} />
          <Route path="*" element={<Navigate to="/obiekty" replace />} />
        </Routes>
      </RequireAuth>
    </BrowserRouter>
  );
}
