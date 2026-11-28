// GaRAGe evaluates grounded answers to retrieval questions. Table 2 reports relevance-aware
// factuality (RAF). Tables 3 and 4 report deflection rates and attribution quality.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = "https://arxiv.org/html/2506.07671";

export default {
  benchmark: "garage", static: 'paper', url: "https://arxiv.org/abs/2506.07671", feed,
  terms: "arXiv allows this HTML path in robots.txt. Results are credited to the paper authors. The paper lists http://creativecommons.org/licenses/by-nc-sa/4.0/.",
  stats: {
    eligibility: { name: 'Eligibility', unit: '%', better: 'higher' },
    unadjustedFactuality: { name: 'Unadjusted factuality', unit: '%', better: 'higher' },
    factuality: { name: 'Factuality', unit: '%', better: 'higher' },
    uRAF: { name: 'Unadjusted relevance-aware factuality', unit: '%', better: 'higher' },
    truePositive: { name: 'Deflection true positive rate', unit: '%', better: 'higher' },
    falsePositive: { name: 'Deflection false positive rate', unit: '%', better: 'lower' },
    attributionPrecision: { name: 'Attribution precision', unit: '%', better: 'higher' },
    attributionRecall: { name: 'Attribution recall', unit: '%', better: 'higher' },
    attributionF1: { name: 'Attribution F1', unit: '%', better: 'higher' },
  },
  aliases: {"Nova Micro":"amazon-nova-micro","Nova Lite":"amazon-nova-lite","Nova Pro":"amazon-nova-pro", "Claude Haiku": "claude-3-5-haiku", "Claude Sonnet": "claude-3-5-sonnet-october-2024", "Gpt-4o": "gpt-4o-nov-2024", "Qwen 14b": "qwen2-5-14b", "Qwen 32b": "qwen2-5-32b"},
  async fetch() {
    const html = await paperHtml(feed);
    const tables = flatPaperTables(html.replace(/<cite\b[^>]*>[\s\S]*?<\/cite>/gi, '')).map(grid);
    const table = tables.find(table => table[0]?.join("|") === "Model|Eligibility|Unadjusted Factuality|Factuality|uRAF|RAF");
    if (!table) throw new Error('Missing result table or unexpected columns for garage');
    const rows: LeaderboardRow[] = [];
    const deflection = tables.find(t => t[0]?.join('|') === 'Model|True Positive|False Positive');
    const attribution = tables.find(t => t[0]?.join('|') === 'Model|Precision|Recall|F 1');
    let open = false;
    for (const cells of table.slice(1)) {
      if (cells.every(v => v === cells[0])) {
        open = cells[0] === 'Open-weights models';
        continue;
      }
      const d = deflection?.find(r => r[0].toLowerCase() === cells[0].toLowerCase());
      const a = attribution?.find(r => r[0].toLowerCase() === cells[0].toLowerCase());
      if (!d || !a) throw new Error('Missing GaRAGe auxiliary measures');
      if (cells.length !== 6 || !cells[0]) throw new Error("Incomplete result row");
      rows.push({
        model: cells[0], score: numberCell(cells[5]),
        open, metrics: { eligibility: numberCell(cells[1]), unadjustedFactuality: numberCell(cells[2]), factuality: numberCell(cells[3]),
          uRAF: numberCell(cells[4]), truePositive: numberCell(d[1]), falsePositive: numberCell(d[2]),
          attributionPrecision: numberCell(a[1]), attributionRecall: numberCell(a[2]), attributionF1: numberCell(a[3]) },
      });
    }
    if (rows.length < 11) throw new Error("Expected at least 11 results for garage");
    return rows;
  },
} satisfies Leaderboard;
