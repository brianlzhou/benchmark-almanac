// AI Professions Prompt Benchmark, from the makers' per-prompt scores (data/results.csv in their GitHub repository,
// CC BY 4.0). A model's score is the share of the 5 pass or fail criteria it met, over all 100 prompts and their 3
// runs. The makers grade GPT-6 Astra with a different judge (Claude Opus 5.5) from every other model (GPT-6 Astra),
// and say their results are not one ranking, so only the models that share the main judge are read.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = 'https://raw.githubusercontent.com/aiprofessions/prompt-benchmark/main/data/results.csv';
const JUDGE = 'gpt-6-astra';

const board: Leaderboard = {
  benchmark: 'ai-professions-prompt-benchmark',
  url: 'https://aiprofessions.ai/models/ai-model-test-results/',
  feed: `${FEED} (per-prompt scores)`,
  terms: 'Per-prompt scores the makers publish in their GitHub repository under CC BY 4.0.',
  aliases: { 'gemini-4-argon-medium': 'gemini-4-argon' },
  async fetch() {
    const by = new Map<string, { passed: number; total: number; date: string; runs: number }>();
    for (const r of parseCsv(await fetchText(FEED))) {
      if (r.judge !== JUDGE || !(Number(r.runs_graded) > 0)) continue;
      const e = by.get(r.model_id) ?? { passed: 0, total: 0, date: '', runs: 0 };
      e.passed += Number(r.criteria_passed_avg);
      e.total += Number(r.criteria_total);
      if (r.test_date > e.date) e.date = r.test_date;
      e.runs = Math.max(e.runs, Number(r.runs_graded));
      by.set(r.model_id, e);
    }
    const rows: LeaderboardRow[] = [];
    for (const [model, e] of by)
      if (e.total > 0) rows.push({ model, score: (100 * e.passed) / e.total, date: e.date, trials: e.runs, ...(model.endsWith('-medium') ? { setting: 'medium' } : {}) });
    return rows;
  },
};
export default board;
