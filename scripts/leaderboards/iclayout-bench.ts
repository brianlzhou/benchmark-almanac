// ICLayout-Bench ranks circuit layout agents on public circuits by default. Its snapshot gives public and private scores for each model, harness and effort.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://lizhangmai.github.io/ICLayout-Bench/site-data/snapshot.json";

const board: Leaderboard = {
  benchmark: "iclayout-bench",
  url: "https://lizhangmai.github.io/ICLayout-Bench/leaderboard/",
  feed,
  terms: "The framework uses MIT. Dataset licenses vary by source, including noncommercial terms. The authors give no separate leaderboard license. https://huggingface.co/datasets/lizhangmai/ICLayout-Bench#licensing The feed host returns no robots.txt.",
  parts: { public: "Public", private: "Private" },
  stats: {
    validity: { name: 'Validity', unit: '%', better: 'higher' },
    privateCost: { name: 'Private cost per task', unit: 'usd', better: 'lower' },
    privateTokens: { name: 'Private output tokens', unit: 'tokens' },
  },
  async fetch() {
    type Result = { key: string; model: string; harness: string; effort: string; score: number; cost: number; output_tokens: number; validity: number };
    type Set = { models: Result[] };
    const data = await fetchJson<{ responses: Record<string, { analysis: { public: Set; private: Set } }> }>(feed);
    const sets = data.responses['/api/catalog'].analysis;
    if (sets.public.models.length < 22 || sets.private.models.length < 22) throw new Error('Incomplete model comparisons');
    const privateRows = new Map(sets.private.models.map(r => [r.key, r]));
    return sets.public.models.map(r => {
      const other = privateRows.get(r.key);
      if (!r.model || !r.effort || !Number.isFinite(r.score) || !Number.isFinite(other?.score)) throw new Error('Invalid circuit score');
      return { model: r.model, setting: r.effort, harness: r.harness, score: r.score, cost: r.cost, tokens: r.output_tokens,
        metrics: { public: r.score, private: other!.score, validity: r.validity, privateCost: other!.cost, privateTokens: other!.output_tokens } };
    });
  },
};
export default board;
