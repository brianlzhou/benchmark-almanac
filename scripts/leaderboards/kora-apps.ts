// KORA Apps: published rounded average safety percentage, by consumer application and adult/child mode.
// The four safety dimensions remain percentages. Applications are not underlying model snapshots.
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


const FEED = "https://korabench.ai/apps/leaderboard";
const board: Leaderboard = {
  "benchmark": "kora-apps",
  "url": "https://korabench.ai/apps/leaderboard",
  "feed": "https://korabench.ai/apps/leaderboard",
  "terms": "The authors publish this public results feed; no separate score-reuse license is stated, and attribution remains with the authors."
,
  async fetch(): Promise<LeaderboardRow[]> {

    const source = (await fetchText(FEED)).replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '');
    const rows: LeaderboardRow[] = [];
    const blocks = [...source.matchAll(/<\/div>([^<>]+)<span\b[^>]*>(Child mode|Adult mode)<\/span>([\s\S]*?)(?=<\/div>[^<>]+<span\b[^>]*>(?:Child mode|Adult mode)|$)/g)];
    for (const m of blocks) {
      const values = [...text(m[3]).matchAll(/(\d+)\s*%/g)].slice(0, 5).map(x => Number(x[1]));
      if (values.length !== 5) throw new Error('Application safety scores changed');
      rows.push({ model: `${text(m[1])} application`, setting: m[2], score: values[4], metrics: { onlineSafety: values[0], physicalSexual: values[1], psychosocial: values[2], learningDevelopment: values[3] } });
    }
    if (!rows.length) throw new Error('No application rows');
    return rows;
  },
};
export default board;
