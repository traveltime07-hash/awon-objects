import React, { useState } from "react";

/**
 * Formularz logowania/rejestracji bazujący na Twoim wcześniejszym HTML.
 * Endpoints: /api/auth/login, /api/auth/register, /api/auth/forgot-password
 * Używa HttpOnly cookie ustawianego po stronie serwera (credentials: 'include').
 */
export default function Login() {
  const [tab, setTab] = useState<"login" | "register">("login");

  // Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginPwVisible, setLoginPwVisible] = useState(false);
  const [loginMsg, setLoginMsg] = useState<string>("");

  // Register
  const [orgName, setOrgName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPwVisible, setRegPwVisible] = useState(false);
  const [regName, setRegName] = useState("");
  const [regMsg, setRegMsg] = useState<string>("");

  function isPasswordValid(pw: string) {
    return pw.length >= 8 && /[0-9]/.test(pw) && /[A-Za-z]/.test(pw);
  }

  async function safeJson(res: Response) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }

  async function onForgot(e: React.MouseEvent) {
    e.preventDefault();
    if (!loginEmail.trim()) {
      alert("Podaj email.");
      return;
    }
    try {
      const r = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail.trim() }),
      });
      alert(
        r.ok
          ? "Wysłaliśmy link do resetu hasła (jeśli adres istnieje)."
          : "Wystąpił błąd, spróbuj ponownie później."
      );
    } catch {
      alert("Błąd sieci. Spróbuj ponownie.");
    }
  }

  async function onLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoginMsg("");
    if (!loginEmail.trim() || !loginPassword) {
      setLoginMsg("Uzupełnij pola.");
      return;
    }
    const btn = (e.target as HTMLFormElement).querySelector(
      "#login-submit"
    ) as HTMLButtonElement | null;
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Logowanie...";
    }
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword,
        }),
      });
      const data = await safeJson(r);
      if (r.ok) {
        setLoginMsg("Zalogowano. Trwa przekierowanie…");
        setTimeout(() => {
          window.location.href = (data && data.redirect) || "/app/admin";
        }, 400);
      } else {
        setLoginMsg((data && data.error) || "Błędny email lub hasło.");
        if (btn) {
          btn.disabled = false;
          btn.textContent = "Zaloguj";
        }
      }
    } catch {
      setLoginMsg("Błąd sieci. Sprawdź połączenie.");
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Zaloguj";
      }
    }
  }

  async function onRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRegMsg("");
    if (!orgName.trim() || !regEmail.trim() || !regPassword) {
      setRegMsg("Uzupełnij wymagane pola.");
      return;
    }
    if (!isPasswordValid(regPassword)) {
      setRegMsg("Hasło musi mieć min. 8 znaków, zawierać literę i cyfrę.");
      return;
    }
    const btn = (e.target as HTMLFormElement).querySelector(
      "#reg-submit"
    ) as HTMLButtonElement | null;
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Tworzę konto...";
    }
    try {
      const r = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgName: orgName.trim(),
          email: regEmail.trim(),
          password: regPassword,
          name: regName.trim() || undefined,
        }),
      });
      const data = await safeJson(r);
      if (r.ok) {
        setRegMsg("Konto utworzone. Możesz się zalogować.");
        setTab("login");
      } else {
        setRegMsg((data && data.error) || "Nie udało się utworzyć konta.");
        if (btn) {
          btn.disabled = false;
          btn.textContent = "Załóż konto";
        }
      }
    } catch {
      setRegMsg("Błąd sieci. Spróbuj później.");
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Załóż konto";
      }
    }
  }

  return (
    <section
      aria-label="Uwierzytelnianie AWON"
      style={{
        maxWidth: 560,
        margin: "40px auto",
        padding: 24,
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        fontFamily: "system-ui,Segoe UI,Roboto,Arial,sans-serif",
      }}
    >
      <nav
        role="tablist"
        aria-label="Formy uwierzytelniania"
        style={{ display: "flex", gap: 8, marginBottom: 14 }}
      >
        <button
          id="tab-login"
          className="tab"
          role="tab"
          aria-selected={tab === "login"}
          aria-controls="panel-login"
          onClick={() => setTab("login")}
        >
          Logowanie
        </button>
        <button
          id="tab-register"
          className="tab"
          role="tab"
          aria-selected={tab === "register"}
          aria-controls="panel-register"
          onClick={() => setTab("register")}
        >
          Rejestracja
        </button>
      </nav>

      {/* LOGOWANIE */}
      <form
        id="form-login"
        aria-labelledby="tab-login"
        role="tabpanel"
        aria-hidden={tab !== "login"}
        autoComplete="on"
        style={{ display: tab === "login" ? "" : "none" }}
        onSubmit={onLoginSubmit}
      >
        <label htmlFor="login-email">Email</label>
        <br />
        <input
          id="login-email"
          name="email"
          type="email"
          required
          inputMode="email"
          autoComplete="email"
          value={loginEmail}
          onChange={(e) => setLoginEmail(e.target.value)}
          style={{
            width: "100%",
            padding: 8,
            margin: "6px 0",
            borderRadius: 6,
            border: "1px solid #d1d5db",
          }}
        />
        <br />
        <label htmlFor="login-password">Hasło</label>
        <br />
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            id="login-password"
            name="password"
            type={loginPwVisible ? "text" : "password"}
            required
            minLength={8}
            autoComplete="current-password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            style={{
              flex: 1,
              padding: 8,
              margin: "6px 0",
              borderRadius: 6,
              border: "1px solid #d1d5db",
            }}
          />
          <button
            type="button"
            id="login-toggle-pw"
            aria-label="Pokaż hasło"
            title="Pokaż/ukryj hasło"
            onClick={() => setLoginPwVisible((v) => !v)}
          >
            👁️
          </button>
        </div>

        <div
          style={{
            margin: "10px 0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <a href="#" id="forgot-link" onClick={onForgot}>
            Nie pamiętam hasła
          </a>
          <small style={{ color: "#6b7280" }}>min. 8 znaków</small>
        </div>

        <button
          id="login-submit"
          type="submit"
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 8,
            border: 0,
            background: "#0ea5a4",
            color: "white",
          }}
        >
          Zaloguj
        </button>

        <p
          id="login-msg"
          role="status"
          aria-live="polite"
          style={{ minHeight: "1.2em", marginTop: 10, color: "#dc2626" }}
        >
          {loginMsg}
        </p>
      </form>

      {/* REJESTRACJA */}
      <form
        id="form-register"
        aria-labelledby="tab-register"
        role="tabpanel"
        aria-hidden={tab !== "register"}
        style={{ display: tab === "register" ? "" : "none", marginTop: 12 }}
        autoComplete="on"
        onSubmit={onRegisterSubmit}
      >
        <label htmlFor="reg-orgName">Nazwa organizacji</label>
        <br />
        <input
          id="reg-orgName"
          name="orgName"
          required
          minLength={2}
          maxLength={60}
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
          style={{
            width: "100%",
            padding: 8,
            margin: "6px 0",
            borderRadius: 6,
            border: "1px solid #d1d5db",
          }}
        />
        <br />
        <label htmlFor="reg-email">Email</label>
        <br />
        <input
          id="reg-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={regEmail}
          onChange={(e) => setRegEmail(e.target.value)}
          style={{
            width: "100%",
            padding: 8,
            margin: "6px 0",
            borderRadius: 6,
            border: "1px solid #d1d5db",
          }}
        />
        <br />
        <label htmlFor="reg-password">Hasło</label>
        <br />
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            id="reg-password"
            name="password"
            type={regPwVisible ? "text" : "password"}
            required
            minLength={8}
            autoComplete="new-password"
            value={regPassword}
            onChange={(e) => setRegPassword(e.target.value)}
            style={{
              flex: 1,
              padding: 8,
              margin: "6px 0",
              borderRadius: 6,
              border: "1px solid #d1d5db",
            }}
          />
          <button
            type="button"
            id="reg-toggle-pw"
            aria-label="Pokaż hasło"
            title="Pokaż/ukryj hasło"
            onClick={() => setRegPwVisible((v) => !v)}
          >
            👁️
          </button>
        </div>
        <small id="pw-hint" style={{ display: "block", marginBottom: 8, color: "#6b7280" }}>
          Hasło: min 8 znaków, litera + cyfra.
        </small>

        <label htmlFor="reg-name">Imię (opcjonalnie)</label>
        <br />
        <input
          id="reg-name"
          name="name"
          autoComplete="name"
          value={regName}
          onChange={(e) => setRegName(e.target.value)}
          style={{
            width: "100%",
            padding: 8,
            margin: "6px 0",
            borderRadius: 6,
            border: "1px solid #d1d5db",
          }}
        />

        <button
          id="reg-submit"
          type="submit"
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 8,
            border: 0,
            background: "#2563eb",
            color: "white",
          }}
        >
          Załóż konto
        </button>

        <p
          id="register-msg"
          role="status"
          aria-live="polite"
          style={{ minHeight: "1.2em", marginTop: 10, color: "#dc2626" }}
        >
          {regMsg}
        </p>
      </form>
    </section>
  );
}
