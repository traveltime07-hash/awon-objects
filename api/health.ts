export default function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(200).send(
    JSON.stringify({
      status: 'ok',
      service: 'awonsystem',
      time: new Date().toISOString(),
      region: process.env.VERCEL_REGION || 'unknown'
    })
  );
}
