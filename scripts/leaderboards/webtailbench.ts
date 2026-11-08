// WebTailBench v1.5: Outcome Success is the headline task-success percentage.
// The README highlights improvement on outcome success (final task state correct).
// Process Success measures intermediate steps and remains a secondary metric.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

function markdownTables(source: string): string[][][] {
  const out: string[][][] = []; let current: string[][] = [];
  for (const line of source.split(/\r?\n/)) {
    if ((line.match(/\|/g) ?? []).length < 2) { if (current.length) out.push(current); current = []; continue; }
    const cells = line.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map(c => text(c.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*`]/g, '')));
    if (cells.every(c => /^:?-+:?$/.test(c.replace(/\s/g, '')))) continue;
    current.push(cells);
  }
  if (current.length) out.push(current);
  return out;
}
const FEED = "https://raw.githubusercontent.com/microsoft/fara/main/README.md";
const board: Leaderboard = {
  benchmark: "webtailbench", url: "https://github.com/microsoft/fara", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = markdownTables(source);
    const rows: LeaderboardRow[] = [];
    const table=all.find(t=>t[0].some(h=>h.startsWith("WebTailBench")));if(!table)throw new Error("Missing WebTailBench columns");
    for(const r of table.slice(1))for(const [i,h] of table[0].entries()){if(!h.startsWith("WebTailBench"))continue;const score=num(r[i]);if(score===undefined)continue;let model=r[0].replace(/†/g,""),harness: string|undefined; if(model.endsWith(" SoM")){harness="SoM";model=model.slice(0,-4);}const m=model.match(/^(.+) Solver \((.+)\)$/);if(m){harness=m[1]+" Solver";model=m[2];}rows.push({model,score,setting:h,harness});}
    if (!rows.length) throw new Error("No webtailbench score rows");
    const overall = rows.filter(r => r.setting?.endsWith('(Outcome)'));
    for (const row of overall) {
      const process = rows.find(r => r.model === row.model && r.harness === row.harness && r.setting?.endsWith('(Process)'));
      if (process) row.metrics = {processSuccess: process.score};
      row.setting = 'v1.5';
    }
    if (!overall.length) throw new Error('No WebTailBench outcome scores');
    return overall;
  },
};
export default board;
