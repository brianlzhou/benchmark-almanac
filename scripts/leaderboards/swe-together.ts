// SWE-Together pass@1 percentage. Output plus reasoning tokens and API dollars are per task.
// The site uses the opencode harness with two trials; pass-squared, judge, corrections, and time remain metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { text, tables, num, jsonAfter } from '../lib/html.ts';

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


const FEED = "https://togetherbench.com";
const board: Leaderboard = {
  "benchmark": "swe-together",
  "url": "https://togetherbench.com",
  "feed": "https://togetherbench.com",
  "terms": "The authors publish this public results feed; no separate score-reuse license is stated, and attribution remains with the authors."
,
  async fetch(): Promise<LeaderboardRow[]> {
    const source=await fetchText(FEED);const rows:LeaderboardRow[]=[];
    for(const part of source.split(/<div class="lbb-grid lbb-row">/).slice(1)){
      const block=part.split(/<!--|<div class="lbb-grid lbb-axis/)[0];
      const value=(key:string)=>text(block.match(new RegExp(`class="[^"]*${key}[^"]*">([\\s\\S]*?)<\\/(?:span|div)>`))?.[1]??'');
      const model=value('lbb-name');const score=numeric(value('lbb-p1'));if(!model||score===undefined)continue;
      const metrics:Record<string,number>={};
      for(const [key,cls,scale] of [['passSquared','lbb-p2',1],['judge','c-judge',1],['corrections','c-corr',1],['latency','c-min',60]] as const){const n=numeric(value(cls));if(n!==undefined)metrics[key]=n*scale;}
      const cost=numeric(value('c-usd'));const tokenText=value('c-tok');const t=num(tokenText);const tokens=t===undefined?undefined:t*(/k$/i.test(tokenText)?1000:/m$/i.test(tokenText)?1e6:1);
      rows.push({model:identity(model),score,harness:'opencode',cost,tokens,metrics});
    }
    if(!rows.length)throw new Error('SWE-Together chart rows missing');
    return rows;
  },
};
export default board;
