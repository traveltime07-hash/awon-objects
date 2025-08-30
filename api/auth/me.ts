import { parseCookies, verifySession } from "../_utils/auth";

export default async function handler(req: any, res: any) {
  const cookies = parseCookies(req);
  const token = cookies["session"];
  const session = verifySession(token);
  if (!session) {
    res.status(401).json({ error: "Brak sesji" });
    return;
  }
  res.status(200).json({ user: { email: session.email, role: session.role } });
}
