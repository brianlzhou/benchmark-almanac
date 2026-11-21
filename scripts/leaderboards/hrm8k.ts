// HRM8K tests math reasoning on parallel Korean and English questions. The paper averages accuracy across five sources for each prompting condition.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

const FEED = 'https://arxiv.org/html/2501.02448';

const board: Leaderboard = {
  benchmark: 'hrm8k', static: 'paper',
  url: 'https://arxiv.org/abs/2501.02448',
  feed: FEED,
  terms: PAPER_TERMS,
  aliases: {"Llama-3.1-70B-Instruct": "llama-3-1-70b"},
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(FEED));
    const scoreTables = tables.filter(t => t[0]?.join('|') === 'Model|GSM8K|MATH|Omni-MATH|MMMLU|KSM|Avg.');
    if (scoreTables.length !== 2) throw new Error('Missing HRM8K language comparisons');
    const rows: LeaderboardRow[] = [];
    board.parts = { gsm8k: 'GSM8K', math: 'MATH', omni: 'Omni-MATH', mmmlu: 'MMMLU', ksm: 'KSM' };
    const read = (cells: string[], model: string, setting?: string) => {
      if (cells.length !== 7 || cells.slice(1).some(c => !/^\d+(?:\.\d+)?$/.test(c))) throw new Error('Invalid HRM8K row');
      const [gsm8k, math, omni, mmmlu, ksm, score] = cells.slice(1).map(Number);
      return { model, setting, score, metrics: { gsm8k, math, omni, mmmlu, ksm } };
    };
    for (const t of scoreTables) {
      let setting = '';
      for (const cells of t.slice(1)) {
        if (cells.every(c => c === cells[0])) { setting = cells[0]; continue; }
        if (!setting) throw new Error('Missing HRM8K prompting condition');
        rows.push(read(cells, cells[0], setting));
      }
    }
    if (rows.length < 24 || new Set(rows.map(r => r.setting)).size !== 4) throw new Error('Incomplete HRM8K language comparisons');
    const main = tables.find(t => t[0]?.join('|') === 'Models|GSM8K|MATH|OMNI_MATH|MMMLU|KSM|Avg.');
    if (!main) throw new Error('Missing HRM8K main table');
    for (const cells of main.slice(1)) {
      if (cells.every(c => c === cells[0]) || cells[0].endsWith('-Prompting')) continue;
      rows.push(read(cells, cells[0] === 'Ours' ? 'Qwen2.5-7B-Instruct (UST)' : cells[0]));
    }
    if (rows.length < 29) throw new Error('Incomplete HRM8K model comparison');
    const usage = tables.find(t => t[0]?.join('|') === '|HRM8K|ELO|Token Consum.');
    if (!usage || usage.length !== 4) throw new Error('Missing HRM8K token comparison');
    for (const [method, score, elo, tokens] of usage.slice(1)) {
      const row = method === 'K2K' ? rows.find(r => r.model === 'Qwen2.5-7B' && r.setting?.endsWith('(K2K)'))
        : method === 'UST' ? rows.find(r => r.model.endsWith('(UST)')) : undefined;
      const run: LeaderboardRow = row ?? { model: 'Qwen2.5-7B-Instruct', setting: method, score: Number(score) };
      if (run.score !== Number(score) || !/^\d[\d,]*$/.test(tokens)) throw new Error('Inconsistent HRM8K token comparison');
      run.metrics = { ...run.metrics, elo: Number(elo), tokenConsumption: Number(tokens.replaceAll(',', '')) };
      if (!row) rows.push(run);
    }
    return rows;
  },
};
export default board;
