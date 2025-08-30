import React, { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  Outlet,
} from "react-router-dom";

import Landing from "./pages/Landing";          // <- Twoja strona główna
import Login from "./pages/Login";              // <- ekran logowania
import Obiekty from "./pages/Obiekty";          // <- właściciel
import Kalendarz from "./pages/kalendarz";      // <- właściciel
import AdminOwnerPanel from "./pages/AdminOwnerPanel"; // <- panel admina

type MeResponse =
  | { ok: true; user: { email: string; role?: string } }
  | { ok: false };

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
  if (state === "loading")
    return (
      <div className="min-h-screen grid place-items-center text-gray-500">
        Sprawdzanie sesji…
      </div>
    );
  if (state === "nope") return <Navigate to="/app/login" replace />;
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"loading" | "ok" | "nope">("loading");
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/auth/me", { credentials: "include" });
        const data = (await r.json()) as MeResponse;
        if (r.ok && (data as any)?.ok && data.user?.role === "admin")
          setState("ok");
        else setState("nope");
      } catch {
        setState("nope");
      }
    })();
  }, []);
  if (state === "loading")
    return (
      <div className="min-h-screen grid place-items-center text-gray-500">
        Sprawdzanie uprawnień…
      </div>
    );
  if (state === "nope") return <Navigate to="/app/login" replace />;
  return <>{children}</>;
}

function Nav() {
  return (
    <nav className="flex gap-3 py-3 px-4">
      <Link to="/app/obiekty" className="hover:underline">
        Twoje obiekty
      </Link>
      <Link to="/app/kalendarz" className="hover:underline">
        Kalendarz
      </Link>
      <Link to="/app/admin" className="hover:underline">
        Admin
      </Link>
    </nav>
  );
}

function AppLayout() {
  // layout dla części /app/*
  return (
    <div>
      <Nav />
      <Outlet />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* landing na root */}
        <Route path="/" element={<Landing />} />

        {/* logowanie (bez nawigacji) */}
        <Route path="/app/login" element={<Login />} />

        {/* część wymaga zalogowania */}
        <Route
          path="/app"
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/app/obiekty" replace />} />
          <Route path="obiekty" element={<Obiekty />} />
          <Route path="kalendarz" element={<Kalendarz />} />
          <Route
            path="admin"
            element={
              <RequireAdmin>
                <AdminOwnerPanel />
              </RequireAdmin>
            }
          />
        </Route>

        {/* fallbacki */}
        <Route path="/app/*" element={<Navigate to="/app/obiekty" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
