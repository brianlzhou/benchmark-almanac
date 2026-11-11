// MiniMax Role-play Benchmark overall score with worlds, stories and preferences components.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://huggingface.co/datasets/MiniMaxAI/role-play-bench/resolve/main/README.md";
const board: Leaderboard = {
 benchmark: "role-play-bench-minimax",
 url: "https://huggingface.co/datasets/MiniMaxAI/role-play-bench",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  const t = markdownTables(await fetchText(FEED)).find(t=>t[0].includes('Overall'));
  if (!t) throw new Error('role-play-bench-minimax table missing');
  const rows = t.slice(1).filter(r=>r[1] && num(r[2])!==undefined).map(r=>{
    const effort = r[1].match(/-(high|low)thinking$/);
    const metrics: Record<string,number> = {};
    for (const [key, column] of [['overall', 2], ['worlds', 4], ['stories', 6], ['preferences', 8]] as const) {
      const score = num(r[column]);
      if (key !== 'overall' && score !== undefined) metrics[key] = score;
      const interval = r[column+1]?.match(/\[([\d.]+),\s*([\d.]+)\]/);
      if (interval) {
        metrics[key+'CiLow'] = Number(interval[1]);
        metrics[key+'CiHigh'] = Number(interval[2]);
      }
    }
    return {model:r[1].replace(/-(high|low)thinking$/, ''), score:num(r[2])!,
      setting:effort ? effort[1]+' thinking' : undefined, metrics};
  });
  if (!rows.length) throw new Error('role-play-bench-minimax has no scored rows');
  return rows;
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
