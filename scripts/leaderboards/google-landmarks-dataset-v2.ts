// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// GLDv2 tests landmark recognition and retrieval. Tables 4 and 5 give test and validation average precision as percentages.
// Model and training dataset together identify each trained system across the tables.
import type { Leaderboard } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2004.01804';
const board: Leaderboard = {
  benchmark: 'google-landmarks-dataset-v2', static: 'paper', url: feed, feed,
  headline: 'The paper reports no overall score, so this is the plain mean of recognition micro-average precision and retrieval mAP@100.',
  terms: 'Paper terms at https://arxiv.org/abs/2004.01804. Google licenses dataset annotations under CC BY 4.0.',
  parts: { recognition: 'Recognition', retrieval: 'Retrieval', recognitionValidation: { name: 'Recognition validation', group: 'Recognition' }, retrievalValidation: { name: 'Retrieval validation', group: 'Retrieval' } },
  async fetch() {
    const html = (await paperHtml(feed)).replace(/<cite\b[^>]*>[\s\S]*?<\/cite>/gi, '');
    const figures = html.match(/<figure\b[^>]*class="ltx_table[^"]*"[^>]*>[\s\S]*?<\/figure>/g) ?? [];
    function results(task: string): string[][] {
      const figure = figures.find(f => f.includes('Baseline results') && f.includes('GLDv2 ' + task + ' task'));
      const t = (figure && paperTables(figure).map(grid)[0]) as string[][] | undefined;
      if (t?.[0].join('|') !== 'Technique|Training Dataset|Testing|Validation') throw new Error('Missing GLDv2 ' + task);
      return t.slice(1);
    }
    const retrieval = results('retrieval');
    const rows = results('recognition').flatMap(([model, training, test, validation]: string[]) => {
      const other = retrieval.find((r: string[]) => r[0] === model && r[1] === training);
      if (!other) return [];
      const recognition = numberCell(test);
      const metrics: Record<string, number> = { recognition, retrieval: numberCell(other[2]), retrievalValidation: numberCell(other[3]) };
      if (validation !== '–') metrics.recognitionValidation = numberCell(validation);
      return [{ model, setting: 'Trained on ' + training, score: (recognition + metrics.retrieval) / 2, metrics }];
    });
    return checked(rows, 10);
  },
};
export default board;
