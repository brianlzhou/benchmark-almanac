// InfiniteBench En.MC: the official results matrix reports accuracy percentages for long-book multiple choice.
// Only En.MC is imported; dataset token-length statistics are not model output-token usage.
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
  const v = (s ?? '').replace(/\\/g, '').replace(/,/g, '').replace(/^[~≈<>≤≥$\s]+/, '').trim();
  const m = v.match(/^(-?\d+(?:\.\d+)?)(?:\s*(?:%|±|\(|$))/);
  return m ? Number(m[1]) : undefined;
};
const identity = (name: string) => /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?4[- ]turbo|gpt[- ]?3\.?5[- ]?turbo|gemini[- ]?1\.5[- ]?(?:pro|flash)|claude[- ]?3\.5[- ]?sonnet)$/i.test(name)
  ? `${name} (snapshot unspecified)` : name;


const FEED = "https://raw.githubusercontent.com/OpenBMB/InfiniteBench/main/README.md";
const board: Leaderboard = {
  "benchmark": "infinitebench-en-mc",
  "url": "https://github.com/OpenBMB/InfiniteBench",
  "feed": "https://raw.githubusercontent.com/OpenBMB/InfiniteBench/main/README.md",
  "terms": "The authors publish this public results feed; no separate score-reuse license is stated, and attribution remains with the authors."
,
  async fetch(): Promise<LeaderboardRow[]> {
    const data = markdownTables(await fetchText(FEED));
    const t = data.find(t => t[0]?.includes('GPT-4'));
    const r = t?.find(r => r[0] === 'En.MC');
    if (!t || !r) throw new Error('En.MC result matrix missing');
    return t[0].slice(1).flatMap((model, i) => { const score = numeric(r[i + 1]);
      return score === undefined ? [] : [{model: identity(model), score, setting: 'En.MC'}];
    });
  },
};
export default board;
