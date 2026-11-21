// NFCorpus tests medical information retrieval.
// The MTEB task leaderboard reports nDCG@10 on the test split.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
const FEED = 'https://mteb-leaderboard-backend.hf.space/v1/tasks/NFCorpus/scores';
const board: Leaderboard = { benchmark: 'nfcorpus', url: FEED, feed: FEED, terms: 'MTEB publishes these results under CC0 1.0. https://huggingface.co/datasets/mteb/results', async fetch() { const d = await fetchJson<{ task: { name: string }; rows: Array<{ model: { name: string; totalParamsB?: number; license?: string; openWeights?: boolean }; score: number }> }>(FEED); if (d.task.name !== 'NFCorpus') throw new Error('MTEB task changed'); const rows = d.rows.filter((r) => typeof r.model?.name === 'string' && typeof r.score === 'number').map((r) => ({ model: r.model.name, score: r.score, open: r.model.openWeights, license: r.model.license, params: r.model.totalParamsB })); if (rows.length < 2) throw new Error('MTEB returned too few NFCorpus rows'); return rows; } };
export default board;
