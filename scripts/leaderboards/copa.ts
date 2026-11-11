// COPA: the official Competitive results list publishes test-set accuracy percentages for historical systems.
// The result numbers are parsed from live prose; author/year labels identify systems without inventing model snapshots.
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


const FEED = "https://asgordon.github.io/copa.html";
const board: Leaderboard = {
  "benchmark": "copa",
  "url": "https://asgordon.github.io/copa.html",
  "feed": "https://asgordon.github.io/copa.html",
  "terms": "The official COPA page publishes the BSD 2-Clause license; results remain attributed to the listed authors."
,
  async fetch(): Promise<LeaderboardRow[]> {
    const source = await fetchText(FEED);
    const section = source.split('7. Competitive results')[1]?.split('8. Other related publications')[0];
    if (!section) throw new Error('COPA competitive results missing');
    const rows: LeaderboardRow[] = [];
    for (const m of section.matchAll(/<li>([\s\S]*?)<\/li>/g)) {
      const line = text(m[1]), score = line.match(/(?:achieves|reports)\s+([\d.]+)%/i);
      if (!score) continue;
      const author = line.match(/^([^,]+),.*?\((\d{4})\)/);
      const model = author ? `${author[1]} et al. (${author[2]})` : line.match(/:\s*(\S+)\s+achieves/i)?.[1];
      if (model) rows.push({model,score:Number(score[1]),setting:'test set'});
    }
    if (!rows.length) throw new Error('No COPA accuracy results');
    return rows;
  },
};
export default board;
