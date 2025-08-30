// api/health.ts  — ESM, Vercel Node Function
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Prosty healthcheck dla monitoringu i testów
  res.status(200).json({
    status: 'ok',
    service: 'awonsystem',
    time: new Date().toISOString(),
    env: process.env.VERCEL_ENV ?? 'unknown',
    region: process.env.VERCEL_REGION ?? null,
  });
}
