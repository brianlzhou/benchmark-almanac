// BankerToolBench v1.0 tests investment banking deliverables. Figure 5 of the authors' paper gives
// Figure 5 reports the best-of-three success rate as pass@3.
// the average Pass@1 rate across three OpenCode runs and the corresponding best-of-three rate.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';

const feed = 'https://arxiv.org/html/2604.11304v1/figs/vdr_pass_threshold080_hbar.png';
const results: [string, number, number][] = [
  ['GPT-5.4', 16, 23], ['Gemini 3.1 Pro', 10, 16], ['Claude Opus 4.6', 9, 12],
  ['Claude Opus 4.5', 8, 13], ['GPT-5.2', 8, 18], ['Qwen 3.5 397B', 4, 6],
  ['GLM 5', 2, 6], ['Grok 4', 1, 3], ['Gemini 2.5 Pro', 0, 0],
];
const board: Leaderboard = {
  benchmark: 'bankertoolbench', static: 'paper',
  stats: { pass3: { name: 'Pass at 3', unit: '%', better: 'higher' } },
  url: 'https://arxiv.org/html/2604.11304v1#S6.F5',
  feed,
  terms: 'Handshake restricts automated extraction and its robots.txt blocks named crawlers. The v1.0 chart is credited to Handshake AI Research through its public paper on arXiv.',
  reference: ['OpenCode'],
  aliases: { 'Qwen 3.5 397B': 'qwen3-5-397b-a17b' },
  async fetch() {
    const rows: LeaderboardRow[] = results.map(([model, score, passAt3]) => ({
      model, score, metrics: { passAt3 }, trials: 3, harness: 'OpenCode',
    }));
    return chartRows(feed, 'f76fbba5d895ea9ab26106ace16c60f0a62f53a4b496ddabde01a70492698f1e', rows);
  },
};
export default board;
