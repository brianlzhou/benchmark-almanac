// HumanEval Multi: use DeepSeek’s published Avg pass@1 across eight languages.
// Language results remain metrics. Rows without a published average cannot supply a benchmark score.
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
const FEED = "https://raw.githubusercontent.com/deepseek-ai/DeepSeek-Coder/main/Evaluation/HumanEval/README.md";
const board: Leaderboard = {
  benchmark: "humaneval-multi", url: "https://raw.githubusercontent.com/deepseek-ai/DeepSeek-Coder/main/Evaluation/HumanEval/README.md", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = markdownTables(source);
    const rows: LeaderboardRow[] = [];
    for (const table of all.filter(t => t[0].includes('Python') && t[0].includes('Avg'))) {
      for (const r of table.slice(1)) {
        if (!r[0]) continue;
        const score = num(r[table[0].indexOf('Avg')]);
        if (score === undefined) continue;
        const metrics: Record<string, number> = {};
        for (let i=2; i<table[0].length; i++) {
          if (table[0][i] === 'Avg') continue;
          const v = num(r[i]); if (v !== undefined) metrics[table[0][i].toLowerCase()] = v;
        }
        rows.push({model:r[0]+(r[1] && r[1] !== '-' ? ` ${r[1]}` : ''), score,
          harness:'DeepSeek HumanEval, greedy', metrics});
      }
    }
    if (!rows.length) throw new Error("No humaneval-multi score rows");
    return rows;
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;
