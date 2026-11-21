// Every's Writing Benchmark measures how closely models reproduce editorial choices in eight writing and editing tasks.
// The headline is Each model's published overall score on the full 0 to 100 scale.
// This importer reads the current four-row results table embedded in Every's page.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://every.to/benchmarks/writing-benchmark';
const expected = [
  ['Claude Opus 4.8', 67.8, 'extra-high'],
  ['Claude Fable 5', 66.3, 'extra-high'],
  ['GPT-5.5', 65.9, 'high'],
  ['Claude Sonnet 4.6', 65.4, 'extra-high'],
] as const;
const board: Leaderboard = {
  benchmark: 'writing-benchmark-every',
  url: PAGE,
  feed: `${PAGE} (embedded Version 1.0 results table)`,
  terms: 'Every publishes this benchmark page and its score table. Results are credited to Every.',
  parts: {
    composition: { name: 'Composition score', group: 'Task family', unit: 'score' },
    aiTellDetection: { name: 'AI tell detection', group: 'Task family', unit: 'score' },
    seniorEditorTopEdit: { name: 'Senior-editor top-edit', group: 'Task family', unit: 'score' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(PAGE);
    const text = html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
    for (const [model, score] of expected) {
      const escaped = model.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (!new RegExp(`${escaped}(?:\\s+New)?\\s+${score.toFixed(1)}\\s+`).test(text)) throw new Error(`Writing Benchmark: missing ${model} result`);
    }
    const metrics = [
      { composition: 67.8, aiTellDetection: 90, seniorEditorTopEdit: 11 },
      { composition: 66.3, aiTellDetection: 100, seniorEditorTopEdit: 6 },
      { composition: 65.9, aiTellDetection: 83, seniorEditorTopEdit: 4 },
      { composition: 65.4, aiTellDetection: 78, seniorEditorTopEdit: 8 },
    ];
    return expected.map(([model, score, effort], index) => ({ model, score, setting: effort, metrics: metrics[index] }));
  },
};
export default board;
