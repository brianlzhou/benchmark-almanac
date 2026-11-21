// TriWorldBench tests video predictions from three synchronized robot cameras. Its public leaderboard ranks the evaluation split by TWB-Score.
// The API also reports all six dimension scores and their component metrics.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const url = 'https://triworldbench-triworldbench-space.hf.space/';
const feed = url + 'api/leaderboard';
type Entry = {
  model: { name: string }; submission: { datasetSplit: string; submittedAt: string };
  score: { rawValue: number }; metrics: Record<string,{ displayName: string; rawValue: number }>;
};
const board: Leaderboard = {
  benchmark: 'triworldbench', url, feed,
  terms: 'The makers publish this leaderboard on Hugging Face under the platform terms at https://huggingface.co/terms-of-service.',
  async fetch() {
    const data = await fetchJson<{ entries: Entry[]; snapshot: { ranking_policy: string } }>(feed);
    if (data.snapshot.ranking_policy !== 'TWB-Score descending') throw new Error('TriWorldBench ranking changed');
    const parts: Record<string,string> = {};
    const rows = data.entries.filter(r => r.submission.datasetSplit === 'evaluation').map(r => {
      if (r.score.rawValue !== r.metrics.TWBScore.rawValue || !r.metrics.tri_view_consistency) throw new Error('TriWorldBench scores missing');
      const metrics: Record<string,number> = {};
      for (const [key,value] of Object.entries(r.metrics)) {
        if (key === 'TWBScore') continue;
        if (!Number.isFinite(value.rawValue)) throw new Error('Invalid TriWorldBench metric ' + key);
        parts[key] = value.displayName;
        metrics[key] = value.rawValue;
      }
      return { model: r.model.name, score: r.score.rawValue, date: r.submission.submittedAt.slice(0,10), metrics };
    });
    board.parts = parts;
    return checked(rows, 69);
  },
};
export default board;
