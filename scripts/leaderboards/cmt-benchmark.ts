// CMT-Benchmark: Overall Pass@1 percentages in the dataset card belong to the paper pre-release,
// explicitly preceding v1.0.0. They are not results on the corrected v2 dataset.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text, tables } from '../lib/html.ts';

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
const identity = (name: string) => /^(?:gpt4o|gpt4|gpt4turbo|gpt4v|gpt35turbo|gemini(?:15|20|25)(?:pro|flash|flashlite|flashthinking)|claude35sonnet|deepseek(?:r1|v3))$/i.test(name.replace(/[- ._]/g, '')) ? `${name} (snapshot unspecified)` : name;

const FEED = "https://huggingface.co/datasets/CMTBenchmark/cmt_benchmark/resolve/main/README.md";
const board: Leaderboard = {
  "benchmark": "cmt-benchmark",
  "url": "https://huggingface.co/datasets/CMTBenchmark/cmt_benchmark",
  "feed": "https://huggingface.co/datasets/CMTBenchmark/cmt_benchmark/resolve/main/README.md",
  "terms": "The official dataset card declares the MIT license.",
  "aliases": {
    "GPT-o3": "o3",
    "GPT-o4-mini": "o4-mini",
    "Claude 4.0 Sonnet": "claude-sonnet-4",
    "Claude 4.0 Opus": "claude-opus-4",
    "Claude 4.1 Opus": "claude-opus-4-1",
    "LLaMA Maverick": "llama-4-maverick"
  }
,
  async fetch() {
    const source = await fetchText(FEED);
    const data = markdownTables(source);
    const rows: LeaderboardRow[] = [];
    {
      const t = data.find(t => new RegExp("^Model \\| Overall$", "i").test(t.slice(0, 1).flat().join(" | ")));
      if (!t || !new RegExp("^Model \\| Overall$", "i").test(t.slice(0, 1).flat().join(" | "))) throw new Error("Results table changed");
      for (const r of t.slice(1)) {
        const value = numeric(r[1]);
        let model = clean(r[0] ?? "");
        if (!model || value === undefined || /^(?:human(?: performance)?|random(?: chance)?|majority|oracle)$/i.test(model)) continue;
        const row: LeaderboardRow = { model: identity(model), score: value * 1 };
        row.setting = "paper pre-release (before v1.0.0)";
        rows.push(row);
      }
    }
    if (!rows.length) throw new Error("No scored model rows in the published results");
    return rows;
  },
};
export default board;
