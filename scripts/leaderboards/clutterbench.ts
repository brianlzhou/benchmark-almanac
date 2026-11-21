// ClutterBench measures the share of a model's graphic that a grader would cut.
// The headline score is the raw-prompt clutter percentage, with the simple-prompt result and label shares as metrics.
// This importer reads the public site's generated data file from the benchmark repository.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const PAGE = 'https://clutterbench.adamholter.chatgpt.site/';
const FEED = 'https://raw.githubusercontent.com/adamholter/clutterbench/main/site/data.json';

interface Variant { clutter: number; blue: number; orange: number; red: number; words: number; missing: number; }
interface Entry { name: string; raw: Variant; simple: Variant; }

const board: Leaderboard = {
  benchmark: 'clutterbench',
  url: PAGE,
  feed: FEED,
  terms: 'The benchmark repository is MIT licensed. The hosted site returned 403 to its page and robots URL, so this importer reads its generated data file from GitHub.',
  aliases: {
    'Claude Sonnet 5.5': 'claude-sonnet-5-5',
    'Claude Haiku 5.5': 'claude-haiku-5-5',
    'GPT-6.1 Sol': 'gpt-6-1-sol',
    'GPT-6 Astra': 'gpt-6-astra',
    'GPT-6 Luna': 'gpt-6-luna',
  },
  stats: {
    rawBlue: { name: 'Raw-prompt blue share', unit: '%', better: 'lower' }, rawOrange: { name: 'Raw-prompt orange share', unit: '%', better: 'lower' }, rawRed: { name: 'Raw-prompt red share', unit: '%', better: 'lower' }, rawWords: { name: 'Raw-prompt words', unit: 'count', better: 'lower' }, rawMissing: { name: 'Raw-prompt missing words', unit: 'count', better: 'lower' },
    simpleBlue: { name: 'Simple-prompt blue share', unit: '%', better: 'lower' }, simpleOrange: { name: 'Simple-prompt orange share', unit: '%', better: 'lower' }, simpleRed: { name: 'Simple-prompt red share', unit: '%', better: 'lower' }, simpleWords: { name: 'Simple-prompt words', unit: 'count', better: 'lower' }, simpleMissing: { name: 'Simple-prompt missing words', unit: 'count', better: 'lower' },
  },
  chart: {
    title: 'Clutter against prompt variant',
    x: { key: 'simpleClutter', label: 'Simple-prompt clutter', unit: '%', better: 'lower' },
    y: { key: 'score', label: 'Raw-prompt clutter', unit: '%', better: 'lower' },
    note: 'Each point compares the grader’s cut share for the raw and simple prompts.',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const data = await fetchJson<{ board?: Entry[] }>(FEED);
    if (!Array.isArray(data.board) || data.board.length < 5) throw new Error('ClutterBench board is missing model rows');
    return data.board.map((entry) => {
      if (!entry.name || !entry.raw || !entry.simple || !Number.isFinite(entry.raw.clutter)) throw new Error('ClutterBench row is incomplete');
      return {
        model: entry.name,
        score: entry.raw.clutter,
        metrics: {
          simpleClutter: entry.simple.clutter,
          rawBlue: entry.raw.blue,
          rawOrange: entry.raw.orange,
          rawRed: entry.raw.red,
          rawWords: entry.raw.words,
          rawMissing: entry.raw.missing,
          simpleBlue: entry.simple.blue,
          simpleOrange: entry.simple.orange,
          simpleRed: entry.simple.red,
          simpleWords: entry.simple.words,
          simpleMissing: entry.simple.missing,
        },
      };
    });
  },
};
export default board;
