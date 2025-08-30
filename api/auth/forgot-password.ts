export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  // Nie ujawniamy czy email istnieje — zawsze OK
  res.status(200).json({ ok: true });
}
