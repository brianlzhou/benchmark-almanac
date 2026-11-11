// CursorBench 4.0. The chart's JS data contains every model and effort, including series hidden
// by default. Read literal objects as data, never execute the downloaded bundle. Score is task
// success in percent, avgCost is dollars per task, outputTokens is output tokens per task, and
// avgSteps is agent steps per task. Discover the current chunk from the page on every refresh.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
const PAGE = 'https://cursor.com/cursorbench';
const MODEL = /key:"([^"]+)",version:"[^"]+",label:"([^"]+)"[^\[{}]*,runs:\[([^\]]+)\]/g;
const board: Leaderboard = {
  benchmark: 'cursorbench-4-0', url: PAGE, feed: `${PAGE} (current chart data chunk)`,
  terms: 'Cursor terms prohibit automated extraction; Benchmark Almanac credits and links Cursor as the source of these benchmark results.',
  chart: {
    title: 'CursorBench score by average cost per task',
    x: { key: 'cost', label: 'Average cost per task', unit: '$', better: 'lower' },
    y: { key: 'score', label: 'CursorBench score', unit: '%', better: 'higher' },
  },
  async fetch() {
    const page = await fetchText(PAGE);
    if (!page.includes('CursorBench 4.0')) throw new Error('CursorBench page no longer identifies version 4.0');
    const scripts = [...new Set([...page.matchAll(/<script[^>]+src="([^"]+\.js)"/g)].map(m => new URL(m[1], PAGE).href))].reverse();
    for (const url of scripts) {
      if (new URL(url).origin !== new URL(PAGE).origin) continue;
      await new Promise(resolve => setTimeout(resolve, 1050));
      const js = await fetchText(url);
      const models = [...js.matchAll(MODEL)];
      if (!models.length) continue;
      const rows: LeaderboardRow[] = [];
      for (const [, , model, runs] of models) {
        for (const r of runs.matchAll(/\{([^{}]+)\}/g)) {
          const val = (key: string) => {
            const m = r[1].match(new RegExp(`(?:^|,)${key}:(-?(?:\\d+(?:\\.\\d*)?|\\.\\d+))(?=,|$)`));
            return m ? Number(m[1]) : undefined;
          };
          const score = val('score'), cost = val('avgCost'), tokens = val('outputTokens'), steps = val('avgSteps');
          if (score === undefined) throw new Error(`CursorBench score missing for ${model}`);
          rows.push({ model, score, cost, tokens, setting: r[1].match(/effort:"([^"]+)"/)?.[1], harness: 'Cursor', metrics: steps === undefined ? undefined : { steps } });
        }
      }
      if (!rows.length) throw new Error('CursorBench data chunk contains no runs');
      return rows;
    }
    throw new Error('CursorBench chart data chunk not found');
  },
};
export default board;
