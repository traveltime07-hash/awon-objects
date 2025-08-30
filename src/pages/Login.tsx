// src/pages/Login.tsx
import React, { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("traveltime07@gmail.com"); // podpowiedź
  const [password, setPassword] = useState("12345678aA");       // podpowiedź
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError((data && (data.message || data.error)) || "Nieprawidłowe dane logowania");
        return;
      }

      // jeśli endpoint zwraca token/user — zapisz (opcjonalnie)
      if (data?.token) localStorage.setItem("awon_token", data.token);
      if (data?.user)  localStorage.setItem("awon_user", JSON.stringify(data.user));

      // po zalogowaniu nawigujemy do kalendarza lub obiektów
      window.location.href = "/app/kalendarz";
    } catch (err: any) {
      setError("Problem z połączeniem. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="mb-4 text-xl font-semibold">Logowanie administratora</h1>
      <form onSubmit={onSubmit} className="space-y-3 rounded-xl border bg-white p-4 shadow-sm">
        <label className="block">
          <div className="text-sm text-gray-600">E-mail</div>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="email"
          />
        </label>

        <label className="block">
          <div className="text-sm text-gray-600">Hasło</div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="hasło"
          />
        </label>

        {error && <div className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Logowanie…" : "Zaloguj"}
        </button>
      </form>

      <p className="mt-4 text-sm text-gray-500">
        Po zalogowaniu przejdziesz do aplikacji (sekcja <span className="font-medium">/app</span>).
      </p>
    </div>
  );
}
