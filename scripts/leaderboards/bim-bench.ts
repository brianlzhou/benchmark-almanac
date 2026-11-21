// BIM Bench asks reviewers to rate the usability of an exported Revit drawing from one to five.
// Join the community rating feed to the experiment's configurations by drawing ID.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
const feed = "https://bimbench.com/api/benchmark?experiment=revit-eaves-002";
const board: Leaderboard = {
  benchmark: 'bim-bench',
  url: "https://bimbench.com/?experiment=revit-eaves-002",
  feed,
  terms: "BIM Bench allows its public datasets in robots.txt and disallows /api. The methodology gives no explicit reuse license.",
  stats: { cachedInput: { name: 'Cached input tokens', unit: 'tokens' }, inputTokens: { name: 'Input tokens', unit: 'tokens' }, latency: { name: 'Latency', unit: 'seconds', better: 'lower' }, ratings: { name: 'Ratings', unit: 'rating' }, steps: { name: 'Steps', unit: 'count' }, voters: { name: 'Voters', unit: 'count' } },
  async fetch() {
    const data = await fetchJson<{ id: string; models: { id: string; name: string }[]; runs: {
      id: string; model: string; effort: string; pdf: string; elapsedSeconds: number; costUsd: number; steps: number;
      input: number; cachedInput: number; output: number; sourceExportDate: string; harnessVersion: string }[] }>('https://bimbench.com/data/eaves-002.json');
    await new Promise(resolve => setTimeout(resolve, 1050));
    const board = await fetchJson<{ experiment: string; mode: string; protocol: string; runs: {
      id: string; score: number; ratings: number; voters: number }[] }>(feed);
    if (data.id !== 'revit-eaves-002' || board.experiment !== data.id || board.mode !== 'community' ||
        board.protocol !== 'usability-1-5-v1' || data.runs.length < 36) throw new Error('Unexpected BIM Bench experiment');
    const ratings = new Map(board.runs.map(row => [row.id, row]));
    return data.runs.map(run => {
      const model = data.models.find(m => m.id === run.model)?.name, result = ratings.get(run.id);
      if (!model || !result || !Number.isFinite(result.score) || result.score < 1 || result.score > 5) throw new Error('Missing BIM Bench rating');
      return { model, setting: run.effort, harness: 'Revit API ' + run.harnessVersion, score: result.score,
        cost: run.costUsd, tokens: run.output, date: run.sourceExportDate, link: new URL(run.pdf, feed.split('/api/')[0] + '/').href,
        metrics: { ratings: result.ratings, voters: result.voters, latency: run.elapsedSeconds, steps: run.steps, inputTokens: run.input, cachedInput: run.cachedInput } };
    });
  },
};
export default board;
