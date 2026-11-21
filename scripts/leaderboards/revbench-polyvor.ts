// RevBench ranks model and agent combinations by the fraction of puzzles solved.
// Harbor Hub's leaderboard-read endpoint publishes the reward, run date, job link and trial counts.
import type { Leaderboard } from './types.ts';
import { harborFeed, harborRows, harborTerms } from './browser-use-linkedin.ts';

const board: Leaderboard = {
  benchmark: 'revbench-polyvor', url: 'https://hub.harborframework.com/datasets/polyvorlabs/revbench?tab=leaderboard',
  feed: harborFeed, terms: harborTerms, reference: ['Klyrune'],
  async fetch() {
    const rows = await harborRows('polyvorlabs/revbench', 'revbench', 3);
    return rows.map(({ metadata, metrics }) => {
      const label = metadata.model?.match(/^(.+?)(?: \(([^)]+)\))?$/);
      if (!label || !metadata.agent || !Number.isFinite(metrics.reward)) throw new Error('Missing RevBench model or reward');
      return { model: label[1], setting: label[2], harness: metadata.agent, score: metrics.reward * 100, link: metadata.job_url,
        date: metadata.run.slice(0, 10), trials: metrics.trials, metrics: { passed: metrics.passed, errors: metrics.errors } };
    });
  },
};
export default board;
