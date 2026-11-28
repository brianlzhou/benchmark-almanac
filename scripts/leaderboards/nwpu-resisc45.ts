// NWPU-RESISC45 tests recognition of remote-sensing scenes across 45 classes. The MTEB
// task leaderboard reports test accuracy as a fraction, which this importer converts to percent.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

type Entry = {score: number, model: {name: string, url?: string, openWeights?: boolean, totalParamsB?: number, license?: string}};
const feed = 'https://mteb-leaderboard-backend.hf.space/v1/tasks/RESISC45/scores';
const board: Leaderboard = {
  benchmark: 'nwpu-resisc45', url: 'https://huggingface.co/spaces/mteb/leaderboard', host: 'MTEB', feed,
  terms: 'The MTEB leaderboard reports results at https://huggingface.co/spaces/mteb/leaderboard under the Hugging Face terms of service.',
  async fetch() {
    const d = await fetchJson<{task: {name: string, mainScore: string}, splits: string[], rows: Entry[]}>(feed);
    if (d.task.name !== 'RESISC45' || d.task.mainScore !== 'accuracy' || !d.splits.includes('test')) throw new Error('Unexpected RESISC45 task definition');
    const rows = d.rows.map(({score, model}) => {
      if (typeof score !== 'number' || score < 0 || score > 1) throw new Error('Invalid test accuracy');
      return {model: model.name, score: score * 100, open: model.openWeights, params: model.totalParamsB ?? undefined, license: model.license, link: model.url || undefined};
    });
    return checked(rows, 57);
  },
};
export default board;
