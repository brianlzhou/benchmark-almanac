// VRBench overall percentage score, with outcome, process, and seven reasoning categories.
// Text and vision configurations remain separate; undated API names stay unlisted.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text, tables, num } from '../lib/html.ts';

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
const identity = (name: string) => /^(?:gpt4o|gpt4|gpt4turbo|gpt4v|gpt35turbo|gemini(?:15|20|25)(?:pro|flash|flashlite|flashthinking)|claude35sonnet|deepseek(?:r1|v3))$/i.test(name.replace(/[- ._]/g, '')) ? `${name} (snapshot unspecified)` : name;


const FEED = "https://vrbench.github.io/";
const board: Leaderboard = {
  "benchmark": "vrbench",
  "url": "https://vrbench.github.io/",
  "feed": "https://vrbench.github.io/",
  "terms": "The authors publish this public results feed; no separate score-reuse license is stated, and attribution remains with the authors."
,
  async fetch(): Promise<LeaderboardRow[]> {
    const t=tables(await fetchText(FEED)).find(t=>t[0]?.some(c=>c.text==='Overall'));
    if(!t)throw new Error('VRBench table missing');
    const rows:LeaderboardRow[]=[];let modality='';
    for(const r of t.slice(2)){
      const model=r[0]?.text.trim();
      if(/^(?:LLMs|VLMs|MLLMs)$/.test(model)){modality=model;continue;}
      const score=num(r[1]?.text);if(score===undefined)continue;
      const metrics:Record<string,number>={};
      for(const [i,k] of ['outcome','process','eventAttribution','counting','hypotheticalReasoning','implicitInference','synopsis','eventPrediction','logicalLinkage'].entries()){const n=num(r[i+2]?.text);if(n!==undefined)metrics[k]=n;}
      rows.push({model:identity(model),score,setting:modality,metrics});
    }
    return rows;
  },
};
export default board;
