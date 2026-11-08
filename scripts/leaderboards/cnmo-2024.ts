// DeepSeek-V3 paper: CNMO 2024 pass@1 averaged over 16 samples.
// DeepSeek prepared this evaluation. These static paper rows will not refresh.
// Compact source dates identify the exact model snapshots. The reader verifies the header order before assigning scores.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://arxiv.org/html/2412.19437";
const board: Leaderboard = {
  benchmark: "cnmo-2024",
  url: "https://arxiv.org/html/2412.19437",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  aliases: {"DeepSeek-V2-0506": "deepseek-v2-moe-236b-may-2024", "DeepSeek-V2.5-0905": "deepseek-v2-5-sep-2024", "Llama-3.1-405B-Instruct": "llama-3-1-405b", "Claude-3.5-Sonnet-1022": "claude-3-5-sonnet-october-2024", "GPT-4o-0513": "gpt-4o-may-2024", "DeepSeek-V3 (December 2024)": "deepseek-v3"},
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {
      const t=tables(await fetchText(FEED)).find(t=>t.some(r=>r[0]?.text==='CNMO 2024 (Pass@1)'));
      if(!t) throw new Error('CNMO row missing');
      const expected=['V2-0506','V2.5-0905','72B-Inst.','405B-Inst.','Sonnet-1022','0513','V3'];
      if(JSON.stringify(t[1].slice(1).map(c=>c.text))!==JSON.stringify(expected))throw new Error('CNMO model columns changed');
      const r=t.find(r=>r[0]?.text==='CNMO 2024 (Pass@1)')!;
      const names=['DeepSeek-V2-0506','DeepSeek-V2.5-0905','Qwen2.5-72B-Instruct','Llama-3.1-405B-Instruct','Claude-3.5-Sonnet-1022','GPT-4o-0513','DeepSeek-V3 (December 2024)'];
      if(r.length!==names.length+1) throw new Error('CNMO columns changed');
      return names.map((model,i)=>({model,score:num(r[i+1].text)!}));
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
