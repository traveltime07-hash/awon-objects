// api/health.ts — Edge Function (ESM, bez Node'owych exports)
export const config = { runtime: 'edge' };

export default async function handler(_req: Request): Promise<Response> {
  const body = {
    status: 'ok',
    service: 'awonsystem',
    time: new Date().toISOString(),
    env: (globalThis as any).process?.env?.VERCEL_ENV ?? 'unknown',
    region: (globalThis as any).process?.env?.VERCEL_REGION ?? null,
  };

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}
