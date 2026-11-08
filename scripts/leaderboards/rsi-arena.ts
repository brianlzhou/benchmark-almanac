// RSI Arena paper: final human-arena Rating of each agent-trained model.
// These static paper rows will not refresh. The agent identity names the training system. GPU hours and API spending cover training.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://arxiv.org/html/2610.33624";
const board: Leaderboard = {
  benchmark: "rsi-arena",
  url: "https://arxiv.org/html/2610.33624",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {
      const t=tables(await fetchText(FEED)).find(t=>t[0]?.[0]?.text==='Agent'&&t[0]?.at(-1)?.text==='Rating');
      if(!t)throw new Error('RSI ratings missing');
      return t.slice(1).filter(r=>r.length===10&&num(r[9].text)!==undefined).map(r=>({model:r[0].text,score:num(r[9].text)!,metrics:{gpuHours:num(r[3].text)!,trainingCost:num(r[4].text)!,jobs:num(r[5].text)!}}));
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
