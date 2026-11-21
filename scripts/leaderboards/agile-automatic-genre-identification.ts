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
    'x-ginco': { name: 'X-GINCO Macro F1', group: 'Test set', unit: 'score' },
    'en-ginco': { name: 'EN-GINCO Macro F1', group: 'Test set', unit: 'score' },
    English: { name: 'English Macro F1', group: 'Language', unit: 'score' },
    Maltese: { name: 'Maltese Macro F1', group: 'Language', unit: 'score' },
    Greek: { name: 'Greek Macro F1', group: 'Language', unit: 'score' },
    Turkish: { name: 'Turkish Macro F1', group: 'Language', unit: 'score' },
    Albanian: { name: 'Albanian Macro F1', group: 'Language', unit: 'score' },
    Icelandic: { name: 'Icelandic Macro F1', group: 'Language', unit: 'score' },
    Ukrainian: { name: 'Ukrainian Macro F1', group: 'Language', unit: 'score' },
    Catalan: { name: 'Catalan Macro F1', group: 'Language', unit: 'score' },
    Macedonian: { name: 'Macedonian Macro F1', group: 'Language', unit: 'score' },
    Croatian: { name: 'Croatian Macro F1', group: 'Language', unit: 'score' },
    Slovenian: { name: 'Slovenian Macro F1', group: 'Language', unit: 'score' },
  },
  stats: {
    'x-gincoMicroF1': { name: 'X-GINCO Micro F1', unit: 'score', better: 'higher' },
    'en-gincoMicroF1': { name: 'EN-GINCO Micro F1', unit: 'score', better: 'higher' },
    EnglishMicroF1: { name: 'English Micro F1', unit: 'score', better: 'higher' },
    MalteseMicroF1: { name: 'Maltese Micro F1', unit: 'score', better: 'higher' },
    GreekMicroF1: { name: 'Greek Micro F1', unit: 'score', better: 'higher' },
    TurkishMicroF1: { name: 'Turkish Micro F1', unit: 'score', better: 'higher' },
    AlbanianMicroF1: { name: 'Albanian Micro F1', unit: 'score', better: 'higher' },
    IcelandicMicroF1: { name: 'Icelandic Micro F1', unit: 'score', better: 'higher' },
    UkrainianMicroF1: { name: 'Ukrainian Micro F1', unit: 'score', better: 'higher' },
    CatalanMicroF1: { name: 'Catalan Micro F1', unit: 'score', better: 'higher' },
    MacedonianMicroF1: { name: 'Macedonian Micro F1', unit: 'score', better: 'higher' },
    CroatianMicroF1: { name: 'Croatian Micro F1', unit: 'score', better: 'higher' },
    SlovenianMicroF1: { name: 'Slovenian Micro F1', unit: 'score', better: 'higher' },
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
