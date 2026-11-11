// Original BrowseSafe-Bench: detection F1 converted to percentage, not BrowseSafe++.
// Reasoning budgets are configuration limits, not observed output tokens. Empty model cells inherit the preceding label.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const clean = (s: string) => text(s.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*`]/g, '')).trim();
function markdownTables(source: string): string[][][] {
  const out: string[][][] = []; let table: string[][] = [];
  for (const line of source.split(/\r?\n/)) {
    if (!line.trim().startsWith('|')) { if (table.length) out.push(table); table = []; continue; }
    const cells = line.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map(clean);
    if (cells.every(c => /^:?-+:?$/.test(c.replace(/\s/g, '')))) continue;
    table.push(cells);
  }
  if (table.length) out.push(table);
  return out;
}
const numeric = (s: string | undefined): number | undefined => {
  const v = (s ?? '').replace(/\\/g, '').replace(/[🥇🥈🥉🏅]/gu, '').replace(/[_*`]/g, '').replace(/,/g, '').replace(/^[~≈<>≤≥$\s]+/, '').trim();
  const m = v.match(/^(-?\d+(?:\.\d+)?)(?:\s*(?:%|±|\(|$))/);
  return m ? Number(m[1]) : undefined;
};
const identity = (name: string) => /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?4[- ]turbo|gpt[- ]?3\.?5[- ]?turbo|gemini[- ]?1\.5[- ]?(?:pro|flash)|claude[- ]?3\.5[- ]?sonnet)$/i.test(name)
  ? `${name} (snapshot unspecified)` : name;


const FEED = "https://huggingface.co/datasets/perplexity-ai/browsesafe-bench/resolve/main/README.md";
const board: Leaderboard = {
  "benchmark": "browsesafe-bench",
  "url": "https://huggingface.co/datasets/perplexity-ai/browsesafe-bench",
  "feed": "https://huggingface.co/datasets/perplexity-ai/browsesafe-bench/resolve/main/README.md",
  "terms": "The original BrowseSafe-Bench dataset card declares the MIT license."
,
  async fetch(): Promise<LeaderboardRow[]> {

    const t = markdownTables(await fetchText(FEED)).find(t => t[0].includes('F1 Score'));
    if (!t) throw new Error('BrowseSafe table missing');
    const rows: LeaderboardRow[]=[]; let name='';
    for(const r of t.slice(1)) {
      if(r[0]) name=r[0]; const score=numeric(r[2]); if(score === undefined) continue;
      let model=name, setting=r[1];
      if (/PromptGuard|safeguard/.test(name)) { const p=setting.split(' / '); model += `-${p[0]}`; setting=p[1] ?? ''; }
      if (/^(Haiku|Sonnet)/.test(model)) model=`Claude ${model}`;
      const metrics:Record<string,number>={};
      for(const [i,key] of ['precision','recall','balancedAccuracy','refusals'].entries()) {const n=numeric(r[i+3]); if(n !== undefined) metrics[key]=n*(i<3?100:1);}
      rows.push({model, score:score*100, setting:setting || undefined, metrics});
    }
    return rows;
  },
};
export default board;
