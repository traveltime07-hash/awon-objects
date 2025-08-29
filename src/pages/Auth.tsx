import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * AWON — Strona logowania/rejestracji (React + TS)
 * - Zgodna z Twoim HTML/JS: zakładki Logowanie/Rejestracja, odsłanianie hasła,
 *   "Nie pamiętam hasła", walidacja hasła, fetch do /api/auth/*
 * - Po udanym logowaniu: przekierowanie do /app (cookie HttpOnly ustawia backend)
 */

type Tab = "login" | "register";

export default function Auth({ defaultTab = "login" }: { defaultTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(defaultTab);

  // --- login state ---
  const loginEmailRef = useRef<HTMLInputElement | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginShowPw, setLoginShowPw] = useState(false);
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginMsg, setLoginMsg] = useState<{ text: string; ok?: boolean }>({ text: "" });

  // --- register state ---
  const regOrgNameRef = useRef<HTMLInputElement | null>(null);
  const [regOrgName, setRegOrgName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regShowPw, setRegShowPw] = useState(false);
  const [regBusy, setRegBusy] = useState(false);
  const [regMsg, setRegMsg] = useState<{ text: string; ok?: boolean }>({ text: "" });

  // Ustaw tytuł/description
  useEffect(() => {
    document.title = "AWON — Logowanie";
    const content =
      "AWON — logowanie i rejestracja. System do zarządzania rezerwacjami, zadaniami i personelem.";
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = content;
  }, []);

  // Focus po przełączeniu zakładek
  useEffect(() => {
    if (tab === "login") {
      loginEmailRef.current?.focus();
    } else {
      regOrgNameRef.current?.focus();
    }
  }, [tab]);

  // Klawiatura w zakładkach (strzałki)
  const onTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, current: Tab) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      setTab(current === "login" ? "register" : "login");
    }
  };

  // Pomocnicze
  async function safeJson(res: Response) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }
  function isPasswordValid(pw: string) {
    return typeof pw === "string" && pw.length >= 8 && /[0-9]/.test(pw) && /[A-Za-z]/.test(pw);
    // min. 8, litera + cyfra (jak w Twoim skrypcie)
  }

  // "Nie pamiętam hasła"
  async function onForgotPassword(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    if (!loginEmail.trim()) {
      setLoginMsg({ text: "Podaj email.", ok: false });
      loginEmailRef.current?.focus();
      return;
    }
    const a = e.currentTarget;
    (a as any).style.pointerEvents = "none";
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail.trim() }),
      });
      alert(
        res.ok
          ? "Wysłaliśmy link do resetu hasła (jeśli adres istnieje)."
          : "Wystąpił błąd, spróbuj ponownie później."
      );
    } catch {
      alert("Błąd sieci. Spróbuj ponownie.");
    } finally {
      (a as any).style.pointerEvents = "";
    }
  }

  // LOGOWANIE
  async function onLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoginMsg({ text: "" });
    if (!loginEmail.trim() || !loginPassword) {
      setLoginMsg({ text: "Uzupełnij pola.", ok: false });
      return;
    }
    setLoginBusy(true);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ważne: cookie HttpOnly
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword }),
      });
      const data = await safeJson(r);
      if (r.ok) {
        setLoginMsg({ text: "Zalogowano. Trwa przekierowanie…", ok: true });
        const to = (data && data.redirect) || "/app";
        setTimeout(() => (window.location.href = to), 400);
      } else {
        setLoginMsg({ text: (data && data.error) || "Błędny email lub hasło.", ok: false });
      }
    } catch {
      setLoginMsg({ text: "Błąd sieci. Sprawdź połączenie.", ok: false });
    } finally {
      setLoginBusy(false);
    }
  }

  // REJESTRACJA
  async function onRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRegMsg({ text: "" });
    if (!regOrgName.trim() || !regEmail.trim() || !regPassword) {
      setRegMsg({ text: "Uzupełnij wymagane pola.", ok: false });
      return;
    }
    if (!isPasswordValid(regPassword)) {
      setRegMsg({ text: "Hasło musi mieć min. 8 znaków, zawierać literę i cyfrę.", ok: false });
      return;
    }
    setRegBusy(true);
    try {
      const r = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgName: regOrgName.trim(),
          email: regEmail.trim(),
          password: regPassword,
          name: regName.trim() || undefined,
        }),
      });
      const data = await safeJson(r);
      if (r.ok) {
        setRegMsg({ text: "Konto utworzone. Możesz się zalogować.", ok: true });
        setTab("login");
      } else {
        setRegMsg({ text: (data && data.error) || "Nie udało się utworzyć konta.", ok: false });
      }
    } catch {
      setRegMsg({ text: "Błąd sieci. Spróbuj później.", ok: false });
    } finally {
      setRegBusy(false);
    }
  }

  // Klasy komunikatów
  const loginMsgClass = useMemo(
    () => (loginMsg.ok ? "text-emerald-600" : "text-red-600"),
    [loginMsg.ok]
  );
  const regMsgClass = useMemo(() => (regMsg.ok ? "text-emerald-600" : "text-red-600"), [regMsg.ok]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-gray-800">
      <section
        aria-label="Uwierzytelnianie AWON"
        className="mx-auto mt-10 max-w-xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        {/* Zakładki */}
        <nav
          role="tablist"
          aria-label="Formy uwierzytelniania"
          className="mb-4 flex gap-2"
        >
          <button
            id="tab-login"
            role="tab"
            aria-selected={tab === "login"}
            aria-controls="panel-login"
            onClick={() => setTab("login")}
            onKeyDown={(e) => onTabKeyDown(e, "login")}
            className={`rounded-md px-3 py-1.5 text-sm ${
              tab === "login" ? "bg-sky-600 text-white" : "bg-gray-100"
            }`}
          >
            Logowanie
          </button>
          <button
            id="tab-register"
            role="tab"
            aria-selected={tab === "register"}
            aria-controls="panel-register"
            onClick={() => setTab("register")}
            onKeyDown={(e) => onTabKeyDown(e, "register")}
            className={`rounded-md px-3 py-1.5 text-sm ${
              tab === "register" ? "bg-sky-600 text-white" : "bg-gray-100"
            }`}
          >
            Rejestracja
          </button>
        </nav>

        {/* LOGOWANIE */}
        <form
          id="panel-login"
          aria-labelledby="tab-login"
          role="tabpanel"
          aria-hidden={tab !== "login"}
          onSubmit={onLoginSubmit}
          className={tab === "login" ? "" : "hidden"}
          autoComplete="on"
        >
          <label htmlFor="login-email" className="text-sm">
            Email
          </label>
          <input
            ref={loginEmailRef}
            id="login-email"
            name="email"
            type="email"
            required
            inputMode="email"
            autoComplete="email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 p-2"
          />

          <div className="mt-3">
            <label htmlFor="login-password" className="text-sm">
              Hasło
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                id="login-password"
                name="password"
                type={loginShowPw ? "text" : "password"}
                required
                minLength={8}
                autoComplete="current-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="flex-1 rounded-md border border-gray-300 p-2"
              />
              <button
                type="button"
                onClick={() => setLoginShowPw((v) => !v)}
                aria-label="Pokaż/ukryj hasło"
                title="Pokaż/ukryj hasło"
                className="rounded-md border px-2 py-1"
              >
                👁️
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <a href="#" onClick={onForgotPassword} className="text-sm text-sky-700 underline">
              Nie pamiętam hasła
            </a>
            <small className="text-gray-500">min. 8 znaków</small>
          </div>

          <button
            id="login-submit"
            type="submit"
            disabled={loginBusy}
            className="mt-4 w-full rounded-lg bg-teal-600 px-4 py-2 font-medium text-white disabled:opacity-60"
          >
            {loginBusy ? "Logowanie..." : "Zaloguj"}
          </button>

          <p
            id="login-msg"
            role="status"
            aria-live="polite"
            className={`min-h-[1.2em] mt-3 text-sm ${loginMsgClass}`}
          >
            {loginMsg.text}
          </p>
        </form>

        {/* REJESTRACJA */}
        <form
          id="panel-register"
          aria-labelledby="tab-register"
          role="tabpanel"
          aria-hidden={tab !== "register"}
          onSubmit={onRegisterSubmit}
          className={tab === "register" ? "mt-3" : "hidden"}
          autoComplete="on"
        >
          <label htmlFor="reg-orgName" className="text-sm">
            Nazwa organizacji
          </label>
          <input
            ref={regOrgNameRef}
            id="reg-orgName"
            name="orgName"
            required
            minLength={2}
            maxLength={60}
            value={regOrgName}
            onChange={(e) => setRegOrgName(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 p-2"
          />

          <div className="mt-3">
            <label htmlFor="reg-email" className="text-sm">
              Email
            </label>
            <input
              id="reg-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 p-2"
            />
          </div>

          <div className="mt-3">
            <label htmlFor="reg-password" className="text-sm">
              Hasło
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                id="reg-password"
                name="password"
                type={regShowPw ? "text" : "password"}
                required
                minLength={8}
                autoComplete="new-password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className="flex-1 rounded-md border border-gray-300 p-2"
              />
              <button
                type="button"
                onClick={() => setRegShowPw((v) => !v)}
                aria-label="Pokaż/ukryj hasło"
                title="Pokaż/ukryj hasło"
                className="rounded-md border px-2 py-1"
              >
                👁️
              </button>
            </div>
            <small className="mt-1 block text-gray-500">
              Hasło: min 8 znaków, litera + cyfra.
            </small>
          </div>

          <div className="mt-3">
            <label htmlFor="reg-name" className="text-sm">
              Imię (opcjonalnie)
            </label>
            <input
              id="reg-name"
              name="name"
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
              autoComplete="name"
              className="mt-1 w-full rounded-md border border-gray-300 p-2"
            />
          </div>

          <button
            id="reg-submit"
            type="submit"
            disabled={regBusy}
            className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-60"
          >
            {regBusy ? "Tworzę konto..." : "Załóż konto"}
          </button>

          <p
            id="register-msg"
            role="status"
            aria-live="polite"
            className={`min-h-[1.2em] mt-3 text-sm ${regMsgClass}`}
          >
            {regMsg.text}
          </p>
        </form>
      </section>
    </div>
  );
}
