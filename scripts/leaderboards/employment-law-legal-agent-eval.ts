// Agents write legal risk memos for five employment cases. The package README gives historical mean reward.
// The baseline values follow the early formula, 0.4 times completion plus 0.6 times finding recall.
import type { Leaderboard } from './types.ts';
import { execFileSync } from 'node:child_process';
import { fetchBytes, fetchJson } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const url = 'https://app.primeintellect.ai/dashboard/environments/narcolepticchicken/employment-law-legal-agent-eval';
const feed = 'https://api.primeintellect.ai/api/v1/environmentshub/narcolepticchicken/employment-law-legal-agent-eval/@latest';
const board: Leaderboard = {
  benchmark: 'employment-law-legal-agent-eval', url, feed,
  terms: 'Prime Intellect hosts the author’s results under https://www.primeintellect.ai/terms-of-service.',
  headline: 'These historical scores use the early rubric, which gave 40% credit for saving a complete deliverable.',
  stats: { findingRecall: { name: 'Finding recall', unit: 'score', better: 'higher' },
    completed: { name: 'Completed deliverables', unit: 'count', better: 'higher' } },
  aliases: { 'qwen3-30b-a3b-instruct-2507': 'qwen3-30b-a3b-instruct-jul-2025' },
  async fetch() {
    const { data } = await fetchJson<{data: {package_url: string}}>(feed);
    const readme = execFileSync('tar', ['-xzOf', '-', 'README.md'], {
      input: Buffer.from(await fetchBytes(data.package_url)), encoding: 'utf8',
    });
    const section = readme.split('## Baseline results')[1]?.split('## Interpreting scores')[0];
    const [table] = markdownTables(section || '');
    if (!table) throw new Error('Missing historical baselines');
    return checked(table.map(([model, sample, reward, recall, saved]) => {
      if (sample !== '5 tasks × 3 rollouts' || !/^\d+\/15$/.test(saved)) throw new Error('Historical baseline columns changed');
      const completed = parseInt(saved);
      const score = Number(reward);
      if (Math.abs(score - (0.4 * completed / 15 + 0.6 * Number(recall))) > 0.001) throw new Error('Historical scoring formula changed');
      return { model, score, setting: 'Early additive rubric', trials: 3, metrics: { completed, findingRecall: Number(recall) } };
    }), 2);
  },
};
export default board;
