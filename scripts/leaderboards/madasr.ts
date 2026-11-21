// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// MADASR evaluates speech recognition in Bengali and Bhojpuri. The organizers' README gives word error rates
// for named baseline systems under the four challenge tracks. Lower percentages are better.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const repo = 'https://github.com/bloodraven66/RESPIN_ASRU_Challenge_2023';
const feed = 'https://raw.githubusercontent.com/bloodraven66/RESPIN_ASRU_Challenge_2023/HEAD/README.md';
const board: Leaderboard = {
  benchmark: 'madasr', url: repo + '#baselines', feed,
  terms: 'The organizers publish their baseline results in the challenge repository. ' + repo,
  headline: 'Plain mean of Bengali and Bhojpuri word error rates for the named baseline and track.',
  parts: { bengali: 'Bengali', bhojpuri: 'Bhojpuri' },
  async fetch() {
    const source = await fetchText(feed);
    const models = new Map<string, { model: string; setting: string; metrics: Record<string, number> }>();
    for (const language of ['Bengali', 'Bhojpuri']) {
      const table = source.split(language + ' baseline models')[1]?.trim().split('\n\n')[0];
      if (!table || !/\|\s*track\s*\|\s*Model\s*\|\s*WER\s*\|/.test(table)) throw new Error('Missing ' + language + ' baseline table');
      for (const line of table.split('\n').slice(2)) {
        const match = line.match(/^\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|\s*([\d.]+)\s*\|$/);
        if (!match) throw new Error('Invalid language result');
        const [, track, model, value] = match, key = track + ':' + model, lang = language.toLowerCase();
        const row = models.get(key) ?? { model, setting: 'Track ' + track, metrics: {} };
        if (lang in row.metrics) throw new Error('Duplicate language score');
        row.metrics[lang] = Number(value);
        models.set(key, row);
      }
    }
    return checked([...models.values()].filter(r => 'bengali' in r.metrics && 'bhojpuri' in r.metrics)
      .map(r => ({ ...r, score: (r.metrics.bengali + r.metrics.bhojpuri) / 2 })), 5);
  },
};
export default board;
