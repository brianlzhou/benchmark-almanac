// LEXTREME tests multilingual legal text understanding. The two README leaderboards give dataset and language aggregates.
// "The final LEXTREME score is computed using the harmonic mean of the dataset and the language aggregate score."
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://raw.githubusercontent.com/JoelNiklaus/LEXTREME/HEAD/README.md';
const board: Leaderboard = {
  benchmark: 'lextreme', url: 'https://github.com/JoelNiklaus/LEXTREME#leaderboard', feed,
  terms: 'The authors publish their results on GitHub under https://docs.github.com/en/site-policy/github-terms/github-terms-of-service.',
  headline: 'LEXTREME weights its dataset and language aggregates equally using their harmonic mean.',
  async fetch() {
    const tables = markdownTables(await fetchText(feed));
    const models = tables.find(t => t[0][0] === 'Model' && t[0][2] === 'Parameters');
    if (!models) throw new Error('Missing LEXTREME model parameters');
    const normalize = (name: string) => name.toLowerCase().replace(/[ -]/g, '');
    const datasets = tables.find(t => t[0][1] === 'BCD' && t[0].at(-1) === 'Agg.');
    const languages = tables.find(t => t[0][1] === 'bg' && t[0].at(-1) === 'Agg.');
    if (datasets?.[0].length !== 13 || languages?.[0].length !== 26) throw new Error('Missing LEXTREME measures');
    const parts: NonNullable<Leaderboard['parts']> = {};
    const rows = datasets.slice(1).map(d => {
      const l = languages.slice(1).find(row => row[0] === d[0]);
      if (!l) throw new Error('Missing language scores for ' + d[0]);
      const metrics: Record<string, number> = {};
      for (const [table, group, row] of [[datasets, 'Dataset', d], [languages, 'Language', l]] as const) {
        table[0].slice(1).forEach((name, i) => {
          const key = name === 'Agg.' ? group + ' aggregate' : name;
          metrics[key] = numberCell(row[i + 1]);
          parts[key] = { name: key, group };
        });
      }
      const a = metrics['Dataset aggregate'], b = metrics['Language aggregate'];
      const metadata = models.slice(1).find(r => normalize(r[0]) === normalize(d[0]));
      const size = metadata?.[2].match(/^(\d+)M$/);
      if (!size) throw new Error('Missing model size for ' + d[0]);
      return { model: d[0], params: Number(size[1]) / 1000, score: a === 0 || b === 0 ? 0 : 2 * a * b / (a + b), metrics };
    });
    board.parts = parts;
    return checked(rows, 8);
  },
};
export default board;
