// Travel Agent Compassion measures how often a booking agent chooses a welfare-neutral activity.
// The TAC overview API gives the percentage for each prompt. The category API supplies its breakdown.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const url = 'https://compassionbench.com';
const feed = url + '/api/tac/overview';
interface Result {
  name: string;
  task: string;
  welfareRate: number;
  completionRate: number;
  createdAt: string;
}
interface Categories {
  categories: string[];
  categoryData: Array<{ category: string } & Record<string, unknown>>;
}

const board: Leaderboard = {
  benchmark: 'travel-agent-compassion', url: url + '/tac', feed,
  terms: 'The site disallows crawling /api/ in robots.txt and prohibits ingestion into model training corpora.',
  aliases: { 'Gemini 2.5 Flash': 'gemini-2-5-flash-jun-2025' },
  stats: { completionRate: { name: 'Completion rate', unit: '%', better: 'higher' } },
  async fetch() {
    const results = await fetchJson<Result[]>(feed);
    if (results.length < 72) throw new Error('Expected at least 72 TAC prompt results');
    const breakdowns = new Map<string, Categories>();
    const parts: Record<string, string> = {};
    for (const task of new Set(results.map(row => row.task))) {
      if (!['inspect_evals/tac', 'inspect_evals/tac_welfare'].includes(task)) throw new Error('Unknown TAC prompt: ' + task);
      await new Promise(resolve => setTimeout(resolve, 1000));
      const data = await fetchJson<Categories>(url + '/api/tac/category-scores?task=' + task.split('/')[1]);
      if (!data.categories.length || data.categories.some(c => !data.categoryData.some(row => row.category === c))) {
        throw new Error('Missing TAC category scores');
      }
      for (const c of data.categories) parts[c] = c;
      breakdowns.set(task, data);
    }
    board.parts = parts;
    return results.map(row => {
      if (!row.name || !Number.isFinite(row.welfareRate) || !Number.isFinite(row.completionRate) || !row.createdAt) {
        throw new Error('Incomplete TAC overview result');
      }
      const metrics: Record<string, number> = { completionRate: row.completionRate };
      for (const category of breakdowns.get(row.task)!.categoryData) {
        const value = category[row.name];
        if (typeof value === 'number') metrics[category.category] = value;
      }
      return { model: row.name, setting: row.task.endsWith('_welfare') ? 'Welfare-guided' : 'Standard',
        score: row.welfareRate, date: row.createdAt.slice(0, 10), metrics };
    });
  },
};
export default board;
