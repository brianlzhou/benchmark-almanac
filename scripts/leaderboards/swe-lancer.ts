import type { Leaderboard } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
const URL = 'https://arxiv.org/html/2502.12115';
const money = (s: string) => parseFloat(s.replace('$', '')) * (/M/.test(s) ? 1e6 : /k/.test(s) ? 1e3 : 1);
const models: Record<string, string> = {'GPT-4o': 'gpt-4o-2024-08-06', 'o1': 'o1', '3.5 Sonnet': 'claude-3-5-sonnet-20240620'};
const board: Leaderboard = {
  benchmark: 'swe-lancer', parts: {
  'IC SWE (Full)': { name: 'IC SWE full', group: 'Task type' },
  'SWE Manager (Full)': { name: 'SWE manager full', group: 'Task type' },
}, url: URL, feed: URL + ' (SWE-Lancer Full pass@1)', terms: PAPER_TERMS,
  aliases: {'claude-3-5-sonnet-20240620': 'claude-3-5-sonnet'},
  async fetch() {
    const t = inlinePaperTables(await paperHtml(URL)).find(t => t[0]?.[3] === 'Reasoning Effort');
    if (!t) throw new Error('SWE-Lancer main table missing');
    const rows = t.slice(1).filter(r => r[2] === 'SWE-Lancer Full').map(r => {
      const metrics: Record<string, number> = {dollarsEarned: money(r[5].split('/')[0]), totalPayout: money(r[5].split('/')[1]), earnRate: parseFloat(r[6])};
      for (const domain of ['IC SWE (Full)', 'SWE Manager (Full)']) {
        const sub = t.find(x => x[0] === r[0] && x[2] === domain);
        if (sub) metrics[domain] = parseFloat(sub[4]);
      }
      return {model: models[r[0]] ?? r[0], score: parseFloat(r[4]),
        setting: 'pass@1; user tool enabled' + (r[3] === 'N/A' ? '' : '; reasoning ' + r[3]), metrics};
    });
    if (rows.length < 3) throw new Error('SWE-Lancer full results missing');
    return rows;
  },
};
export default board;
