// KellyBench paper: average return on investment, as a percentage, over the test season.
// These static paper rows will not refresh. Negative ROI is valid and must not be clamped. Bankroll remains a metric.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://arxiv.org/html/2604.27865";
const board: Leaderboard = {
  benchmark: "kellybench",
  url: "https://arxiv.org/html/2604.27865",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {
      const signedNum=(s:string)=>num(s.replace(/[−–]/g,'-').replace(/-\s+(?=\d)/g,'-'));
      const t=tables((await fetchText(FEED)).replace(/<annotation\b[\s\S]*?<\/annotation>/g,'')).find(t=>t[0]?.[1]?.text==='Avg ROI');if(!t)throw new Error('KellyBench ROI table missing');return t.slice(1).filter(r=>r.length===8).map(r=>({model:r[0].text,score:signedNum(r[1].text)!,metrics:{finalBankrollGBP:signedNum(r[7].text)!,averageBets:signedNum(r[5].text)!}}));
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
