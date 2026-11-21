// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// AppWorld grades agents on app-based tasks. Its leaderboard ranks by scenario goal completion on Test-Challenge.
// Each split also reports task goal completion and average interactions, overall and at three difficulty levels.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { fetchJson } from '../lib/util.ts';

const feed = 'https://appworld.dev/appworld/leaderboard.json';
type Scores = { task_goal_completion: number, scenario_goal_completion: number, interactions: number };
type RecordRow = { llm: { name: string, tooltip: string }, method: {name: string}, url: string, date: string,
  test_normal: Record<string, Scores>, test_challenge: Record<string, Scores> };
const splits = { test_normal: 'Test-Normal', test_challenge: 'Test-Challenge' } as const;
const stats: Record<string, { name: string, unit: string, better?: 'higher' | 'lower' }> = {};
for (const [key, label] of Object.entries(splits)) {
  for (const level of ['all', 'level 1', 'level 2', 'level 3']) {
    const prefix = level === 'all' ? key : key + '_' + level.replaceAll(' ', '');
    const scope = level === 'all' ? label : label + ': ' + level;
    stats[prefix + 'TGC'] = { name: scope + ' task goal completion', unit: '%', better: 'higher' };
    stats[prefix + 'Interactions'] = { name: scope + ' interactions', unit: 'count' };
  }
}
const board: Leaderboard = {
  benchmark: 'appworld', url: 'https://appworld.dev/appworld/leaderboard', feed, harnesses: 'system',
  terms: 'AppWorld publishes its leaderboard and submission rules at https://github.com/StonyBrookNLP/appworld-leaderboard.',
  headline: 'The board reports no combined score, so this is the plain mean of scenario goal completion on Test-Normal and Test-Challenge.',
  aliases: { 'gpt-4o-2024-05-13': 'gpt-4o-may-2024', 'gpt-4o-2024-08-06': 'gpt-4o-aug-2024',
    'gpt-4-turbo-2024-04-09': 'gpt-4-turbo-apr-2024', DeepSeekCoder: 'deepseek-coder-33b', 'gptoss-20b': 'gpt-oss-20b' },
  stats,
  async fetch() {
    const data = await fetchJson<RecordRow[]>(feed);
    const parts: Record<string, string> = {};
    const rows = data.filter(r => Object.keys(splits).every(k => Number.isFinite(r[k as keyof typeof splits]?.all?.scenario_goal_completion))).map(r => {
      const metrics: Record<string, number> = {};
      for (const key of Object.keys(splits) as (keyof typeof splits)[]) {
        for (const [level, score] of Object.entries(r[key])) {
          const prefix = level === 'all' ? key : key + '_' + level.replaceAll(' ', '');
          parts[prefix] = level === 'all' ? splits[key] : splits[key] + ': ' + level;
          metrics[prefix] = score.scenario_goal_completion;
          metrics[prefix + 'TGC'] = score.task_goal_completion;
          metrics[prefix + 'Interactions'] = score.interactions;
        }
      }
      if (!Object.values(metrics).every(Number.isFinite)) throw new Error('Invalid AppWorld split score');
      const model = /^gpt-4(?:o|-turbo)-\d{4}-\d{2}-\d{2}$/.test(r.llm.tooltip) ? r.llm.tooltip : r.llm.name;
      return { model, harness: r.method.name, date: r.date, link: r.url, score: (metrics.test_normal + metrics.test_challenge) / 2, metrics };
    });
    board.parts = parts;
    return checked(rows, 26);
  },
};
export default board;
