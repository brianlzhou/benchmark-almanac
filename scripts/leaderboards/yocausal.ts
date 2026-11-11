// YoCausal publishes RSI Average in its default RSI view. CCI and domain scores remain secondary metrics. Release dates are not evaluation dates.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';

const FEED = "https://www.youzhexie.me/papers/YoCausal/index.html";
const board: Leaderboard = {
  benchmark: "yocausal",
  url: "https://www.youzhexie.me/papers/YoCausal/index.html",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {

const s=await fetchText(FEED);const a=jsLiteral(s,s.indexOf('[',s.indexOf('const rsiData'))) as any[];
const c=jsLiteral(s,s.indexOf('[',s.indexOf('const cciData'))) as any[];
return a.map(r=>({model:r.model,score:r.Average,metrics:{general:r.General,physics:r.Physics,human:r.Human,animal:r.Animal,...(c.find(x=>x.model===r.model)?{cci:c.find(x=>x.model===r.model).CCI}:{})}}));

    })();
    if (!rows.length) throw new Error('No whole-benchmark scores found');
    const seen = new Set<string>();
    for (const r of rows) {
      if (!r.model || !Number.isFinite(r.score)) throw new Error('Invalid model or score');
      if (/^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model)) r.model += ' (snapshot unspecified)';
      const key = JSON.stringify([r.model, r.setting, r.harness]);
      if (seen.has(key)) throw new Error('Duplicate model configuration: ' + key);
      seen.add(key);
    }
    return rows;
  },
};
export default board;
