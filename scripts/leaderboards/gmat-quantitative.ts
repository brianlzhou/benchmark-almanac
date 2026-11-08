// GMAT Quantitative: exact accuracy from the Llama 3 report exam table.
// These static paper rows will not refresh. The report calls its July instruction-tuned systems Llama 3.
// The table uses Llama 3 for the report’s July 2024 Llama 3.1 release. Unspecified GPT and Claude snapshots remain unlisted.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://arxiv.org/html/2407.21783v3";
const board: Leaderboard = {
  benchmark: "gmat-quantitative",
  url: "https://arxiv.org/html/2407.21783v3",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  aliases: {"Llama 3.1 8B Instruct": "llama-3-1-8b", "Llama 3.1 70B Instruct": "llama-3-1-70b", "Llama 3.1 405B Instruct": "llama-3-1-405b", "Nemotron 4 340B": "nemotron-4-340b-instruct"},
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {
      const s=(await fetchText(FEED)).replace(/<annotation\b[\s\S]*?<\/annotation>/g,'');const t=tables(s).find(t=>t.some(r=>r[0]?.text==='GMAT Quant.'));if(!t)throw new Error('GMAT table missing');const r=t.find(r=>r[0]?.text==='GMAT Quant.')!;
      return r.slice(1).map((c,i)=>({model:t[0][i+1].text.replace(/^\\rotate/,'').trim().replace(/^Llama 3 (\d+B)$/,'Llama 3.1 $1 Instruct').replace(/^GPT-3.5 Turbo$/,'GPT-3.5 Turbo (snapshot unspecified)'),score:num(c.text)!}));
    })();
    if (!rows.length) throw new Error('No whole-benchmark scores found');
    const seen = new Set<string>();
    for (const r of rows) {
      if (!r.model || !Number.isFinite(r.score)) throw new Error('Invalid model or score');
      if (r.score < 0 || r.score > 100) throw new Error('Score outside percent range');
      if (/^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|gemini[- ]?2[.](?:0|5)[- ]?flash(?:[- ]?lite)?|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model)) r.model += ' (snapshot unspecified)';
      const key = JSON.stringify([r.model, r.setting, r.harness]);
      if (seen.has(key)) throw new Error('Duplicate model configuration: ' + key);
      seen.add(key);
    }
    return rows;
  },
};
export default board;
