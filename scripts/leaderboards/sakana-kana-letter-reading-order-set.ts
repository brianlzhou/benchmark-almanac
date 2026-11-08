// Sakana Fugu paper Table 3 reports mean NED across all 25 expert-annotated letters, explicitly higher is better. Fractions become percentages. All models use beam search. These paper rows are static and will not refresh. Anonymous models stay anonymous. Model C has no completed run.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://arxiv.org/html/2606.21228v2";
const board: Leaderboard = {
  benchmark: "sakana-kana-letter-reading-order-set",
  url: "https://arxiv.org/html/2606.21228v2",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {

const t=tables(await fetchText(FEED)).find(t=>t[0]?.[1]?.text==='Mean NED');if(!t)throw new Error('Kana-letter table missing');return t.slice(1).filter(r=>num(r[1]?.text)!==undefined).map(r=>({model:/^Model [AB]$/.test(r[0].text)?`Anonymous frontier ${r[0].text}`:r[0].text==='Baseline'?'Seed heuristic':r[0].text+' (June 2026 paper)',score:100*num(r[1].text)!,harness:'Beam search'}));

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
