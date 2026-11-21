// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// LHAW tests performance on underspecified agent tasks. Table 3 reports pass@3
// without clarification and the point gain with the ask_user tool.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2602.10525';
const domains = ['MCP-Atlas', 'TAC', 'SWE-Bench Pro'];
const percentages = ['passAt3', 'checkpoint', 'originalPassAt3', 'originalCheckpoint', 'askRate'];
const key = (domain: string, metric: string) => domain + ' ' + metric;
function pair(cell: string) {
  const m = cell.match(/^(\d+[.]?\d*) \(([+-]\d+[.]?\d*)\)$/);
  if (!m) throw new Error('Missing score or clarification gain: ' + cell);
  return [Number(m[1]), Number(m[1]) + Number(m[2])];
}
export default {
  benchmark: 'lhaw', url: feed, feed, static: 'paper',
  terms: 'Paper and license at https://arxiv.org/abs/2602.10525',
  headline: 'The paper gives no overall pass@3, so the headline is the plain mean of the three domain scores.',
  parts: Object.fromEntries(domains.flatMap(domain => percentages.map((metric, i) =>
    [key(domain, metric), {name: domain + ': ' + ['Pass@3', 'Checkpoint progress', 'Original pass@3', 'Original checkpoint progress', 'Ask rate'][i], unit: '%' as const}]))),
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[1]?.join('|') ===
      'Data|Model|Pass@3|Ckpt|Ask%|Avg/Traj|Score|Gain/Q|Score|Gain/Q');
    if (!table || !table[0].includes('Pass@3 %')) throw new Error('Missing LHAW domain scores');
    const byModel = new Map<string, Map<string, string[]>>();
    for (const [group, model, ...cells] of table.slice(2)) {
      const domain = group.split(' n_tasks=')[0];
      const data = byModel.get(model) ?? new Map<string, string[]>();
      if (!domains.includes(domain) || data.has(domain) || cells.length !== 8) throw new Error('Unexpected domain row');
      data.set(domain, cells);
      byModel.set(model, data);
    }
    const rows: LeaderboardRow[] = [];
    for (const [model, data] of byModel) {
      if (!domains.every(d => data.has(d))) continue;
      for (const mode of [0, 1]) {
        const metrics: Record<string, number> = {};
        for (const [d, [base, baseCkpt, ask, questions, pass, gain, ckpt, gainCkpt]] of data) {
          metrics[key(d, 'passAt3')] = pair(pass)[mode];
          metrics[key(d, 'checkpoint')] = pair(ckpt)[mode];
          metrics[key(d, 'originalPassAt3')] = Number(base);
          metrics[key(d, 'originalCheckpoint')] = Number(baseCkpt);
          if (mode) {
            metrics[key(d, 'askRate')] = Number(ask);
            metrics[key(d, 'questionsPerTrajectory')] = Number(questions);
            metrics[key(d, 'passGainPerQuestion')] = Number(gain);
            metrics[key(d, 'checkpointGainPerQuestion')] = Number(gainCkpt.replace(/\s/g, ''));
          }
        }
        const score = domains.reduce((sum, d) => sum + metrics[key(d, 'passAt3')], 0) / domains.length;
        rows.push({model, setting: mode ? 'With ask_user' : 'Without ask_user', score, metrics});
      }
    }
    return checked(rows, 8);
  },
} satisfies Leaderboard;
