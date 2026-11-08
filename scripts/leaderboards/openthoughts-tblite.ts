// OpenThoughts-TBLite: published task success percentage, with reported uncertainty.
// Runtime is total benchmark minutes, not task latency; Terminal-Bench 2 comparisons remain supporting metrics.
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


const FEED = "https://www.openthoughts.ai/blog/openthoughts-tblite";
const board: Leaderboard = {
  "benchmark": "openthoughts-tblite",
  "url": "https://www.openthoughts.ai/blog/openthoughts-tblite",
  "feed": "https://www.openthoughts.ai/blog/openthoughts-tblite",
  "terms": "The authors publish this public results feed; no separate score-reuse license is stated, and attribution remains with the authors."
,
  async fetch(): Promise<LeaderboardRow[]> {

    const data=tables(await fetchText(FEED)).map(t=>t.map(r=>r.map(c=>c.text)));
    const scores=data.find(t=>t[0]?.[1]==='OpenThoughts-TBLite'), times=data.find(t=>t[0]?.[1]==='OpenThoughts-TBLite Runtime');
    if(!scores) throw new Error('TBLite score table missing');
    return scores.slice(1).filter(r=>numeric(r[1])!==undefined).map(r=>{
      const metrics:Record<string,number>={};const uncertainty=r[1].match(/±\s*([\d.]+)/);if(uncertainty)metrics.uncertainty=Number(uncertainty[1]);
      const comparison=numeric(r[2]);if(comparison!==undefined)metrics.tb2Score=comparison;
      const runtime=times?.find(t=>t[0]===r[0]);if(runtime){metrics.benchmarkRuntimeMinutes=parseFloat(runtime[1]);metrics.tb2RuntimeMinutes=parseFloat(runtime[2]);}
      return {model:identity(r[0].replace(/^[^/]+\//,'')),score:numeric(r[1])!,metrics};
    });
  },
};
export default board;
