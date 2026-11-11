// FDE-Gym paper: main Score over all 95 tasks at L3.
// These static paper rows will not refresh. Original-task difficulty scores remain metrics. Negative scores are valid.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

const FEED = "https://arxiv.org/html/2610.22350";
const board: Leaderboard = {
  benchmark: "fde-gym",
  url: "https://arxiv.org/html/2610.22350",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {
      const signedNum=(s:string)=>num(s.replace(/[−–]/g,'-').replace(/-\s+(?=\d)/g,'-'));
      const t=tables((await fetchText(FEED)).replace(/<annotation\b[\s\S]*?<\/annotation>/g,'')).find(t=>t[1]?.[0]?.text==='Configuration'&&t[1]?.[5]?.text==='Score');if(!t)throw new Error('FDE table missing');return t.slice(2).filter(r=>r.length===11).map(r=>({model:r[0].text.replace(/ \(thinking\)$/,''),setting:r[0].text.includes('(thinking)')?'thinking':undefined,score:signedNum(r[5].text)!,metrics:{l0:signedNum(r[1].text)!,l1:signedNum(r[2].text)!,l2:signedNum(r[3].text)!,l3:signedNum(r[4].text)!,utility:signedNum(r[7].text)!,costPenalty:signedNum(r[8].text)!,resolved:signedNum(r[9].text)!}}));
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
