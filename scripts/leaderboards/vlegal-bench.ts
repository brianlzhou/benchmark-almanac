// VLegal-Bench tests Vietnamese legal reasoning across 22 tasks. Tables 3 and 4 give zero-shot scores.
// Their metrics have different scales. The headline is Table 3's first measure, legal entity recognition accuracy (%).
import type { Leaderboard, BoardPart } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2512.14554';
const board: Leaderboard = {
  benchmark: 'vlegal-bench', static: 'paper', url: feed, feed,
  aliases: { 'gpt-4o-mini (snapshot unspecified)': 'gpt-4o-mini' },
  terms: 'The authors publish the results on arXiv. https://arxiv.org/abs/2512.14554',
  headline: 'The paper gives no overall score. The headline is legal entity recognition accuracy in percent, the first result in Table 3.',
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const tasks = tables.find(t => t[0]?.slice(0, 3).join() === 'Level,ID,Task');
    if (!tasks) throw new Error('Missing task names');
    const names = new Map(tasks.slice(1).map(r => [r[1], r[2]]));
    const parts: Record<string, BoardPart> = {};
    const models = new Map<string, Record<string, number>>();
    for (const [first, width] of [['1.1 Acc', 10], ['3.1 Acc', 12]] as const) {
      const table = tables.find(t => t[1]?.[2] === first && t[1].length === width + 2);
      if (!table) throw new Error('Missing legal task results for ' + first);
      for (const [, model, ...values] of table.slice(2)) {
        if (values.length !== width) throw new Error('Changed legal results width');
        const metrics = models.get(model) ?? {};
        values.forEach((v, i) => {
          const [id, type] = table[1][i + 2].split(' ');
          const labels = type.split('/');
          const scores = v.split('/');
          if (!names.has(id) || labels.length !== scores.length) throw new Error('Changed metric: ' + id);
          labels.forEach((label, j) => {
            const key = 't' + id.replace('.', '') + (labels.length > 1 ? j : '');
            parts[key] = { name: names.get(id) + ' (' + label + ')', unit: label === 'R-L' ? 'score' : '%' };
            if (!/^\d+(?:\.\d+)?$/.test(scores[j].trim())) throw new Error('Invalid score in ' + id);
            metrics[key] = Number(scores[j]);
          });
        });
        models.set(model, metrics);
      }
    }
    board.parts = parts;
    return checked([...models].map(([model, metrics]) => {
      if (Object.keys(metrics).length !== 23) throw new Error('Incomplete task coverage for ' + model);
      return { model, metrics, score: metrics.t11, setting: 'Zero-shot without reasoning' };
    }), 23);
  },
};
export default board;
