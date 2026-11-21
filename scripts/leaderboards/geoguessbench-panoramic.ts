// GeoGuessBench scores panoramic location guesses out of 5,000 points. The page lists average score, distance,
// calibration, speed and total cost, and embeds the individual predictions behind the difficulty breakdown.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, jsonAfter, nextFlight } from '../lib/html.ts';

const feed = "https://geo-llm-three.vercel.app/#leaderboard";
type Run = { model: string; tier: string; mode: string; score: number; difficulty: string };

const board: Leaderboard = {
  benchmark: "geoguessbench-panoramic",
  url: "https://geo-llm-three.vercel.app/#leaderboard",
  feed,
  terms: "The project page gives no score reuse terms. Its GitHub link opens the GitHub homepage. The host has no robots.txt.",
  costPer: 'run',
  async fetch() {
    const html = await fetchText(feed);
    const runs = jsonAfter<Run[]>(nextFlight(html), '"runs":');
    const table = tables(html).find(t => t[0]?.map(c => c.text).join('|') === '#|Model|Avg Score ▼|Avg Dist|Country|Confidence|ECE|Cost|Speed');
    if (!table || table.length <= 15) throw new Error('Missing GeoGuessBench standings');
    return table.slice(1).map(row => {
      const label = row[1].text;
      const sample = runs.filter(r => r.mode === 'panoramic' && label.slice(0, label.lastIndexOf(' ')) === r.model);
      const values = row.slice(2).map(c => num(c.text));
      if (!sample.length || values.some(v => v === undefined)) throw new Error('Incomplete panoramic result: ' + label);
      const [display, distanceKm, countryAccuracy, confidence, calibrationError, cost, latency] = values as number[];
      const mean = (r: Run[]) => r.reduce((sum, v) => sum + v.score, 0) / r.length;
      const score = mean(sample);
      if (Math.round(score) !== display) throw new Error('Panoramic mean disagrees with displayed score');
      const metrics: Record<string, number> = { distanceKm, countryAccuracy, confidence, calibrationError, latency, predictions: sample.length };
      for (const level of new Set(sample.map(r => r.difficulty))) {
        metrics[level] = mean(sample.filter(r => r.difficulty === level));
        (board.parts ??= {})[level] = { name: level, group: 'Difficulty' };
      }
      return { model: sample[0].model, score, cost, metrics };
    });
  },
};
export default board;
