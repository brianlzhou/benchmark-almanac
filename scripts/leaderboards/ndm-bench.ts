// The source reports no overall score. The headline is the plain mean of the 4 parts, computed by this importer.
// Table 2 reports the percentage of prompts with five identical answers in each policy domain.
// This measures repeatability. Table A6 identifies the models behind the paper's abbreviated names.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell, paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2608.05180';
const domains = ['Escalation', 'Arms control', 'Non-proliferation', 'Proliferation'];
const keys = ['escalation', 'armsControl', 'nonProliferation', 'proliferation'];
const board: Leaderboard = {
  benchmark: 'ndm-bench', static: 'paper', url: feed, feed, terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  headline: 'The paper reports no overall agreement percentage, so this is the plain mean of five-run agreement across its four domains.',
  parts: Object.fromEntries(keys.map((k,i) => [k, domains[i]])),
  aliases: { 'Llama 4 Maverick-17B Instruct': 'llama-4-maverick', 'Gemini 3.1 Pro Preview': 'gemini-3-1-pro',
    'Qwen3-235B': 'qwen3-235b-a22b-instruct-jul-2025', 'ERNIE 4.5-300B': 'ernie-4-5-300b-a47b' },
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(t => t[1]?.filter(c => c === 'All 5 agree').length === 4);
    const models = tables.find(t => t[0]?.[1] === 'Snapshot / version string');
    if (!table || !models) throw Error('Missing model or five-run agreement table');
    const rows: LeaderboardRow[] = [];
    for (const cells of table.slice(2)) {
      if (cells[0] === 'All models') continue;
      const model = models.slice(1).find(r => r[0].startsWith(cells[0]))?.[0];
      if (!model) throw Error('Unknown model family: ' + cells[0]);
      const metrics: Record<string,number> = {};
      let sum = 0;
      for (const [i, domain] of domains.entries()) {
        const col = table[0].findIndex((d,j) => d === domain && table[1][j] === 'All 5 agree');
        if (!cells[col]?.endsWith('%') || table[1][col-1] !== '\\alpha') throw Error('Missing agreement column');
        metrics[keys[i]] = numberCell(cells[col].slice(0,-1));
        metrics[keys[i] + 'Alpha'] = numberCell(cells[col-1]);
        sum += metrics[keys[i]];
      }
      rows.push({ model, score: sum / domains.length, trials: 5, metrics });
    }
    return checked(rows, 8);
  },
};
export default board;
