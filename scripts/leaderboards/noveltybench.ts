// NoveltyBench tests whether repeated answers to the same prompt are useful and distinct.
// The leaderboard ranks systems by utility across ten responses. It also reports distinct answer counts.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { HELM_ALIASES } from './helm-capabilities.ts';

type Scores = {distinct: number, utility: number};
type Entry = {variant: string, sampling: string, category: string, version: string, metrics: Record<string,Scores>,
  open: boolean, date?: string, metadata?: {base_model?: string, submitted_by?: string}};
const feed = 'https://novelty-bench.github.io/leaderboard_data.json';
const board: Leaderboard = {
  benchmark: 'noveltybench', url: 'https://novelty-bench.github.io/', feed, harnesses: 'system',
  terms: 'The authors publish the board and its definitions at https://novelty-bench.github.io/.',
  stats: { distinct10: { name: 'Distinct answers at 10 samples', unit: 'count', }, utility10v1: { name: 'Utility at 10 samples, version 1', unit: 'score', better: 'higher' }, distinct10v1: { name: 'Distinct answers at 10 samples, version 1', unit: 'count' } },
  aliases: {...HELM_ALIASES, 'command-r-plus-08-2024': 'command-r-plus', 'claude-3-5-sonnet-v2@20241022': 'claude-3-5-sonnet-october-2024'},
  async fetch() {
    const {models} = await fetchJson<{models: Entry[]}>(feed);
    const rows = models.map(entry => {
      const current = entry.metrics[entry.version];
      if (!Number.isFinite(current?.utility) || !Number.isFinite(current.distinct)) throw new Error('Missing current NoveltyBench metrics');
      const metrics: Record<string,number> = {distinct10: current.distinct};
      const old = entry.metrics['1.0'];
      if (old && entry.version !== '1.0') {
        metrics.utility10v1 = old.utility;
        metrics.distinct10v1 = old.distinct;
      }
      return {model: entry.metadata?.base_model ?? entry.variant, harness: entry.metadata?.base_model ? entry.variant : undefined,
        setting: entry.sampling + ', judge v' + entry.version, score: current.utility, metrics, date: entry.date,
        open: entry.open, submitter: entry.metadata?.submitted_by};
    });
    return checked(rows, 39);
  },
};
export default board;
