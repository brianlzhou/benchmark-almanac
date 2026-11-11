// MiMo Cyber Bench: the official article table score in percent.
// Models and scores are read from the live script as data, without executing it. Null results are excluded.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const FEED = "https://mimo.xiaomi.com/mimo-v2-6/bench.js";
const board: Leaderboard = {
  benchmark: "mimo-cyber-bench",
  url: "https://mimo.xiaomi.com/mimo-v2-6/article.html",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {
      const s=await fetchText(FEED);
      const modelsText=s.match(/const MODELS = \[([\s\S]*?)\n    \];/)?.[1];
      if(!modelsText) throw new Error('MiMo model headers missing');
      const models=[...modelsText.matchAll(/name:\s*'([^']+)'/g)].map(m=>m[1]);
      const values=s.match(/name:\s*'MiMo Cyber Bench',\s*scores:\s*(\[[^\]]+\])/)?.[1];
      if(!values) throw new Error('MiMo benchmark missing');
      const scores=JSON.parse(values) as (number|null)[];
      if(models.length!==scores.length) throw new Error('MiMo column count changed');
      return models.flatMap((model,i)=>scores[i]===null?[]:[{model,score:scores[i]!}]);
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
