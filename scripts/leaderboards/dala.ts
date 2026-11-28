// DaLA tests Danish linguistic acceptability. EuroEval publishes the test-split scores on its Danish leaderboard.
// EuroEval reports Matthews correlation first, then macro F1, both scaled by 100.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { text } from '../lib/html.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const feed = 'https://euroeval.com/leaderboards-csv/danish_all_models.csv';
const board: Leaderboard = {
  benchmark: 'dala',
  url: 'https://euroeval.com/leaderboards/danish',
  feed,
  host: 'EuroEval',
  terms: 'EuroEval code is MIT licensed. https://github.com/EuroEval/EuroEval',
  stats: {
    macroF1: { name: 'Macro F1', unit: '%', better: 'higher' },
    failures: { name: 'Failures', unit: 'count', better: 'lower' },
  },
  aliases: {
    'mistralai/Mistral-Small-3.1-24B-Instruct-2503': 'mistral-small-3-1',
    'mistralai/Mistral-Small-3.2-24B-Instruct-2506': 'mistral-small-3-2',
  },
  headline: 'EuroEval reports Matthews correlation on the DaLA Danish linguistic acceptability test split, scaled by 100.',
  async fetch() {
    const csv = await fetchText(feed);
    const start = csv.indexOf('Rank,Model,');
    if (start < 0) throw new Error('Missing EuroEval Danish leaderboard CSV');
    const records = parseCsv(csv.slice(start));
    const key = Object.keys(records[0] ?? {}).find(k => k.includes('#dala') || text(k) === 'dala');
    if (!key) throw new Error('Missing DaLA column');
    const rows = records
      .filter(r => r[key] && r[key] !== '-' && !/\([^)]*\bval\)$/.test(text(r.Model)))
      .map(r => {
        const values = r[key].match(/^(-?[\d.]+)\s*±\s*([\d.]+)\s*\/\s*([\d.]+)\s*±\s*([\d.]+)$/);
        if (!values) throw new Error('Malformed DaLA result: ' + r[key]);
        const [score, margin, f1, f1Margin] = values.slice(1).map(Number);
        const label = text(r.Model).trim();
        const settings = label.match(/ \(([^()]+)\)$/);
        const [model, mode] = label.replace(/ \([^()]+\)$/, '').split('#');
        const failures = Number(r.dala_failures);
        return {
          model,
          setting: [mode, settings?.[1]].filter(Boolean).join(', ') || undefined,
          score,
          low: score - margin,
          high: score + margin,
          link: r.Model.match(/href='([^']+)'/)?.[1],
          open: r.Open === '✓',
          metrics: {
            macroF1: f1,
            macroF1Low: f1 - f1Margin,
            macroF1High: f1 + f1Margin,
            ...(Number.isFinite(failures) ? { failures } : {}),
          },
        };
      });
    return checked(rows, 100);
  },
};
export default board;
