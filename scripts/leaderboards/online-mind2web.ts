// Online-Mind2Web: human-evaluated Average SR over all 300 tasks.
// The human leaderboard is the reference evaluation. Easy, Medium and Hard are metrics.
// The scaffold is the harness. Evaluator agreement tables measure a different task and are excluded.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const FEED = "https://huggingface.co/spaces/osunlp/Online_Mind2Web_Leaderboard/raw/main/human_Mind2Web-Online%20-%20Leaderboard_data.csv";
const board: Leaderboard = {
  benchmark: "online-mind2web",
  url: "https://huggingface.co/spaces/osunlp/Online_Mind2Web_Leaderboard",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {
      const clean=(s:string)=>s.replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').trim();
      return parseCsv(await fetchText(FEED)).filter(r=>num(r['Average SR'])!==undefined).map(r=>({model:clean(r.Model),harness:clean(r.Agent),score:num(r['Average SR'])!,date:r.Date?.split('-').map((p,i)=>i?p.padStart(2,'0'):p).join('-'),metrics:{easy:num(r.Easy)!,medium:num(r.Medium)!,hard:num(r.Hard)!}}));
    })();
    if (!rows.length) throw new Error('No whole-benchmark scores found');
    const seen = new Set<string>();
    for (const r of rows) {
      if (!r.model || !Number.isFinite(r.score)) throw new Error('Invalid model or score');
      if (r.score < 0 || r.score > 100) throw new Error('Score outside percent range');
      if (/^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model)) r.model += ' (snapshot unspecified)';
      const key = JSON.stringify([r.model, r.setting, r.harness]);
      if (seen.has(key)) throw new Error('Duplicate model configuration: ' + key);
      seen.add(key);
    }
    return rows;
  },
};
export default board;
