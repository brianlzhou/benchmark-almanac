// Databricks compares coding agents by task pass rate and average cost. The coding frontier chart includes its points in the page data.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { nextFlight, jsonAfter } from '../lib/html.ts';

const feed = "https://developers.databricks.com/ai-index";

const board: Leaderboard = {
  benchmark: "databricks-ai-index",
  url: "https://developers.databricks.com/ai-index",
  feed,
  terms: "The publisher displays results at https://developers.databricks.com/ai-index. I could not verify reuse terms. The site allows this path in robots.txt.",
  stats: { latency: { name: 'Average latency', unit: 'seconds', better: 'lower' }, turns: { name: 'Average turns', unit: 'count', better: 'lower' } },
  aliases: { 'Gemini Argon 4': 'gemini-4-argon' },
  chart: { title: 'Cost per Task vs Quality', x: { key: 'cost', label: 'Cost per task', unit: '$', better: 'lower' }, y: { key: 'score', label: 'Pass rate', unit: '%' } },
  async fetch() {
    const source = nextFlight(await fetchText(feed)).split('"title":"Cost per Task vs Quality"')[1];
    type Point = { name: string; harness: string; quality: number; cost: number; avg_turns: number; avg_latency_min: number };
    const points = jsonAfter<Point[]>(source, '"models":');
    if (points.length < 20) throw new Error('Missing coding frontier points');
    return points.map(p => {
      if (!p.name || !p.harness || ![p.quality, p.cost, p.avg_turns, p.avg_latency_min].every(Number.isFinite)) throw new Error('Incomplete coding frontier point');
      return { model: p.name.replace(/ \((?:claude code|codex)\)$/i, ''), harness: p.harness, score: p.quality, cost: p.cost,
        metrics: { latency: p.avg_latency_min * 60, turns: p.avg_turns } };
    });
  },
};

export default board;
