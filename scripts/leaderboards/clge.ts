// CLGE evaluates Chinese text generation, including the CSL title-generation task.
// The repository's published CSL table reports Rouge-L first, followed by Rouge-1, Rouge-2 and BLEU.
// This importer reads the five named baselines with numeric scores from the official README.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://raw.githubusercontent.com/CLUEbenchmark/CLGE/master/readme.md';
const board: Leaderboard = {
  benchmark: 'clge', static: 'paper', url: 'https://github.com/CLUEbenchmark/CLGE', feed: FEED,
  terms: 'The CLGE repository is publicly available. The repository does not state a separate data license. https://github.com/CLUEbenchmark/CLGE',
  headline: 'The repository reports no overall CLGE score, so this is the CSL Rouge-L column published first in its baseline table.',
  stats: {
    rouge1: { name: 'ROUGE-1', unit: 'score', better: 'higher', note: 'Overlap of unigrams between generated and reference text.' },
    rouge2: { name: 'ROUGE-2', unit: 'score', better: 'higher', note: 'Overlap of bigrams between generated and reference text.' },
    bleu: { name: 'BLEU', unit: 'score', better: 'higher' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const text = await fetchText(FEED);
    const start = text.indexOf('|         模型');
    const end = text.indexOf('\n\n', start);
    if (start < 0 || end < 0) throw new Error('CLGE baseline table missing');
    const lines = text.slice(start, end).split(/\r?\n/).slice(2);
    const rows: LeaderboardRow[] = [];
    for (const line of lines) {
      const cells = line.split('|').slice(1, -1).map((value) => value.trim());
      if (cells.length !== 6 || cells[0] === 'RoBERTa-wwm-large') continue;
      const values = cells.slice(1, 5).map(Number);
      if (!cells[0] || values.some((value) => !Number.isFinite(value))) throw new Error('Invalid CLGE baseline row');
      rows.push({ model: cells[0], score: values[0], metrics: { rouge1: values[1], rouge2: values[2], bleu: values[3] }, setting: cells[5] });
    }
    return checked(rows, 5);
  },
};
export default board;
