// src/App.tsx
import React, { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
} from "react-router-dom";

import Obiekty from "./pages/Obiekty";
import Kalendarz from "./pages/kalendarz";
import Login from "./pages/Login";
import AdminOwnerPanel from "./pages/AdminOwnerPanel";

type MeResponse =
  | { ok: true; user: { email: string; role?: string } }
  | { ok: false };

function Nav() {
  const loc = useLocation();
  const is = (p: string) => loc.pathname === p || loc.pathname === "/app" + p;
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
      <Link to="/admin" className={is("/admin") ? "font-semibold underline" : ""}>
        Admin
      </Link>
    </nav>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"loading" | "ok" | "nope">("loading");

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/auth/me", { credentials: "include" });
        const data = (await r.json()) as MeResponse;
        setState(r.ok && (data as any)?.ok ? "ok" : "nope");
      } catch {
        setState("nope");
      }
    })();
  }, []);

  if (state === "loading") {
    return (
      <div className="min-h-screen grid place-items-center text-gray-500">
        Sprawdzanie sesji…
      </div>
    );
  }
  if (state === "nope") {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"loading" | "ok" | "nope">("loading");

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/auth/me", { credentials: "include" });
        const data = (await r.json()) as MeResponse;
        if (r.ok && (data as any)?.ok && data.user?.role === "admin") {
          setState("ok");
        } else {
          setState("nope");
        }
      } catch {
        setState("nope");
      }
    })();
  }, []);

  if (state === "loading") {
    return (
      <div className="min-h-screen grid place-items-center text-gray-500">
        Sprawdzanie uprawnień…
      </div>
    );
  }
  if (state === "nope") {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter basename="/app">
      <Nav />
      <Routes>
        {/* public */}
        <Route path="/login" element={<Login />} />

        {/* private (wymaga sesji) */}
        <Route
          path="/obiekty"
          element={
            <RequireAuth>
              <Obiekty />
            </RequireAuth>
          }
        />
        <Route
          path="/kalendarz"
          element={
            <RequireAuth>
              <Kalendarz />
            </RequireAuth>
          }
        />

        {/* admin-only */}
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminOwnerPanel />
            </RequireAdmin>
          }
        />

        {/* domyślne przekierowania */}
        <Route path="/" element={<Navigate to="/obiekty" replace />} />
        <Route path="*" element={<Navigate to="/obiekty" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
