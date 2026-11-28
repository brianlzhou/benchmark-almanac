// Buyout Game ranks models by Bradley–Terry ratings from mirrored wealth comparisons.
// The author’s CSV gives the rating intervals and match counts, and the README supplies display names.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const feed = "https://raw.githubusercontent.com/lechmazur/buyout_game/HEAD/reference/current/scoreboard_bt.csv";

const board: Leaderboard = {
  benchmark: "buyout-game",
  url: "https://github.com/lechmazur/buyout_game",
  feed,
  terms: "The author publishes the README and rating data. The raw GitHub host returns 404 for robots.txt. No separate score license is stated.",
  stats: {
    games: { name: 'Games played', unit: 'count' },
    rating_units: { name: 'Rating units', unit: 'count' },
    bt_matches: { name: 'Bradley Terry matches', unit: 'count' },
    bt_opponent_count: { name: 'Bradley Terry opponents', unit: 'count' },
    wealth_partial_points_sum: { name: 'Wealth partial points sum', unit: 'score', better: 'higher' },
    wealth_partial_score: { name: 'Wealth partial score', unit: 'score', better: 'higher' },
    wealth_winner_count: { name: 'Wealth wins', unit: 'count', better: 'higher' },
    wealth_winner_rate: { name: 'Wealth win rate', unit: 'score', better: 'higher', note: 'Stored from 0 to 1.' },
    pairwise_win_rate: { name: 'Pairwise win rate', unit: 'score', better: 'higher', note: 'Stored from 0 to 1.' },
    ts_mu: { name: 'TrueSkill mean', unit: 'rating', better: 'higher' },
    ts_sigma: { name: 'TrueSkill rating uncertainty', unit: 'rating', better: 'lower' },
  },
  aliases: { 'Grok 4.20 0309': 'grok-4-20', 'Xiaomi MiMo V2.5 Pro': 'mimo-v2-5-pro', 'Xiaomi MiMo V2 Pro': 'mimo-v2-pro',
    'Xiaomi MiMo V2.6 Pro': 'mimo-v2-6-pro', 'Xiaomi MiMo V2.6 Flash': 'mimo-v2-6-flash',
    'ByteDance Seed2.0 Pro': 'seed-2-0-pro', 'ByteDance Seed2.1 Pro': 'seed-2-1-pro', 'Baidu Ernie 5.1': 'ernie-5-1', 'Baidu Ernie 5.0': 'ernie-5-0' },
  async fetch() {
    const entries = parseCsv(await fetchText(feed));
    await new Promise(resolve => setTimeout(resolve, 1000));
    const readme = await fetchText(feed.replace('reference/current/scoreboard_bt.csv', 'README.md'));
    const labels = markdownTables(readme).find(t => t[0].join('|') === 'Rank|Model|BT rating|95% rating interval|Games|Mirrored pairs');
    if (!labels || entries.length < 36 || labels.length !== entries.length + 1) throw new Error('Buyout tables disagree');
    return entries.map(r => {
      const label = labels[Number(r.bt_rank)];
      if (!label || !r.bt_rating || Math.abs(Number(label[2]) - Number(r.bt_rating)) > 0.051 ||
          Number(label[4]) !== Number(r.games) || Number(label[5]) !== Number(r.rating_units)) throw new Error('Buyout rank mismatch');
      const metrics: Record<string, number> = {};
      for (const key of ['games','rating_units','bt_se','bt_matches','bt_opponent_count','wealth_partial_points_sum','wealth_partial_score','wealth_winner_count',
          'wealth_winner_rate','pairwise_win_rate','ts_mu','ts_sigma']) {
        if (!r[key] || !Number.isFinite(Number(r[key]))) throw new Error('Missing Buyout ' + key);
        metrics[key === 'bt_se' ? 'stderr' : key] = +r[key];
      }
      const m = label[1].match(/^(.+?)\s+(?:\(([^)]+)\)|(Thinking|Reasoning))$/);
      if (!r.bt_ci95_low || !r.bt_ci95_high) throw new Error('Missing Buyout interval');
      return { model: m?.[1] ?? label[1], setting: m?.[2] ?? m?.[3], score: +r.bt_rating, low: +r.bt_ci95_low,
        high: +r.bt_ci95_high, trials: +r.rating_units, metrics };
    });
  },
};

export default board;
