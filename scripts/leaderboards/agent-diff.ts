// Agent-Diff tests agents on four service APIs. Table 4 gives assertion-weighted
// overall scores and 95% Bayesian credible intervals when documentation is withheld.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2602.11224';
const services = ['Box','Calendar','Linear','Slack'];
function estimate(cell: string) {
  const [value,width] = cell.split('\\pm').map(s => numberCell(s.trim()));
  if (width === undefined) throw new Error('Missing credible interval');
  return {value,low: value-width, high: value+width};
}
const board: Leaderboard = {
  benchmark: 'agent-diff', static: 'paper', url: feed, feed,
  terms: 'The authors publish the benchmark results on arXiv. https://arxiv.org/abs/2602.11224',
  parts: Object.fromEntries(services.map(s => [s,s])),
  stats: {
    passRate: { name: 'Pass rate', unit: '%', better: 'higher' },
    scorePerDollar: { name: 'Score per dollar', unit: 'score', better: 'higher', note: 'Overall benchmark score divided by US dollar cost.' },
    totalTokens: { name: 'Total tokens', unit: 'tokens' },
  },
  aliases: {'devstral-2512': 'devstral-2', 'kimi-k2-0905': 'kimi-k2-sep-2025'},
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[1]?.join('|') === ['Model',...services,'Overall','Pass (%)','Cost ($)','Tokens','Score/$','Rank'].join('|'));
    if (!table) throw new Error('Missing Agent-Diff main table');
    const rows = table.slice(2).map(cells => {
      const overall = estimate(cells[5]);
      const metrics: Record<string,number> = {passRate: numberCell(cells[6]), scorePerDollar: numberCell(cells[9].replaceAll(',',''))};
      if (!/^\d+k$/.test(cells[8])) throw new Error('Unexpected token units');
      metrics.totalTokens = parseInt(cells[8]) * 1000;
      services.forEach((s,i) => {
        const estimateForService = estimate(cells[i+1]);
        metrics[s] = estimateForService.value;
        metrics[s+'Low'] = estimateForService.low;
        metrics[s+'High'] = estimateForService.high;
      });
      // Table 11 lists a different Qwen model than Table 4.
      const model = cells[0] === 'qwen3-vl-235b' ? cells[0]+' (model ID disputed)' : cells[0];
      return {model, setting:'No documentation', trials:3, score:overall.value, low:overall.low, high:overall.high, cost:numberCell(cells[7]), metrics};
    });
    return checked(rows,9);
  },
};
export default board;
