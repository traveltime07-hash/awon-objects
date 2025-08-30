export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  // Demo: akceptujemy wszystko, ale faktycznie nic nie tworzymy
  await readBody(req);
  res.status(200).json({ ok: true, message: "Rejestracja włączona w trybie demo. Zaloguj się." });
}

function readBody(req: any) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c: any) => (data += c));
    req.on("end", () => resolve(data));
  });
}
