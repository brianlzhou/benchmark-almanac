// TextVQA paper: test VQA accuracy, not the VQA 2.0 comparison.
// These static paper rows will not refresh. Validation-only ablations are not separate test results.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://arxiv.org/html/1904.08920";
const board: Leaderboard = {
  benchmark: "textvqa",
  url: "https://arxiv.org/html/1904.08920",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {
      const t=tables(await fetchText(FEED)).find(t=>t[1]?.map(c=>c.text).join('|')==='Model|Vocab|Val|Test');
      if(!t) throw new Error('TextVQA table missing');
      return t.slice(2).filter(r=>r.length===4 && num(r[3].text)!==undefined).map(r=>({model:r[0].text==='+LoRRA'?'Pythia + LoRRA':r[0].text,setting:`vocabulary ${r[1].text}`,score:num(r[3].text)!,metrics:{validation:num(r[2].text)!}}));
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
