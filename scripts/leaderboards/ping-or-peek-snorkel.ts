// Ping or Peek tests whether coding agents ask for clarification before editing an ambiguous CSV.
// The score is the hidden verifier's binary reward, averaged over all published rollouts for each model.
// This importer reads the public Hugging Face dataset and extracts each trace's verifier reward.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const DATASET = 'https://datasets-server.huggingface.co/rows?dataset=snorkelai/ping-or-peek&config=default&split=train';
type Row = { row: { model: string; setting: string; harness: string; trace: string } };

const board: Leaderboard = {
  benchmark: 'ping-or-peek-snorkel',
  url: 'https://huggingface.co/datasets/snorkelai/ping-or-peek',
  feed: DATASET,
  terms: 'The dataset card states that its license is TBD. https://huggingface.co/datasets/snorkelai/ping-or-peek The importer reads the public dataset server.',
  async fetch() {
    const rows: Row[] = [];
    for (let offset = 0; offset < 2000; offset += 100) {
      const page = await fetchJson<{ rows: Row[] }>(`${DATASET}&offset=${offset}&length=100`);
      rows.push(...page.rows);
      if (page.rows.length < 100) break;
    }
    if (rows.length < 1000) throw new Error(`Expected the published Ping or Peek rollouts, got ${rows.length}`);
    const byModel = new Map<string, { total: number; reward: number }>();
    for (const { row } of rows) {
      const verifier = JSON.parse(row.trace).extra?.verifier;
      const reward = Number(verifier?.reward);
      if (!row.model || !Number.isFinite(reward)) throw new Error('Missing Ping or Peek verifier reward');
      const entry = byModel.get(row.model) ?? { total: 0, reward: 0 };
      entry.total++;
      entry.reward += reward;
      byModel.set(row.model, entry);
    }
    const result: LeaderboardRow[] = [...byModel].map(([model, values]) => ({ model, score: values.reward / values.total, setting: 'All harnesses and settings', trials: values.total }));
    if (result.length < 2) throw new Error('Expected at least two Ping or Peek models');
    return result;
  },
};

export default board;
