// Wiki Live Challenge: published overall writing/fact score with five quality components.
// Langchain entries separate the stated base model and harness; other research products retain their identities.
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


const FEED = "https://agentresearchlab.com/benchmarks/wiki-live-challenge/index.html";
const board: Leaderboard = {
  "benchmark": "wiki-live-challenge",
  "url": "https://agentresearchlab.com/benchmarks/wiki-live-challenge/index.html",
  "feed": "https://agentresearchlab.com/benchmarks/wiki-live-challenge/index.html",
  "terms": "The authors publish this public results feed; no separate score-reuse license is stated, and attribution remains with the authors."
,
  async fetch(): Promise<LeaderboardRow[]> {

    const t = tables(await fetchText(FEED)).find(t => t[0].some(c => c.text === 'Overall'));
    if (!t) throw new Error('Wiki results table missing');
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      let model = text(r[1]?.html.match(/<div[^>]*>([\s\S]*?)<\/div>/)?.[1] ?? '');
      const score = num(r[3]?.text); if (!model || score === undefined) continue;
      const pair = model.match(/^Langchain \(([^)]+)\)$/);
      const harness = pair ? 'Langchain' : undefined;
      model = pair ? pair[1] : model;
      const metrics: Record<string,number> = {};
      for (const [i,key] of ['wellWritten','neutral','broad','wikiCoverage','referenceAccuracy'].entries()) { const n = num(r[i+4]?.text); if(n !== undefined) metrics[key]=n; }
      rows.push({model, score, harness, metrics});
    }
    return rows;
  },
};
export default board;
