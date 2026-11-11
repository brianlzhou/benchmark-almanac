// Gym-Anything-RT: real-time pass percentage at difficulty 5 with full interaction.
// Cost and time are per real-time attempt; non-real-time pass rates remain supporting metrics.
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
const identity = (name: string) => /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?4[- ]turbo|gpt[- ]?3\.?5[- ]?turbo|gemini[- ]?1\.5[- ]?(?:pro|flash)|claude[- ]?3\.5[- ]?sonnet)$/i.test(name)
  ? `${name} (snapshot unspecified)` : name;


const FEED = "https://gym-anything.github.io/gym-anything-rt/";
const board: Leaderboard = {
  "benchmark": "gym-anything-rt",
  "url": "https://gym-anything.github.io/gym-anything-rt/",
  "feed": "https://gym-anything.github.io/gym-anything-rt/",
  "terms": "The authors publish this public results feed; no separate score-reuse license is stated, and attribution remains with the authors."
,
  async fetch(): Promise<LeaderboardRow[]> {

    const t=tables(await fetchText(FEED)).find(t=>t[0].some(c=>c.text==='Real-time'));
    if(!t) throw new Error('Gym-Anything-RT table missing');
    const rows:LeaderboardRow[]=[];
    for(const cells of t.slice(1)) {
      const r=cells.map(c=>c.text);if(/human/i.test(r[1]))continue;
      const score=num(r[2]);if(score===undefined)continue;
      const pair=r[1].match(/^(.*?)\s*\(([^)]+)\)$/);
      const metrics:Record<string,number>={};const nonreal=num(r[3]);if(nonreal!==undefined)metrics.nonRealTimePass=nonreal;
      const minutes=parseFloat(r[4]);if(Number.isFinite(minutes))metrics.latency=minutes*60;
      rows.push({model:pair?pair[1]:r[1],score,setting:`Difficulty 5; full interaction${pair?`; ${pair[2]}`:''}`,cost:num(r[5]),metrics});
    }
    return rows;
  },
};
export default board;
