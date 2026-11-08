// SciBench: official published Avg in the current Zero-Shot Learning table.
// Textbook scores remain metrics. Commented historical runs are excluded. Generic GPT snapshots remain unlisted.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://scibench-ucla.github.io/data/results/model_scores.js";
const board: Leaderboard = {
  benchmark: "scibench",
  url: "https://scibench-ucla.github.io/data/results/model_scores.js",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {
      const s=(await fetchText(FEED)).replace(/^\s*\/\/.*$/gm,'').replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g,(_,v)=>JSON.stringify(v));const d=jsLiteral<Record<string,Record<string,Record<string,number>>>>(s,s.indexOf('{'));return Object.entries(d).flatMap(([setting,models])=>Object.entries(models).filter(([,v])=>typeof v.Avg==='number').map(([model,v])=>({model:/GPT-3.5-Turbo|Mistral-7B/.test(model)?model+' (snapshot unspecified)':model,setting,score:v.Avg,metrics:Object.fromEntries(Object.entries(v).filter(([k])=>k!=='Avg'))})));
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
