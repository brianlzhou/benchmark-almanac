// WebBench publishes overall success for autonomous and human-assisted agent configurations. Read and write scores remain metrics. Agent product names stay unlisted when the underlying model is unspecified.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';

const FEED = "https://webbench.ai/assets/index-BZfRa_LN.js";
const board: Leaderboard = {
  benchmark: "webbench-halluminate",
  url: "https://webbench.ai/assets/index-BZfRa_LN.js",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {

const s=await fetchText(FEED);const objects=[...s.matchAll(/\{id:"[^"]+",model:"[^"]+",organization:"[^"]+",score:[^{}]+?\}/g)].map(m=>jsLiteral(m[0].replace(/!0/g,'true').replace(/!1/g,'false'),0) as any);
const unique=[...new Map(objects.map(r=>[r.id,r])).values()];
return unique.filter(r=>r.category==='overall').map(r=>({model:r.model,score:r.score,date:r.date,setting:/Convergence|Rtrvr|Operator/.test(r.model)?'Human-in-the-loop':'Autonomous',metrics:Object.fromEntries(unique.filter(x=>x.model===r.model&&x.category!=='overall').map(x=>[x.category,x.score]))}));

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
