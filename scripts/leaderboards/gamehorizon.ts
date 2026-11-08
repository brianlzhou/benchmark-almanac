// GameHorizon official overall offline score, with three tiers retained.
// Online evaluation metrics are attached where published; repeated responsive rows are deduplicated.
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


const FEED = "https://gamehorizon-suite.github.io/";
const board: Leaderboard = {
  "benchmark": "gamehorizon",
  "url": "https://gamehorizon-suite.github.io/",
  "feed": "https://gamehorizon-suite.github.io/",
  "terms": "The authors publish this public results feed; no separate score-reuse license is stated, and attribution remains with the authors."
,
  async fetch(): Promise<LeaderboardRow[]> {
    const data = tables(await fetchText(FEED));
    const rows = new Map<string,LeaderboardRow>();
    for (const t of data.filter(t=>t[0]?.some(c=>c.text==='Overall') && t[0]?.some(c=>c.text==='T1'))) {
      for (const r of t.slice(1)) {
        const score=num(r[5]?.text);if(score===undefined)continue;
        const metrics:Record<string,number>={};
        for(let i=2;i<=4;i++){const n=num(r[i]?.text);if(n!==undefined)metrics[`T${i-1}`]=n;}
        rows.set(r[1].text,{model:identity(r[1].text),score,metrics,setting:'offline'});
      }
    }
    for (const t of data.filter(t=>t[0]?.some(c=>c.text==='Online Rank'))) for(const r of t.slice(1)) {
      const row=rows.get(r[1]?.text);if(!row)continue;
      for(const [key,col] of [['onlineShortHorizon',3],['onlineLongHorizon',4],['onlineCausal',5],['onlineThematic',6]] as const){const n=num(r[col]?.text);if(n!==undefined)row.metrics![key]=n;}
    }
    if (!rows.size) throw new Error('GameHorizon table missing');
    return [...rows.values()];
  },
};
export default board;
