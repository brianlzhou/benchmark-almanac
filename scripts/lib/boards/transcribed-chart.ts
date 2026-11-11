// Scores transcribed from chart images, guarded by the image hash. A changed image requires two new transcription passes.
import { createHash } from 'node:crypto';
import type { LeaderboardRow } from '../../leaderboards/types.ts';
export async function chartRows(url:string, expected:string, rows:LeaderboardRow[]):Promise<LeaderboardRow[]> {
 const res=await fetch(url,{headers:{'user-agent':'benchmark-almanac (+https://github.com/brianlzhou/benchmark-almanac)'},signal:AbortSignal.timeout(60000)});
 if(!res.ok)throw new Error(`chart fetch: ${res.status} ${url}`);
 const actual=createHash('sha256').update(Buffer.from(await res.arrayBuffer())).digest('hex');
 if(actual!==expected)throw new Error('chart changed: transcribe again');
 return rows.map(r=>({...r,metrics:r.metrics?{...r.metrics}:undefined}));
}
