// GSM-Plus evaluates robustness to arithmetic problem variations. The paper compares models by accuracy across all eight perturbations.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

const FEED = 'https://arxiv.org/html/2402.19255';
function number(value: string): number {
  const clean = value?.trim().replace(/%$/, '');
  if (!/^-?\d+(?:\.\d+)?$/.test(clean)) throw new Error(`Invalid paper score: ${value}`);
  return Number(clean);
}

const board: Leaderboard = {
  stats:{gsm8k:{name:'GSM8K accuracy',unit:'%',better:'higher'},pdr:{name:'Perturbation degradation rate',unit:'%',better:'lower'},asp:{name:'Answer sensitivity percentage',unit:'%',better:'higher'}},
  benchmark: 'gsm-plus', static: 'paper',
  url: 'https://arxiv.org/abs/2402.19255',
  feed: FEED,
  terms: PAPER_TERMS,
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(FEED));
    const table = tables.find(t => t[0]?.[0] === "Model" && t[0]?.[3] === "Output Format" && t[0]?.[5] === "GSM-Plus" && t[0]?.[6] === "PDR (%) \\downarrow" && t[0]?.[7] === "ASP (%) \\uparrow");
    if (!table) throw new Error("Missing gsm-plus results table");
    const rows: LeaderboardRow[] = [];
    let size = '';
    for (const cells of table.slice(1)) {
      if (cells[0] === 'Human') continue;
      if (cells.every(c => c === cells[0])) {
        size = cells[0].match(/in mathematics \((\d+B)\)/)?.[1] ?? '';
        continue;
      }
      const model = [cells[0].replace(/\\hdottedline\s*|\s*‡/g, '').trim(), size].filter(Boolean).join(' ');
      const score = number(cells[5]);
      rows.push({ model, score, setting: cells[3], metrics: { gsm8k: number(cells[4]), pdr: number(cells[6]), asp: number(cells[7]) } });
    }
    if (rows.length < 25) throw new Error("Incomplete gsm-plus comparison");
    return rows;
  },
};
export default board;
