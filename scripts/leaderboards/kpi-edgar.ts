// KPI-EDGAR tests extraction of relations between financial entities.
// The authors' test-set table gives conventional relation F1 first and adjusted F1 second.
// Both measures use a percentage scale.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://raw.githubusercontent.com/tobideusser/kpi-edgar/HEAD/README.md';
export default {
  benchmark: 'kpi-edgar', url: 'https://github.com/tobideusser/kpi-edgar#test-set-performances', feed,
  terms: 'The authors request citation at https://github.com/tobideusser/kpi-edgar#citation',
  parts: {adjustedF1: {name: 'Adjusted relation F1', unit: '%'}},
  async fetch() {
    const section = (await fetchText(feed)).split('## Test set performances')[1]?.split(/^## /m)[0];
    const lines = section?.split('\n').filter(l => l.startsWith('|'));
    const cells = (line: string) => line.split('|').slice(1, -1).map(s => s.trim().replace(/<sup>.*?<\/sup>/g, '').replace(/<\/?sub>/g, ''));
    if (!lines || cells(lines[0]).join('|') !== 'Model|Relation F1 Score in %|Adjusted Relation F1 Score in %') throw new Error('Missing relation F1 columns');
    return checked(lines.slice(2).map(line => {
      const [model, f1, adjusted] = cells(line);
      if (![f1, adjusted].every(v => /^\d+(?:\.\d+)?$/.test(v))) throw new Error('Invalid relation F1');
      return {model, score: Number(f1), metrics: {adjustedF1: Number(adjusted)}};
    }), 4);
  },
} satisfies Leaderboard;
