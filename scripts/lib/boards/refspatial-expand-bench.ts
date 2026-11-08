// The dataset has separate location (241 items) and placement (200 items) splits. Each child uses its published Overall.
import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchText, fetchJson, parseCsv } from '../util.ts';
import { text, tables, num, jsonAfter } from '../html.ts';

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


const FEED = "https://huggingface.co/datasets/JingkunAn/RefSpatial-Expand-Bench/resolve/main/README.md";
const board: Leaderboard = {
  "benchmark": "refspatial-expand-bench",
  "url": "https://huggingface.co/datasets/JingkunAn/RefSpatial-Expand-Bench",
  "feed": "https://huggingface.co/datasets/JingkunAn/RefSpatial-Expand-Bench/resolve/main/README.md",
  "terms": "The authors publish this public results feed; no separate score-reuse license is stated, and attribution remains with the authors."
,
  async fetch(): Promise<LeaderboardRow[]> {

    const data=markdownTables(await fetchText(FEED)).filter(t=>t[0][0]==='Category' && t[0].some(c=>c.includes('SFT')));
    if(data.length!==2)throw new Error('Expected location and placement tables');const rows:LeaderboardRow[]=[];
    for(const [j,t] of data.entries()) for(let i=1;i<t[0].length;i++) {
      const overall=t.find(r=>r[0]==='Overall'), score=numeric(overall?.[i]);if(score===undefined)continue;
      const metrics:Record<string,number>={};for(const r of t.slice(1)){if(r[0]==='Overall')continue;const n=numeric(r[i]);if(n!==undefined)metrics[r[0].replace(/\s/g,'')]=n;}
      rows.push({model:`RoboRefer ${t[0][i]}`,score,setting:j===0?'Location':'Placement',metrics});
    }
    return rows;
  },
};
export const sourceBoard = board;

// Each child record selects one complete test set. Remaining settings describe its run.
export async function trackRows(select: string, remove: string): Promise<LeaderboardRow[]> {
 const rows = (await sourceBoard.fetch()).filter(r => new RegExp(select).test(r.setting ?? "")).map(r => ({...r, setting: (r.setting ?? "").replace(new RegExp(remove), "").replace(/^;\s*|;\s*$/g, "").trim() || undefined}));
 if (!rows.length) throw new Error("No rows for track " + select);
 return rows;
}
