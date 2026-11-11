// DP-Bench: published NID document-layout score (0–100), the table ordering.
// TEDS and TEDS-S table-recognition scores, request dates, and seconds per request remain attached.
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


const FEED = "https://huggingface.co/datasets/upstage/dp-bench/resolve/main/README.md";
const board: Leaderboard = {
  "benchmark": "dp-bench",
  "url": "https://huggingface.co/datasets/upstage/dp-bench",
  "feed": "https://huggingface.co/datasets/upstage/dp-bench/resolve/main/README.md",
  "terms": "The Upstage DP-Bench dataset card declares the MIT license."
,
  async fetch(): Promise<LeaderboardRow[]> {

    const t=markdownTables(await fetchText(FEED)).find(t=>t[0].some(c=>c.includes('Request date')));
    if(!t) throw new Error('DP-Bench table missing');
    return t.slice(1).filter(r=>numeric(r[4])!==undefined).map(r=>{
      const metrics:Record<string,number>={};
      for(const [key,i] of [['teds',2],['tedsStructure',3],['latency',5]] as const) {const n=numeric(r[i]);if(n!==undefined)metrics[key]=n;}
      return {model:`${r[0]} document parser`,score:numeric(r[4])!,date:r[1],setting:'NID layout score',metrics};
    });
  },
};
export default board;
