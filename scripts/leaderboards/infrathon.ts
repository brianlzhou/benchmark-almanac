// Infrathon tests GPU infrastructure optimization within each workload's time and hardware budget.
// The leaderboard ranks each model by its best valid submission per task and averages the 25 rank scores.
// Its data file includes bootstrap confidence intervals, wins, visible output tokens and each workload's results.
import type { BoardPart, Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { fetchText } from '../lib/util.ts';

const url = 'https://infrathonx.github.io/';
type ByModel<T> = Record<string, T>;
interface Task {
  key: string; name: string; budget_h: number; gpus: string; unit: string; metric: string;
  results: ByModel<{ best: number; flag: string | null }>;
}
interface Results {
  models: {key: string; name: string}[];
  tasks: Task[];
  ranking: { n: number; rank_score: ByModel<number>; bootstrap: ByModel<{lo: number; hi: number}>; wins: ByModel<number> };
  summary: { first_valid: ByModel<{median_h: number}> };
  tokens: { models: ByModel<{visible_output_m: number; actions_k: number}> };
  flag_legend: Record<string, string>;
}

const board: Leaderboard = {
  benchmark: 'infrathon', url, feed: url,
  terms: 'The authors publish Infrathon under the PolyForm Noncommercial License at https://github.com/InfrathonX/Infrathon/blob/HEAD/LICENSE.',
  stats:{wins:{name:'Wins',unit:'count'},firstValidHours:{name:'First valid submission time',unit:'hours',better:'lower'},visibleOutputTokens:{name:'Visible output tokens',unit:'tokens'},actions:{name:'Actions',unit:'count'}},
  async fetch() {
    const page = await fetchText(url);
    const src = page.match(/<script\s+src="([^"]*data\/infrathon\.js[^"]*)"/)?.[1];
    if (!src) throw new Error('Missing leaderboard data script');
    await new Promise(resolve => setTimeout(resolve, 1000));
    const script = await fetchText(new URL(src, url).href);
    const json = script.match(/window\.INFRATHON\s*=\s*(\{[\s\S]+\})\s*;?\s*$/)?.[1];
    if (!json) throw new Error('Missing Infrathon data');
    const data: Results = JSON.parse(json);
    if (data.tasks.length !== data.ranking.n || data.ranking.n < 25) throw new Error('Incomplete task set');
    const parts: Record<string, BoardPart> = {};
    for (const task of data.tasks) {
      const exceptions = data.models.flatMap(({key, name}) => {
        const flag = task.results[key].flag;
        return flag ? [name + ': ' + data.flag_legend[flag].replaceAll(';', ',')] : [];
      });
      parts[task.key] = { name: task.name, unit: 'score',
        note: [task.unit || task.metric, task.budget_h + ' hours', task.gpus, ...exceptions].join('. ') };
    }
    board.parts = parts;
    return checked(data.models.map(({key, name}) => {
      const { lo, hi } = data.ranking.bootstrap[key];
      const usage = data.tokens.models[key];
      const metrics: Record<string, number> = { wins: data.ranking.wins[key], firstValidHours: data.summary.first_valid[key].median_h,
        visibleOutputTokens: usage.visible_output_m * 1e6, actions: usage.actions_k * 1e3 };
      for (const task of data.tasks) metrics[task.key] = task.results[key].best;
      if (![lo, hi, ...Object.values(metrics)].every(Number.isFinite)) throw new Error('Incomplete results for ' + name);
      return { model: name, score: data.ranking.rank_score[key], low: lo, high: hi, metrics };
    }), 6);
  },
};
export default board;
