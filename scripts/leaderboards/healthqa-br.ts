// HealthQA-BR tests clinical knowledge with Brazilian licensing and residency exams.
// The dataset card gives overall accuracy and results for three exam groups as fractions.
import type { Leaderboard } from './types.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';
import { fetchText } from '../lib/util.ts';

const url = 'https://huggingface.co/datasets/Larxel/healthqa-br';
const feed = url + '/raw/main/README.md';
const parts = { revalida: 'Revalida', residencia: 'Enare Residência Médica', multiprofissional: 'Enare Multiprofissional' };
const board: Leaderboard = {
  benchmark: 'healthqa-br', url, feed, parts,
  aliases: { 'Exaone 3.5 32b': 'exaone-3-5-32b-instruct' },
  terms: 'The dataset card specifies CC BY 4.0 at https://creativecommons.org/licenses/by/4.0/.',
  async fetch() {
    const table = markdownTables(await fetchText(feed)).find(t =>
      t[0].join('|') === ['Model', ...Object.values(parts), 'Overall Accuracy'].join('|'));
    if (!table) throw new Error('Missing HealthQA-BR results table');
    return checked(table.slice(1).map(row => {
      if (row.length !== 5) throw new Error('Missing HealthQA-BR scores');
      const values = row.slice(1).map(cell => Number((100 * numberCell(cell)).toFixed(4)));
      return { model: row[0], score: values[3], metrics: Object.fromEntries(Object.keys(parts).map((key, i) => [key, values[i]])) };
    }), 21);
  },
};
export default board;
