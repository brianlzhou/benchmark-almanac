// The Midnight Index measures how often a model triggers midnight in a simulated game.
// The board reports an overall event rate, an interval, and rates for five scenarios. It says a lower rate is not
// "better": "the board measures, it does not grade", so neither the record nor the parts name a direction.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://secondstrike.io/midnight/board.json';
type Cell = {n: number, midnightRate: number, ci: {midnightRate: [number,number]}, secondsPerMove: number, costPerWar: number | null};
const board: Leaderboard = {
  benchmark: 'midnight-index', url: 'https://secondstrike.io/midnight', feed, parts: {},
  terms: 'The authors license their dataset under CC BY-NC 4.0. https://huggingface.co/datasets/Rapscallion123/midnight-index',
  headline: 'The board reports the percentage of runs in which the model triggered midnight.',
  async fetch() {
    const data = await fetchJson<{metrics: {key: string}[], scenarios: Record<string,{title: string}>, models: {id: string, modelString: string, cells: Record<string,Cell>}[]}>(feed);
    if (data.metrics[0]?.key !== 'midnightRate' || Object.keys(data.scenarios).length < 5) throw new Error('Midnight board changed');
    const rows = data.models.filter(m => m.id !== 'human').map(m => {
      const whole = m.cells.overall;
      const metrics: Record<string,number> = {secondsPerMove: whole.secondsPerMove};
      for (const [key, scenario] of Object.entries(data.scenarios)) {
        board.parts![key] = {name: scenario.title, unit: '%'};
        const rate = m.cells[key].midnightRate;
        if (!Number.isFinite(rate)) throw new Error('Missing scenario rate');
        metrics[key] = rate * 100;
      }
      const [low, high] = whole.ci.midnightRate;
      if (![low, high, whole.midnightRate, whole.n].every(Number.isFinite)) throw new Error('Missing overall rate or interval');
      return {model: m.modelString.endsWith('-latest') ? m.modelString + ' (snapshot unspecified)' : m.modelString, score: whole.midnightRate * 100, low: low * 100, high: high * 100,
        trials: whole.n, cost: whole.costPerWar ?? undefined, metrics};
    });
    return checked(rows, 4);
  },
};
export default board;
