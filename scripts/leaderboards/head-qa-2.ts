// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// HEAD-QA v2 tests multiple-choice healthcare exam questions. Tables 2 to 4 give English and Spanish accuracy.
// The paper also reports exam scores and the percentage of unanswered questions for prompts that permit abstention.
import type { Leaderboard } from './types.ts';
import { checked, grid, flatPaperTables } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2511.15355';
const board: Leaderboard = {
  benchmark: 'head-qa-2', static: 'paper', url: feed, feed,
  terms: 'The authors publish their results under the paper terms at https://arxiv.org/abs/2511.15355.',
  headline: 'The paper reports no overall accuracy, so this is the plain mean of its English and Spanish accuracies.',
  parts: { en: 'English', es: 'Spanish' },
  stats: { enExamScore: { name: 'English exam score', unit: 'score', better: 'higher' }, esExamScore: { name: 'Spanish exam score', unit: 'score', better: 'higher' }, enUnanswered: { name: 'English unanswered rate', unit: '%', better: 'lower' }, esUnanswered: { name: 'Spanish unanswered rate', unit: '%', better: 'lower' } },
  async fetch() {
    const all = flatPaperTables(await paperHtml(feed)).map(grid);
    const tables = all.filter(t => t[0]?.[2] === 'English (en)' && t[0].includes('Spanish (es)'));
    if (tables.length !== 3) throw new Error('Missing HEAD-QA v2 results table');
    return checked(tables.flatMap(t => {
      const strategy = t[0][0] === 'Strategy';
      const columns = strategy ? 'Strategy|Model|Acc|Score|Acc|Score' : 'Prompt|Model|Acc|Score|P_{na}|Acc|Score|P_{na}';
      if (t[1].join('|') !== columns) throw new Error('Missing accuracy or exam score columns');
      const es = strategy ? 4 : 5;
      return t.slice(2).map(r => {
        const metrics: Record<string, number> = { en: numberCell(r[2]), es: numberCell(r[es]),
          enExamScore: numberCell(r[3]), esExamScore: numberCell(r[es + 1]) };
        if (!strategy) {
          metrics.enUnanswered = numberCell(r[4]);
          metrics.esUnanswered = numberCell(r[7]);
        }
        return { model: r[1], setting: r[0], score: (metrics.en + metrics.es) / 2, metrics };
      });
    }), 20);
  },
};
export default board;
