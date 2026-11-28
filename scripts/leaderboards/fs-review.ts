// Models find cross-statement accounting defects. The hub reports mean reward on eight sets.
// Each run also reports finding F1, JSON validity, turn count and, when available, token usage.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { primeFeed } from './gpu-puzzles.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const env = 'cw7w3s4nv45nj5w67o2c8qg1';
const url = 'https://app.primeintellect.ai/dashboard/environments/martian56/fs-review/evals';
interface Run {
  _id: string; semanticVersion: string; createdAt: string; framework: string; user?: { name: string };
  statistics: { avgReward: number };
  metadata: {
    model: string; num_examples: number; rollouts_per_example: number;
    avg_metrics: { findings_f1: number; valid_json: number; num_turns: number };
    usage?: { input_tokens: number; output_tokens: number };
    pass_at_k?: Record<string, number>; pass_all_k?: Record<string, number>;
  };
}
const board: Leaderboard = {
  benchmark: 'fs-review', feed: primeFeed(env), url,
  aliases: { 'google/gemini-2.0-flash-001': 'gemini-2-0-flash-feb-2025' },
  terms: 'Prime Intellect publishes evaluation results under https://www.primeintellect.ai/terms-of-service.',
  stats: {
    findingsF1: { name: 'Findings F1', unit: 'score', better: 'higher' },
    validJson: { name: 'Valid JSON', unit: 'score', better: 'higher' },
    steps: { name: 'Mean turns', unit: 'count' },
    inputTokens: { name: 'Mean input tokens', unit: 'tokens' },
    passAt2: { name: 'pass@2', unit: '%', better: 'higher' },
    pass2: { name: 'pass^2', unit: '%', better: 'higher', note: 'both attempts pass' },
  },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (;;) {
      const payload = await fetchJson<{result: {data: {json: { evaluations: Run[], pagination: {total: number, hasMore: boolean} }}}}>(primeFeed(env, rows.length));
      const { evaluations, pagination } = payload.result.data.json;
      for (const e of evaluations) {
        const m = e.metadata;
        const metrics: Record<string, number> = { findingsF1: m.avg_metrics.findings_f1, validJson: m.avg_metrics.valid_json, steps: m.avg_metrics.num_turns };
        if (m.usage) metrics.inputTokens = m.usage.input_tokens;
        if (m.pass_at_k?.['2'] != null) metrics.passAt2 = 100 * m.pass_at_k['2'];
        if (m.pass_all_k?.['2'] != null) metrics.pass2 = 100 * m.pass_all_k['2'];
        if (!Object.values(metrics).every(Number.isFinite)) throw new Error('Missing FS Review run metrics');
        rows.push({ model: m.model, score: e.statistics.avgReward, metrics, trials: m.rollouts_per_example, date: e.createdAt.slice(0,10),
          tokens: m.usage && Number.isFinite(m.usage.output_tokens) && m.usage.output_tokens > 0 ? m.usage.output_tokens : undefined,
          setting: e.semanticVersion + ', ' + m.num_examples + ' examples', harness: e.framework, submitter: e.user?.name, link: url + '/' + e._id });
      }
      if (!pagination.hasMore) {
        if (rows.length !== pagination.total) throw new Error('Incomplete evaluation list');
        return checked(rows, 7);
      }
      if (!evaluations.length) throw new Error('Empty evaluation page');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  },
};
export default board;
