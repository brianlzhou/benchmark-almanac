// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// KorMedMCQA-Mixed combines text and vision questions from the Korean medical licensing examination.
// The project leaderboard publishes total accuracy for each year and separate text and vision accuracies.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://kormedmcqa-v.github.io/results.json';
type Entry = { size: number | null, is_reasoning: boolean,
  kormedmcqa_mixed: Record<string, { total: number, text: number, vision: number }> };
const parts = Object.fromEntries(['2022', '2023'].flatMap(year => [
  [year, { name: 'KorMedMCQA-Mixed-' + year, group: 'Exam year' }],
  [year + 'Text', { name: 'Text', group: year }], [year + 'Vision', { name: 'Vision', group: year }],
]));
const board: Leaderboard = {
  benchmark: 'kormedmcqa-mixed', url: 'https://kormedmcqa-v.github.io/', feed, parts,
  terms: 'The leaderboard code uses MIT and the dataset uses CC BY-NC-SA 4.0. https://kormedmcqa-v.github.io/',
  async fetch() {
    const data = await fetchJson<Record<string, Entry>>(feed);
    return checked(Object.entries(data).map(([model, entry]) => {
      const metrics: Record<string, number> = {};
      for (const year of ['2022', '2023']) {
        const { total, text, vision } = entry.kormedmcqa_mixed[year];
        if (![total, text, vision].every(value => Number.isFinite(value) && value >= 0 && value <= 100))
          throw new Error('Missing mixed-exam accuracy for ' + model);
        Object.assign(metrics, { [year]: total, [year + 'Text']: text, [year + 'Vision']: vision });
      }
      return { model, score: (metrics['2022'] + metrics['2023']) / 2, metrics, params: entry.size ?? undefined,
        setting: entry.is_reasoning ? 'Zero-shot, reasoning' : 'Zero-shot, instruct' };
    }), 51);
  },
};
export default board;
