// ASI-Bench paper: Overall score across B1 through B4.
// These static published paper rows will not refresh. Draft website preview data are excluded. Harness labels close each table group.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

const FEED = "https://arxiv.org/html/2608.17271";
const board: Leaderboard = {
  benchmark: "asi-bench",
  url: "https://arxiv.org/html/2608.17271",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {
      const t=tables((await fetchText(FEED)).replace(/<annotation\b[\s\S]*?<\/annotation>/g,'')).find(t=>t[0]?.[0]?.text==='Harness'&&t[0]?.[1]?.text==='Backbone Model');if(!t)throw new Error('ASI table missing');let harness='';const out:LeaderboardRow[]=[];
      for(const r of t.slice(2).reverse()){if(r.length!==10)continue;if(r[0].text)harness=r[0].text;if(!r[1].text||/std\.|single run/.test(r[1].text))continue;const score=num(r[6].text);if(score===undefined)continue;const name=r[1].text.replace(/†/g,'');out.push({model:name.replace(/\s*\([^)]*\)$/,''),setting:name.match(/\(([^)]*)\)$/)?.[1],harness,score,metrics:{b1:num(r[2].text)!,b2:num(r[3].text)!,b3:num(r[4].text)!,b4:num(r[5].text)!}});}return out.reverse();
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
