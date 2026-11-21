// FrontierBreach measures how often an attack succeeds while a model completes simulated enterprise workflows.
// The headline score is attack success rate, with the published plus or minus interval retained as bounds.
// This importer reads the model rows from the public leaderboard page's accessible HTML.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://www.promptarmor.com/frontier-breach';
const board: Leaderboard = {
  benchmark: 'frontierbreach',
  url: `${PAGE}#leaderboard`,
  feed: `${PAGE} (leaderboard model rows)`,
  terms: 'PromptArmor publishes the public leaderboard and its robots.txt allows the page. No separate score-reuse license is stated.',
  host: 'PromptArmor',
  stats: { attackSuccessRate: { name: 'Attack success rate', unit: '%', better: 'higher' } },
  aliases: {
    'Qwen3.8-Max': 'qwen3-8-max-0902',
    'DeepSeek-V4-Flash-0731': 'deepseek-v4-flash-0731',
    'DeepSeek-V4-Pro-0813': 'deepseek-v4-pro-0813',
    'Beam 1.0 501B A23B': 'beam-1-0',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(PAGE);
    const rows: LeaderboardRow[] = [];
    const pattern = /aria-label="([^",]+), ([^:]+): ([\d.]+)% attack success rate, plus or minus ([\d.]+)"/g;
    for (const match of html.matchAll(pattern)) {
      const model = match[1].trim();
      const score = Number(match[3]);
      const interval = Number(match[4]);
      if (!model || !Number.isFinite(score) || !Number.isFinite(interval)) throw new Error('FrontierBreach row is incomplete');
      rows.push({ model, score, low: score - interval, high: score + interval, metrics: { interval, attackSuccessRate: score } });
    }
    if (rows.length < 20) throw new Error(`FrontierBreach: ${rows.length} models, expected at least 20`);
    return rows;
  },
};
export default board;
