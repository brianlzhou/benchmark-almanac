// WANDR measures whether research agents can find many qualifying records and document their evidence.
// Table 4 reports soft F1 across 500 scheduled tasks. Tables 3 and 5 identify the systems and their costs.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2608.14747';
export default {
  benchmark: 'wandr', static: 'paper', url: 'https://arxiv.org/abs/2608.14747', feed, harnesses: 'system',
  terms: 'arXiv robots.txt allows the HTML paper. Results are credited to the WANDR authors.',
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const scores = tables.find(t => t[0]?.join('|') === 'System|Completed|Soft|Soft|Soft|Hard|Hard|Hard' &&
      t[1]?.join('|') === 'System|Completed|Precision|Recall|F1|Precision|Recall|F1');
    const config = tables.find(t => t[0]?.join('|') === 'System|Solver surface|Configuration|Model / setting|Output delivery');
    const costs = tables.find(t => t[0]?.join('|') === 'System|Completed|Cost|Latency|Latency|Token usage|Token usage' &&
      t[1]?.join('|') === 'System|Completed|$/task|Med. min|P90 min|In M|Out k');
    if (!scores || scores.length < 8 || !config || !costs) throw new Error('WANDR main comparison changed');
    return scores.slice(2).map(([system, count, ...values]) => {
      const info = config.find(r => r[0] === system);
      const usage = costs.find(r => r[0] === system);
      if (!info || !usage || count !== usage[1] || values.length !== 6) throw new Error('Incomplete WANDR system: ' + system);
      const [name, setting] = info[3].split(' / ');
      if (!setting) throw new Error('Missing WANDR system setting');
      const [softPrecision, softRecall, score, hardPrecision, hardRecall, hardF1] = values.map(v => 100 * numberCell(v));
      return { model: name === '—' ? system : name, harness: system + ' — ' + info[2], setting, score,
        cost: numberCell(usage[2]), ...(usage[6] === '–' ? {} : { tokens: numberCell(usage[6]) * 1000 }),
        metrics: { completed: numberCell(count), softPrecision, softRecall, hardPrecision, hardRecall, hardF1,
          medianLatency: numberCell(usage[3]) * 60, p90Latency: numberCell(usage[4]) * 60,
          ...(usage[5] === '–' ? {} : { inputTokens: numberCell(usage[5]) * 1e6 }) } };
    });
  },
} satisfies Leaderboard;
