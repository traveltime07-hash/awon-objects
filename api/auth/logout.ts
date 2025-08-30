import { clearSessionCookie } from "../_utils/auth";

export default function handler(req: any, res: any) {
  clearSessionCookie(res);
  res.status(200).json({ ok: true });
}
