// LoTTE tests passage retrieval on search and forum queries. MTEB ranks models by hit rate at five.
// Its task endpoint supplies the headline and the development and test results for each topic and query type.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://mteb-leaderboard-backend.hf.space/v1/tasks/LoTTE/scores';
interface Result {
  model: { name: string, url?: string, openWeights?: boolean, totalParamsB?: number, license?: string };
  score: number;
  subsetScores: Record<string, Record<string, number>>;
}
const board: Leaderboard = {
  benchmark: 'lotte', host: 'MTEB', feed, url: 'https://leaderboard.mteb.org/tasks/LoTTE',
  terms: 'MTEB publishes results under CC0 1.0. https://huggingface.co/datasets/mteb/results',
  async fetch() {
    const data = await fetchJson<{ task: { name: string, mainScore: string }, rows: Result[] }>(feed);
    if (data.task.name !== 'LoTTE' || data.task.mainScore !== 'hit_rate_at_5') throw Error('Missing LoTTE hit rate');
    const parts: Record<string, string> = {};
    function percent(n: number) {
      if (!Number.isFinite(n) || n < 0 || n > 1) throw Error('Invalid LoTTE hit rate');
      return 100 * n;
    }
    const rows = data.rows.filter(r => r.model.name !== 'mteb/baseline-random-encoder').map(({ model, score, subsetScores }) => {
      const metrics: Record<string, number> = {};
      for (const [subset, splits] of Object.entries(subsetScores)) {
        for (const [split, value] of Object.entries(splits)) {
          const key = subset + '_' + split;
          parts[key] = subset.replaceAll('_', ' ') + ' (' + split + ')';
          metrics[key] = percent(value);
        }
      }
      return { model: model.name, score: percent(score), metrics, link: model.url,
        open: model.openWeights, params: model.totalParamsB ?? undefined, license: model.license || undefined };
    });
    board.parts = parts;
    return checked(rows, 6);
  },
};
export default board;
