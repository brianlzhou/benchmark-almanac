// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// Tables 1 through 3 score single-image, text-intensive, and multi-image editing on the same five-point scale.
import type { Leaderboard } from './types.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2610.41210';
const parts = { single: 'SingleImageEdit', text: 'TextEdit', multi: 'MultiImageEdit' };
const board: Leaderboard = {
  benchmark: 'wegeneditbench', url: feed, feed, static: 'paper', parts,
  aliases: { "Nano-Banana-Pro": "gemini-3-pro-image-preview-nano-banana-pro" },
  terms: 'The authors publish their results on arXiv. https://arxiv.org/licenses/nonexclusive-distrib/1.0/',
  headline: 'The paper reports no score across all three editing tasks, so this is their plain mean.',
  async fetch() {
    const figures = (await paperHtml(feed)).match(/<figure\b[^>]*>[\s\S]*?<\/figure>/gi) ?? [];
    const results = new Map<string, Record<string, number>>();
    for (const [key, name] of Object.entries(parts)) {
      const figure = figures.find(f => f.includes('Quantitative comparison on WeGenEditBench-' + name + '.'));
      const table = paperTables(figure ?? '').map(grid)[0];
      if (table?.[0][0] !== 'Model Name' || !table[0].at(-1)?.startsWith('Overall')) throw new Error('Missing ' + name);
      for (const [model, ...values] of table.slice(1)) {
        if (!model || /^(Open|Closed)-source Models$/.test(model)) continue;
        const metrics = results.get(model) ?? {};
        if (key in metrics) throw new Error('Repeated result for ' + model);
        metrics[key] = numberCell(values.at(-1)!);
        results.set(model, metrics);
      }
    }
    const rows = Array.from(results).filter(([, m]) => Object.keys(m).length === 3)
      .map(([model, metrics]) => ({ model, metrics, score: (metrics.single + metrics.text + metrics.multi) / 3 }));
    return checked(rows, 6);
  },
};
export default board;
