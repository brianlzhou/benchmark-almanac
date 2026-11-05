// Factorio Learning Environment (FLE). The leaderboard page loads processed/combined-results.json next to
// it: per model the production score of its open-play run, milestones, automation milestones, lab-task
// success rate, the most complex item made and the submission date. The page ranks by Production Score,
// which is the score here (an open-ended count, higher is better). The six rows are the March 2025 paper's
// runs and carry their submission dates. Milestones, automation milestones and the lab-task success rate
// (0 to 100) are kept as metrics.milestones, metrics.automation and metrics.labSuccess.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const PAGE = 'https://jackhopkins.github.io/factorio-learning-environment/leaderboard/';
const FEED = `${PAGE}processed/combined-results.json`;

const board: Leaderboard = {
  benchmark: 'factorio-learning-environment',
  url: PAGE,
  feed: `${FEED} (productionScore)`,
  terms: 'JSON file on the FLE GitHub Pages site that the leaderboard page loads (no robots.txt); the FLE repository is MIT-licensed.',
  aliases: {
    'Claude 3.5-Sonnet': 'claude-3-5-sonnet-october-2024',
    'Gemini-2-Flash': 'gemini-2-0-flash-feb-2025',
    // plain "gpt-4o" in the API pointed to the 2024-08-06 snapshot in March 2025
    GPT4o: 'gpt-4o-aug-2024',
    'GPT4o-Mini': 'gpt-4o-mini',
    'Llama-3.3-70b': 'llama-3-3-70b',
    'Deepseek-v3': 'deepseek-v3',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const data = await fetchJson<
      { name: string; productionScore?: number; milestones?: number; automationMilestones?: number; labTasksSuccessRate?: number; submissionDate?: string }[]
    >(FEED);
    const rows: LeaderboardRow[] = [];
    for (const e of data) {
      if (!e.name || typeof e.productionScore !== 'number') continue;
      const metrics: Record<string, number> = {};
      if (typeof e.milestones === 'number') metrics.milestones = e.milestones;
      if (typeof e.automationMilestones === 'number') metrics.automation = e.automationMilestones;
      if (typeof e.labTasksSuccessRate === 'number') metrics.labSuccess = e.labTasksSuccessRate;
      rows.push({ model: e.name, score: e.productionScore, date: e.submissionDate, ...(Object.keys(metrics).length ? { metrics } : {}) });
    }
    if (!rows.length) throw new Error('no FLE rows');
    return rows;
  },
};
export default board;
