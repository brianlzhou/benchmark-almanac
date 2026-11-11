// TrustLLM paper: Overall jailbreak refusal-to-answer rate multiplied by 100.
// These static paper rows will not refresh. QBB and ITC are metrics. Other TrustLLM dimensions are excluded.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

const FEED = "https://arxiv.org/html/2401.05561";
const board: Leaderboard = {
  benchmark: "trustllm-jailbreaktrigger",
  url: "https://arxiv.org/html/2401.05561",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {
      const t=tables(await fetchText(FEED)).find(t=>t[0]?.some(c=>c.text.startsWith('Jailbreak (RtA')));
      if(!t) throw new Error('TrustLLM jailbreak results missing');
      return t.slice(2).filter(r=>r.length===11 && num(r[3].text)!==undefined).map(r=>({model:r[0].text,score:num(r[3].text)!*100,metrics:{qbb:num(r[1].text)!*100,itc:num(r[2].text)!*100}}));
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
