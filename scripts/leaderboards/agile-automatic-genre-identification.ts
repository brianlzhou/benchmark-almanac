// AGILE tests automatic genre identification on the X-GINCO and EN-GINCO test sets.
// The source reports no overall score. The headline is the plain mean of the two Macro F1 parts, computed by this importer.
// This importer reads the authors' published results JSON.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://raw.githubusercontent.com/TajaKuzman/AGILE-Automatic-Genre-Identification-Benchmark/main/results/results.json';
type SourceRow = { Model: string; 'Test Dataset': string; 'Macro F1': number; 'Micro F1': number };
const board: Leaderboard = {
  benchmark: 'agile-automatic-genre-identification',
  url: 'https://github.com/TajaKuzman/AGILE-Automatic-Genre-Identification-Benchmark',
  feed: FEED,
  terms: 'The AGILE repository is public. Follow its license and cite the authors. https://github.com/TajaKuzman/AGILE-Automatic-Genre-Identification-Benchmark',
  headline: 'The source reports no overall score, so this is the plain mean of the two Macro F1 test-set scores.',
  parts: {
    xGinco: { name: 'X-GINCO Macro F1', group: 'Test set', unit: 'score' },
    enGinco: { name: 'EN-GINCO Macro F1', group: 'Test set', unit: 'score' },
  },
  stats: {
    xGincoMicro: { name: 'X-GINCO Micro F1', unit: 'score', better: 'higher' },
    enGincoMicro: { name: 'EN-GINCO Micro F1', unit: 'score', better: 'higher' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const source = await fetchJson<SourceRow[]>(FEED);
    const byModel = new Map<string, Map<string, SourceRow>>();
    for (const row of source) {
      if (!row.Model || !['x-ginco', 'en-ginco'].includes(row['Test Dataset'])) throw new Error('Unexpected AGILE result row');
      if (![row['Macro F1'], row['Micro F1']].every(Number.isFinite)) throw new Error('Invalid AGILE score');
      const model = byModel.get(row.Model) ?? new Map<string, SourceRow>();
      model.set(row['Test Dataset'], row);
      byModel.set(row.Model, model);
    }
    const rows: LeaderboardRow[] = [];
    for (const [model, sets] of byModel) {
      if (model.startsWith('dummy-')) continue;
      const x = sets.get('x-ginco');
      const en = sets.get('en-ginco');
      if (!x || !en) continue;
      const metrics = {
        xGinco: x['Macro F1'],
        enGinco: en['Macro F1'],
        xGincoMicro: x['Micro F1'],
        enGincoMicro: en['Micro F1'],
      };
      rows.push({ model, score: (metrics.xGinco + metrics.enGinco) / 2, metrics });
    }
    return checked(rows, 10);
  },
};
export default board;
