// Ping or Peek tests whether coding agents ask for clarification before editing an ambiguous CSV.
// The score is the hidden verifier's binary reward, averaged over all published rollouts for each model.
// This importer reads the public Hugging Face dataset and extracts each trace's verifier reward.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const DATASET = 'https://datasets-server.huggingface.co/rows?dataset=snorkelai/ping-or-peek&config=default&split=train';
type Row = {
  row: {
    model: string; setting: string; harness: string; trace: string;
    asked_user_before_edit?: boolean; scorer_used_to_edit_csv?: boolean;
    verbalized_test_awareness?: boolean; csv_changed?: boolean;
  };
};

const board: Leaderboard = {
  benchmark: 'ping-or-peek-snorkel',
  url: 'https://huggingface.co/datasets/snorkelai/ping-or-peek',
  feed: DATASET,
  terms: 'The dataset card states that its license is TBD. https://huggingface.co/datasets/snorkelai/ping-or-peek The importer reads the public dataset server.',
  stats: {
    askedUserBeforeEdit: { name: 'Asked user before edit', unit: '%', better: 'higher' },
    scorerUsedToEditCsv: { name: 'Used scorer to edit CSV', unit: '%', better: 'lower' },
    verbalizedTestAwareness: { name: 'Verbalized test awareness', unit: '%' },
    csvChanged: { name: 'CSV modified', unit: '%' },
    correctModification: { name: 'Correct CSV modification', unit: '%', better: 'higher' },
    unintendedCsvModification: { name: 'Unintended CSV modification', unit: '%', better: 'lower' },
  },
  async fetch() {
    const rows: Row[] = [];
    for (let offset = 0; offset < 2000; offset += 100) {
      const page = await fetchJson<{ rows: Row[] }>(`${DATASET}&offset=${offset}&length=100`);
      rows.push(...page.rows);
      if (page.rows.length < 100) break;
    }
    if (rows.length < 1000) throw new Error(`Expected the published Ping or Peek rollouts, got ${rows.length}`);
    const byModel = new Map<string, { total: number; reward: number; asked: number; scorer: number; aware: number; changed: number; correct: number; unintended: number }>();
    for (const { row } of rows) {
      const verifier = JSON.parse(row.trace).extra?.verifier;
      const reward = Number(verifier?.reward);
      if (!row.model || !Number.isFinite(reward)) throw new Error('Missing Ping or Peek verifier reward');
      const entry = byModel.get(row.model) ?? { total: 0, reward: 0, asked: 0, scorer: 0, aware: 0, changed: 0, correct: 0, unintended: 0 };
      entry.total++;
      entry.reward += reward;
      if (row.asked_user_before_edit) entry.asked++;
      if (row.scorer_used_to_edit_csv) entry.scorer++;
      if (row.verbalized_test_awareness) entry.aware++;
      if (row.csv_changed) entry.changed++;
      if (verifier?.correct_modification) entry.correct++;
      if (verifier?.unintended_csv_modification) entry.unintended++;
      byModel.set(row.model, entry);
    }
    const pct = (n: number, d: number) => Math.round((n / d) * 10000) / 100;
    const result: LeaderboardRow[] = [...byModel].map(([model, v]) => ({
      model,
      score: v.reward / v.total,
      setting: 'All harnesses and settings',
      trials: v.total,
      metrics: {
        askedUserBeforeEdit: pct(v.asked, v.total),
        scorerUsedToEditCsv: pct(v.scorer, v.total),
        verbalizedTestAwareness: pct(v.aware, v.total),
        csvChanged: pct(v.changed, v.total),
        correctModification: pct(v.correct, v.total),
        unintendedCsvModification: pct(v.unintended, v.total),
      },
    }));
    if (result.length < 2) throw new Error('Expected at least two Ping or Peek models');
    return result;
  },
};

export default board;
