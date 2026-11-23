// NorEval tests Norwegian language skills. The dashboard defines its headline as follows.
// “Scores are first averaged within each task category, then averaged across categories.”
// It normalizes each task against chance before averaging and selects the highest-scoring prompt.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

type Point = number | {max: number, max_ci_lo?: number, max_ci_hi?: number};
type Task = {category: string, main_metric: string, random_baseline: number, max_performance: number};
type Data = {
  metrics_setup: Record<string, Task>, model_display_names: Record<string,string>,
  model_parameters: Record<string,number>, model_info: Record<string,{license?:string}>,
  models?: Record<string,Results>, model_ids?: string[], results_version?: string,
};
type Results = Record<string,Record<string,Record<string,Point>>>;
const feed = 'https://ltgoslo.github.io/llm-dashboard/noreval/data.json';

// Since 2026-11-21 data.json carries only the metadata and `model_ids`. Each model's results sit in
// models/<id>.json, which the dashboard (shared/comparison.js) loads with ?v=<results_version>.
async function loadResults(d: Data): Promise<Record<string,Results>> {
  if (d.models) return d.models;
  if (!d.model_ids?.length) throw new Error('NorEval data.json has neither models nor model_ids');
  const version = d.results_version ? '?v=' + d.results_version : '';
  const out: Record<string,Results> = {};
  for (let i = 0; i < d.model_ids.length; i += 6) {
    const batch = d.model_ids.slice(i, i + 6);
    const files = await Promise.all(batch.map(id => fetchJson<Results>(new URL('models/' + encodeURIComponent(id) + '.json' + version, feed).href)));
    batch.forEach((id, j) => { out[id] = files[j]; });
  }
  return out;
}
const board: Leaderboard = {
  benchmark: 'noreval', url: 'https://ltgoslo.github.io/llm-dashboard/noreval/', feed,
  terms: 'The Language Technology Group publishes the dashboard and its data at https://ltgoslo.github.io/llm-dashboard/noreval/.',
  headline: 'The dashboard averages chance-adjusted task scores within categories, then weights each category equally.',
  aliases: {'DeepSeek V4 Flash 284B (13B active)': 'deepseek-v4-flash-base'},
  parts: {},
  async fetch() {
    const d = await fetchJson<Data>(feed);
    const tasks = Object.entries(d.metrics_setup);
    if (tasks.length < 35) throw new Error('Missing NorEval tasks');
    const rows: LeaderboardRow[] = [];
    for (const [id, results] of Object.entries(await loadResults(d))) {
      for (const shot of ['0','1','5']) {
        const groups = new Map<string, {sum: number, n: number, low2: number, high2: number}>();
        const metrics: Record<string, number> = {};
        for (const [task, info] of tasks) {
          const point = results[task]?.[shot]?.[info.main_metric];
          if (point == null) continue;
          const raw = typeof point === 'number' ? point : point.max;
          const scale = 100 / (info.max_performance - info.random_baseline);
          const value = (raw - info.random_baseline) * scale;
          if (!Number.isFinite(value)) throw new Error('Invalid score for ' + task);
          board.parts![task] = {name: task, group: info.category};
          metrics[task] = value;
          const g = groups.get(info.category) ?? {sum: 0, n: 0, low2: 0, high2: 0};
          g.sum += value;
          g.n++;
          if (typeof point === 'object') {
            g.low2 += (Math.max(0, raw - (point.max_ci_lo ?? raw)) * scale) ** 2;
            g.high2 += (Math.max(0, (point.max_ci_hi ?? raw) - raw) * scale) ** 2;
          }
          groups.set(info.category, g);
        }
        if (groups.size !== 5) continue;
        const categories = [...groups.values()];
        const score = categories.reduce((a,g) => a + g.sum / g.n, 0) / categories.length;
        const width = (k: 'low2'|'high2') => Math.sqrt(categories.reduce((a,g) => a + g[k] / g.n ** 2, 0)) / categories.length;
        const model = /^gemma-[34]-/i.test(id) ? d.model_display_names[id] + ' (pretrained)' : /-base$/i.test(id) && /^qwen/i.test(id) ? id : d.model_display_names[id];
        rows.push({model, setting: shot + '-shot', score, low: score - width('low2'), high: score + width('high2'),
          metrics, params: d.model_parameters[id], license: d.model_info[id]?.license});
      }
    }
    return checked(rows, 291);
  },
};
export default board;
