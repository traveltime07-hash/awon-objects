import { clearSessionCookie, parseCookies, setSessionCookie } from "../_utils/auth";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { email, password } = req.body || (await getJson(req));
    if (!email || !password) {
      res.status(400).json({ error: "Uzupełnij email i hasło." });
      return;
    }

    // Demo: sztywne konto admina (wg Twoich danych)
    const ok =
      String(email).toLowerCase() === "traveltime07@gmail.com" &&
      String(password) === "12345678aA";

    if (!ok) {
      // ewentualne czyszczenie starego ciasteczka
      clearSessionCookie(res);
      res.status(401).json({ error: "Błędny email lub hasło." });
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    setSessionCookie(res, { email: "traveltime07@gmail.com", role: "admin", exp: now + 60 * 60 * 24 * 7 });

    res.status(200).json({ ok: true, redirect: "/app/admin" });
  } catch (e) {
    res.status(500).json({ error: "Błąd serwera podczas logowania." });
  }
}

async function getJson(req: any) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c: any) => (data += c));
    req.on("end", () => {
      try {
        resolve(JSON.parse(data || "{}"));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}
