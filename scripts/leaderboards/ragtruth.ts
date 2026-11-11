// RAGTruth paper: overall span-level hallucination-detection F1.
// These static paper rows will not refresh. Response-level F1 and raw hallucination counts measure different outcomes.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

const FEED = "https://arxiv.org/html/2401.00396";
const board: Leaderboard = {
  benchmark: "ragtruth",
  url: "https://arxiv.org/html/2401.00396",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {
      const s=(await fetchText(FEED)).replace(/<annotation\b[\s\S]*?<\/annotation>/g,'');
      const t=tables(s).find(t=>t.some(r=>r[0]?.text.startsWith('Prompt Baseline'))&&t[0]?.at(-1)?.text==='Overall');
      if(!t)throw new Error('RAGTruth span results missing');
      return t.slice(2).filter(r=>r.length===13).map(r=>({model:r[0].text.startsWith('Prompt')?r[0].text.replace(/^Prompt Baseline/,'').trim()+' (snapshot unspecified)':r[0].text,harness:r[0].text.startsWith('Prompt')?'Prompt Baseline':undefined,score:num(r[12].text)!,metrics:{precision:num(r[10].text)!,recall:num(r[11].text)!,qaF1:num(r[3].text)!,dataToTextF1:num(r[6].text)!,summarizationF1:num(r[9].text)!}}));
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
