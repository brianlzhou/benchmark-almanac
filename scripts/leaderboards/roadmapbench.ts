// RoadmapBench: Resolved % is the fraction of tasks with all targets passed.
// The table reports median output tokens, not mean output tokens, so these stay in metrics.
// Completion score and average turns are retained; the source plots resolved rate against average steps.
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


const FEED = "https://unipat.ai/benchmarks/RoadmapBench";
const board: Leaderboard = {
  "benchmark": "roadmapbench",
  "url": "https://unipat.ai/benchmarks/RoadmapBench",
  "feed": "https://unipat.ai/benchmarks/RoadmapBench",
  "terms": "The authors publish this public results feed; no separate score-reuse license is stated, and attribution remains with the authors.",
  "chart": {
    "title": "Efficiency Landscape",
    "x": {
      "key": "turns",
      "label": "Average agent steps",
      "unit": "steps",
      "better": "lower"
    },
    "y": {
      "key": "score",
      "label": "Resolved rate",
      "unit": "%",
      "better": "higher"
    }
  }
,
  async fetch(): Promise<LeaderboardRow[]> {
    const t = tables(await fetchText(FEED)).find(t => t[0]?.some(c => c.text === 'Resolved %'));
    if (!t) throw new Error('RoadmapBench results table missing');
    return t.slice(1).flatMap(r => {
      const model = text(r[1]?.html.match(/class="rm-model-name">([^<]+)/)?.[1] ?? '');
      const score = num(r[3]?.text);
      if (!model || score === undefined) return [];
      const raw = r[6]?.text ?? '', n = num(raw);
      const metrics: Record<string, number> = {};
      if (n !== undefined) metrics.medianOutputTokens = n * (/K$/i.test(raw) ? 1e3 : /M$/i.test(raw) ? 1e6 : 1);
      const completion = num(r[4]?.text), turns = num(r[5]?.text);
      if (completion !== undefined) metrics.completion = completion;
      if (turns !== undefined) metrics.turns = turns;
      return [{model,score,harness:r[2]?.text,setting:'single trial per model',metrics}];
    });
  },
};
export default board;
