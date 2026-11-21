// Deta Studio rates construction takeoffs on drawing accuracy, price and speed. Its page embeds the runs used to calculate every thinking level.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { nextFlight, jsonAfter } from '../lib/html.ts';

const feed = "https://www.deta.studio/leaderboard";

const board: Leaderboard = {
  benchmark: "deta-studio-construction-takeoff",
  url: "https://www.deta.studio/leaderboard",
  feed,
  terms: "Deta requires written permission for commercial republication of its content. https://www.deta.studio/terms-of-service The site allows the leaderboard in robots.txt.",
  aliases: { 'Sol 6.2': 'gpt-6-2-sol', 'Terra 6.1': 'gpt-6-1-terra', 'Astra 6.2': 'gpt-6-2-astra', 'Luna 6': 'gpt-6-luna', 'Astra 6': 'gpt-6-astra', 'Sol 6.1': 'gpt-6-1-sol', 'DeepSeek V4.1 Flash': 'deepseek-v4-1-flash-1017' },
  async fetch() {
    type Run = { model: string; reasoning_effort: string; test_id: string; score: number; duration_ms: number; credits: number };
    const source = nextFlight(await fetchText(feed));
    const { tests, runs } = jsonAfter<{ tests: { id: string; name: string }[]; runs: Run[] }>(source, '"snapshot":');
    const names = jsonAfter<Record<string, string>>(source, '"names":{"models":');
    const minutes: Record<string, number> = { Area_Simple_1: 15, Area_Complex_1: 80, Electrical_Simple_1: 18, Opening_Simple_1: 8 };
    const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;
    const clamp = (v: number) => Math.max(0, Math.min(1, v));
    const saving = (baseline: number, actual: number) => clamp(Math.log(baseline / actual) / Math.log(100));
    const rows: LeaderboardRow[] = [];
    board.parts = {};
    for (const group of Object.values(Object.groupBy(runs, r => JSON.stringify([r.model, r.reasoning_effort])))) {
      if (!group) continue;
      const first = group[0];
      const model = names[first.model];
      if (!model || !first.reasoning_effort) throw new Error('Missing Deta model or thinking level');
      const price: number[] = [], speed: number[] = [], costs: number[] = [], times: number[] = [], scores: number[] = [];
      const metrics: Record<string, number> = {};
      for (const { id, name } of tests) {
        if (!minutes[name]) throw new Error('Missing manual baseline for ' + name);
        const subset = group.filter(r => r.test_id === id);
        if (!subset.length) continue;
        if (subset.some(r => !Number.isFinite(r.score) || !(r.credits > 0) || !(r.duration_ms > 0))) throw new Error('Incomplete Deta run');
        const credits = mean(subset.map(r => r.credits));
        const seconds = mean(subset.map(r => r.duration_ms)) / 1000;
        const accuracy = mean(subset.map(r => r.score));
        board.parts[name] = { name, unit: '%' };
        metrics[name] = accuracy;
        scores.push(accuracy); costs.push(credits); times.push(seconds);
        price.push(saving(minutes[name] * 3800 / 60, credits));
        speed.push(saving(minutes[name] * 60, seconds));
      }
      if (!scores.length) throw new Error('Missing Deta test results');
      const accuracy = mean(scores);
      const rating = 50 * clamp((accuracy - 85) / 15) + 25 * (mean(price) + mean(speed));
      rows.push({ model, setting: first.reasoning_effort, score: Math.round(rating * 0.5 ** (Math.max(0, 85 - accuracy) / 5)),
        trials: group.length, cost: mean(costs) / 100, metrics: { ...metrics, accuracy, latency: mean(times), credits: mean(costs) } });
    }
    if (rows.length < 67) throw new Error('Missing Deta configurations');
    return rows;
  },
};

export default board;
