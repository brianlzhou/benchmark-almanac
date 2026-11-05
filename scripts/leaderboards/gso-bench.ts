// GSO (Global Software Optimization). gso-bench.github.io builds its table from assets/leaderboard.json:
// one entry per run with model, scaffold, setting (Opt@1 or Opt@10), reasoning effort and score, the
// percentage of tasks where the agent matched the expert speedup. Opt@1 is the headline; the two Opt@10
// rows are a best-of-ten metric and are left out so the scores stay comparable. The board's "Hack-Adjusted"
// column (score_hack_control: the score after a penalty for reward hacking) is kept as metrics.hackAdjusted.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://gso-bench.github.io/assets/leaderboard.json';

interface Entry {
  name: string;
  scaffold?: string;
  setting?: string;
  score: number;
  score_hack_control?: number | null;
  date?: string;
  reasoning_effort?: string | null;
}

const board: Leaderboard = {
  benchmark: 'gso-bench',
  url: 'https://gso-bench.github.io/',
  feed: FEED,
  terms: 'Static JSON on the GSO project site; the GSO repository is MIT-licensed.',
  aliases: {
    'Claude Sonnet 3.5 V2': 'claude-3-5-sonnet-october-2024',
    'Claude Sonnet 3.7': 'claude-3-7-sonnet',
    // run dated 2025-08-26, before the 0905 release
    'Kimi K2 Instruct': 'kimi-k2-jul-2025',
  },
  async fetch() {
    const { models } = await fetchJson<{ models: Entry[] }>(FEED);
    return models
      .filter((m) => (m.setting ?? 'Opt@1') === 'Opt@1')
      .map((m) => ({
        model: m.name,
        score: Number(m.score),
        setting: m.reasoning_effort?.toLowerCase() || undefined,
        harness: m.scaffold,
        date: m.date,
        ...(typeof m.score_hack_control === 'number' ? { metrics: { hackAdjusted: m.score_hack_control } } : {}),
      }));
  },
};
export default board;
