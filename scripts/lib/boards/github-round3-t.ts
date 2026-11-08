// Part T's transcribed GitHub charts. A changed chart requires a fresh two-pass transcription.
import { createHash } from 'node:crypto';

let pending: Promise<unknown> = Promise.resolve();
let last = 0;
export async function checkChart(url: string, sha256: string) {
  const request = pending.catch(() => {}).then(async () => {
    await new Promise(resolve => setTimeout(resolve, Math.max(0, 1050 - (Date.now() - last))));
    last = Date.now();
    const res = await fetch(url, {
      headers: { 'User-Agent': 'benchmark-almanac (+https://benchmarks.brianzhou.org)' },
      redirect: 'error', signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) throw new Error(`Chart HTTP ${res.status}`);
    const bytes = Buffer.from(await res.arrayBuffer());
    if (createHash('sha256').update(bytes).digest('hex') !== sha256) throw new Error('chart changed: transcribe again');
  });
  pending = request;
  await request;
}

export const CHART_TERMS = 'GitHub permits public non-personal research use; raw.githubusercontent.com does not disallow these image paths.';
