import React, { useState } from "react";

type LoginResponse =
  | { ok: true; user?: { email?: string; role?: string } }
  | { ok: false; message?: string };

export default function Login() {
  const [email, setEmail] = useState("traveltime07@gmail.com");
  const [password, setPassword] = useState("12345678aA");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = (await res.json()) as LoginResponse;

      if (!res.ok || !("ok" in data) || !data.ok) {
        const msg =
          (data as any)?.message ||
          "Błędny login lub hasło. Spróbuj ponownie.";
        setErr(msg);
        return;
      }

      // Po udanym logowaniu serwer ustawia httpOnly cookie.
      // Sprawdzamy rolę i przekierowujemy.
      const role = (data as any)?.user?.role;

      // Projekt działa z <BrowserRouter basename="/app">,
      // więc ścieżki SPA mają prefiks /app
      const go = (p: string) => {
        const withBase = p.startsWith("/app") ? p : "/app" + p;
        window.location.href = withBase;
      };

      if (role === "admin") {
        go("/admin");
      } else {
        // zwykły właściciel -> jego panel obiektu
        go("/obiekty");
      }
    } catch (e) {
      console.error(e);
      setErr("Nie udało się połączyć z serwerem.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border bg-white p-6 shadow-md">
        <div className="mb-4">
          <div className="text-lg font-semibold">Zaloguj się</div>
          <div className="text-sm text-gray-500">
            Podaj e-mail i hasło do panelu.
          </div>
        </div>

        <form onSubmit={submit} className="grid gap-3">
          <label className="grid gap-1">
            <span className="text-sm text-gray-600">E-mail</span>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm"
              required
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm text-gray-600">Hasło</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm"
              required
            />
          </label>

          {err && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {err}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Logowanie…" : "Zaloguj"}
          </button>
        </form>

        <div className="mt-4 text-xs text-gray-500">
          Po zalogowaniu użytkownik z rolą <b>admin</b> trafia do{" "}
          <code>/app/admin</code>, pozostali do <code>/app/obiekty</code>.
        </div>
      </div>
    </div>
  );
}
