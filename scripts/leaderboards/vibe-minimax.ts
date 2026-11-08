// VIBE MiniMax official evaluation. The percentage score is the five-platform average; platform scores remain supporting metrics.
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


const FEED = "https://raw.githubusercontent.com/MiniMax-AI/MiniMax-M2.1/main/README.md";
const board: Leaderboard = {
  "benchmark": "vibe-minimax",
  "url": "https://github.com/MiniMax-AI/MiniMax-M2.1",
  "feed": "https://raw.githubusercontent.com/MiniMax-AI/MiniMax-M2.1/main/README.md",
  "terms": "The authors publish this public results feed; no separate score-reuse license is stated, and attribution remains with the authors."
,
  async fetch(): Promise<LeaderboardRow[]> {
    const source = await fetchText(FEED);
    const t = markdownTables(source).find(t => t.some(r => r[0] === 'VIBE (Average)'));
    if (!t) throw new Error('VIBE table missing');
    const avg = t.find(r => r[0] === 'VIBE (Average)')!;
    return t[0].slice(1).flatMap((model, i) => {
      const score = numeric(avg[i+1]); if (score === undefined) return [];
      const metrics: Record<string, number> = {};
      for (const r of t.slice(1)) { const n = numeric(r[i+1]); if (n !== undefined && r !== avg) metrics[r[0]] = n; }
      return [{model: identity(model), score, metrics}];
    });
  },
};
export default board;
