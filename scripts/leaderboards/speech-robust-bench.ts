// The source reports no overall score. The headline is the plain mean of the 9 parts, computed by this importer.
// Speech Robust Bench tests transcription under audio distortions. Table 7 gives average normalized word error
// rate degradation (NWERD) per corpus. Lower is better. Clean WER and adversarial WERD use different measures.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2403.07937';
const datasets = ['MLS-DU', 'LibriSpeech', 'TEDLIUM', 'ami', 'chime', 'CV', 'MLS-ES', 'CV:es', 'MLS-FR'];
const board: Leaderboard = {
  benchmark: 'speech-robust-bench', static: 'paper', url: feed, feed,
  terms: 'The authors publish these tables under the license on the arXiv record. https://arxiv.org/abs/2403.07937',
  headline: 'The paper reports no overall score, so this is the plain mean of normalized word error rate degradation across nine evaluation corpora.',
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(t => t[1]?.slice(0,4).join('|') === 'lang|dataset|model (abrv)|WER');
    const names = tables.find(t => t[0]?.slice(0,3).join('|') === 'Lang|Model|Abrv.');
    if (!table || !names || table[0][13] !== 'AVG' || !table[1].includes('NWERD')) throw new Error('Speech Robust Bench tables changed');
    const models = new Map(names.slice(1).map(r => [r[2], r[1].split(' (')[0]]));
    const byModel = new Map<string, Record<string, number>>();
    const parts: NonNullable<Leaderboard['parts']> = {};
    for (const cells of table.slice(2)) {
      const [, dataset, model] = cells;
      if (cells.length !== 17 || !datasets.includes(dataset)) throw new Error('Unexpected Speech Robust Bench row');
      const metrics = byModel.get(model) ?? {};
      if (dataset in metrics) throw new Error('Duplicate score for ' + model + ' on ' + dataset);
      metrics[dataset] = numberCell(cells[13]);
      parts[dataset] = {name: dataset, group: 'Average NWERD', better: 'lower'};
      cells.slice(3).forEach((value, j) => {
        const col = 3 + j;
        if (value === '-' || col === 13) return;
        const name = col === 16 ? 'Average adversarial WERD' : table[0][col];
        const key = dataset + '/' + name;
        metrics[key] = numberCell(value);
        parts[key] = {name, group: dataset, better: 'lower'};
      });
      byModel.set(model, metrics);
    }
    board.parts = parts;
    const rows: LeaderboardRow[] = [];
    for (const [shortName, metrics] of byModel) {
      if (!datasets.every(d => d in metrics)) continue;
      const model = models.get(shortName);
      if (!model) throw new Error('Unknown model abbreviation ' + shortName);
      rows.push({model, metrics, score: datasets.reduce((sum, d) => sum + metrics[d], 0) / datasets.length});
    }
    return checked(rows, 4);
  },
};
export default board;
