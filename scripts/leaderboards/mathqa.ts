// MathQA official leaderboard. Score is overall accuracy in percent; category accuracies remain metrics.
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


const FEED = "https://math-qa.github.io/math-QA/leaderboard.html";
const board: Leaderboard = {
  "benchmark": "mathqa",
  "url": "https://math-qa.github.io/math-QA/leaderboard.html",
  "feed": "https://math-qa.github.io/math-QA/leaderboard.html",
  "terms": "The authors publish this public results feed; no separate score-reuse license is stated, and attribution remains with the authors."
,
  async fetch(): Promise<LeaderboardRow[]> {
    const source = await fetchText(FEED);
    const sections = [...source.matchAll(/<section\b[^>]*>[\s\S]*?<\/section>/g)].map(m=>m[0]);
    const overall = sections.find(s=>s.includes('MathQA Challange'));
    if (!overall) throw new Error('MathQA table missing');
    const rows: LeaderboardRow[] = [];
    for (const r of tables(overall)[0].slice(1)) {
      const model = r[1]?.text, score = num(r[4]?.text); if (!model || score === undefined) continue;
      const metrics: Record<string,number> = {};
      for (const category of ['Geometry','Physics','General','Gain','Probability','Other']) {
        const s = sections.find(s=>s.includes(`${category} Category`));
        const row = s ? tables(s)[0]?.find(r=>r[1]?.text===model) : undefined;
        const n = num(row?.[4]?.text); if (n !== undefined) metrics[category.toLowerCase()] = n;
      }
      rows.push({model,score,metrics});
    }
    return rows;
  },
};
export default board;
