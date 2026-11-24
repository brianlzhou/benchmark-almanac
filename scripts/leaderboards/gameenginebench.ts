// GameEngineBench ranks coding agents by pass@1 on Unreal Engine tasks. Nitrode's JavaScript chart includes model settings, error bars, cost, token use and steps.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://www.nitrode.com/js/nitrode-bench-charts.js";

const board: Leaderboard = {
  benchmark: "gameenginebench",
  url: "https://www.nitrode.com/research",
  feed,
  terms: "Nitrode reserves all rights. Its chart lists 12 configurations for nine models and reports average cost per task. https://www.nitrode.com/research The robots.txt allows all paths.",
  aliases: { 'deepseek-4-pro': 'deepseek-v4-pro' },
  stats: { totalTokens: { name: 'Total tokens', unit: 'tokens', better: 'lower' }, steps: { name: 'Steps', unit: 'count', better: 'lower' } },
  async fetch() {
    const data = (await fetchText(feed)).split('const MODELS = [')[1]?.split('];')[0];
    if (!data) throw new Error('Missing GameEngineBench chart');
    const rows = [...data.matchAll(/name: '([^']+)', family: '[^']+', effort: (?:'([^']+)'|null), score: ([\d.]+), err: ([\d.]+), cost: ([\d.]+), tokens: (\d+), steps: (\d+)/g)].map(
      ([, model, setting, s, err, cost, tokens, steps]) => ({ model, setting, score: Number(s), low: Number(s) - Number(err), high: Number(s) + Number(err),
        cost: Number(cost), metrics: { totalTokens: Number(tokens) * 1000, steps: Number(steps) } }));
    if (rows.length < 12 || rows.length !== data.split('{ id:').length - 1) throw new Error('Incomplete GameEngineBench chart');
    return rows;
  },
};

export default board;
