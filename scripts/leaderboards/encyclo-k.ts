// Encyclo-K: published Avg. over the complete benchmark. Domain scores remain metrics.
// Reasoning and non-reasoning modes are configurations of the whole benchmark. The current page names the bundle.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';

const FEED = "https://encyclo-k.github.io/";
const board: Leaderboard = {
  benchmark: "encyclo-k",
  url: "https://encyclo-k.github.io/",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  aliases: {'Qwen3-235B-A22B-Instruct-2507':'qwen3-235b-a22b-instruct-jul-2025', 'Qwen3-30B-A3B-Instruct-2507':'qwen3-30b-a3b-instruct-jul-2025'},
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {
      const page=await fetchText(FEED);const path=page.match(/src="([^" ]*\/assets\/index-[^" ]+\.js)"/)?.[1]??page.match(/src="([^" ]*assets\/index-[^" ]+\.js)"/)?.[1];
      if(!path) throw new Error('Encyclo-K bundle missing');
      await new Promise(r=>setTimeout(r,1100));const source=await fetchText(new URL(path,FEED).href);
      const out:LeaderboardRow[]=[];
      for(const m of source.matchAll(/\[\{rank:1,model:/g)) {
        const data=jsLiteral<any[]>(source,m.index!);
        for(const r of data) {
          const metrics=Object.fromEntries(Object.entries(r).filter(([k,v])=>typeof v==='number'&&!['rank','avg'].includes(k))) as Record<string,number>;
          let model=r.model;const mode=model.match(/-(no-thinking|non-thinking|thinking|high|medium|low)$/);if(mode)model=model.slice(0,-mode[0].length);
          out.push({model,score:r.avg,setting:mode?.[1],metrics});
        }
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
