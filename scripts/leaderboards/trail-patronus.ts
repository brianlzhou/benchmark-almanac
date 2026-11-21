// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// TRAIL tests whether a judge can locate and classify errors in agent traces.
// The TRAIL-SWE and TRAIL-GAIA leaderboard CSVs rank judges by joint accuracy on a 0 to 1 scale.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const url = 'https://huggingface.co/spaces/PatronusAI/TRAIL';
const source = (split: string) => url + '/raw/main/leaderboard_' + split + '.csv';
const board: Leaderboard = {
  benchmark: 'trail-patronus', url, feed: source('swe'),
  terms: 'Hugging Face hosts the public TRAIL Space under its terms. https://huggingface.co/terms-of-service',
  headline: 'The leaderboard ranks SWE and GAIA separately, so the headline is the plain mean of their joint accuracies.',
  parts: { swe: 'TRAIL-SWE', gaia: 'TRAIL-GAIA' },
  aliases: {
    'Gemini-2.5-Pro-Preview-05-06': 'gemini-2-5-pro-may-2025', 'Gemini-2.5-Flash-Preview-04-17': 'gemini-2-5-flash-apr-2025',
    'Llama-4-Maverick-17B-128E-Instruct': 'llama-4-maverick', 'Llama-4-Scout-17B-16E-Instruct': 'llama-4-scout',
  },
  async fetch() {
    const models = new Map<string, { metrics: Record<string, number>; dates: Set<string> }>();
    for (const split of ['swe', 'gaia']) {
      const table = parseCsv(await fetchText(source(split)));
      if (!table.length || !['Model', 'Joint Accuracy', 'Categorical F1', 'Location Accuracy', 'Date'].every(k => k in table[0])) throw Error('Missing TRAIL ' + split + ' columns');
      for (const row of table) {
        if (row['Joint Accuracy'] === 'CLE') continue;
        const entry = models.get(row.Model) ?? { metrics: {}, dates: new Set<string>() };
        if (split in entry.metrics) throw Error('Duplicate TRAIL model: ' + row.Model);
        for (const [suffix, column] of [['', 'Joint Accuracy'], ['CategoricalF1', 'Categorical F1'], ['LocationAccuracy', 'Location Accuracy']]) {
          if (!/^(?:0(?:\.\d+)?|1(?:\.0+)?)$/.test(row[column])) throw Error('Invalid ' + column);
          entry.metrics[split + suffix] = Number(row[column]);
        }
        entry.dates.add(row.Date);
        models.set(row.Model, entry);
      }
      if (split === 'swe') await new Promise(resolve => setTimeout(resolve, 1050));
    }
    const rows: LeaderboardRow[] = [];
    for (const [model, { metrics, dates }] of models) {
      if (metrics.swe === undefined || metrics.gaia === undefined) continue;
      rows.push({ model, score: (metrics.swe + metrics.gaia) / 2, metrics, date: dates.size === 1 ? [...dates][0] : undefined });
    }
    return checked(rows, 5);
  },
};
export default board;
