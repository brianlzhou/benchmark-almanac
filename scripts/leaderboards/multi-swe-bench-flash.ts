// Multi-SWE-bench Flash: resolvedRate on the All language view multiplied by 100.
// The 300-task Flash subset is one benchmark. Language and difficulty views are not rows.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://raw.githubusercontent.com/multi-swe-bench/experiments/refs/heads/dist/leaderboard-flash.json";
const board: Leaderboard = {
  benchmark: "multi-swe-bench-flash",
  url: "https://multi-swe-bench.github.io/",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {
      const d=await fetchJson<any[]>(FEED);const all=d.find(r=>r.name==='All');
      if(!all)throw new Error('Flash All view missing');
      const seen=new Set<string>();const out:LeaderboardRow[]=[];
      for(const group of all.data)for(const r of group.results){if(seen.has(r.path))continue;seen.add(r.path);
        const p=r.name.split(' + ');out.push({model:p.pop(),harness:p.join(' + ')||undefined,setting:r.verified?'verified':'unverified',score:r.resolvedRate*100,date:r.date,metrics:{easy:r.resolvedEasyRate*100,medium:r.resolvedMediumRate*100,hard:r.resolvedHardRate*100}});
      }return out;
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
