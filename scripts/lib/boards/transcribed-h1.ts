// Fail closed if the source image differs from the two-pass transcription.
import { createHash } from 'node:crypto';
import type { LeaderboardRow } from '../../leaderboards/types.ts';
export async function checkedImageRows(url: string, sha256: string, rows: LeaderboardRow[]): Promise<LeaderboardRow[]> {
  const response = await fetch(url, {headers: {'user-agent':'benchmark-almanac (+https://github.com/brianlzhou/benchmark-almanac)'},signal:AbortSignal.timeout(60000)});
  if (!response.ok) throw new Error(`chart download failed: ${response.status}`);
  const digest = createHash('sha256').update(new Uint8Array(await response.arrayBuffer())).digest('hex');
  if (digest !== sha256) throw new Error('chart changed: transcribe again');
  return rows.map(r=>({...r, ...(r.metrics ? {metrics:{...r.metrics}} : {})}));
}
