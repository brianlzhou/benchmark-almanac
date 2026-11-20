// FrontierRSI: Abundant AI's board, read from the data file its page loads (window.FRSI in data.js). Each task
// keeps every model's two trials, each rewarded against the best valid trial on that task, and a model's task score
// is their mean (avg@2). The site's overall score is the mean over all 27 tasks, a task with no valid trial counting
// as 0, and each research area's score is the same mean over that area's tasks (app.js). Both are rebuilt here, and
// the areas and tasks are kept as parts. Cost is the agent API spend for both trials of every task.
import type { BoardPart, Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const SITE = 'https://frontier-rsi.org/';
interface Trial { reward: number | null; status: string }
interface Run { model: string; harness?: string; effort?: string; avg: number | null; trials: Trial[] }
interface Task { id: string; category: string; title: string; desc?: string; models: Run[] }
interface Data {
  categories: { id: string; name: string; blurb?: string }[];
  tasks: Task[];
  models: Record<string, { cost?: { total_usd?: number } }>;
}
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const pct = (x: number) => Math.round(x * 1e4) / 100;

const board: Leaderboard = {
  benchmark: 'frontier-rsi',
  url: SITE,
  feed: `${SITE}data.js (window.FRSI: every task's trials per model)`,
  terms: 'The site sets no robots.txt rules or terms. Results are credited to Abundant AI.',
  costPer: 'run',
  aliases: { 'Muse Wonder 1.0': 'muse-wonder' },
  async fetch() {
    const js = await fetchText(SITE + 'data.js');
    const json = js.slice(js.indexOf('{'), js.lastIndexOf('}') + 1);
    const d = JSON.parse(json) as Data;
    if (d.tasks.length < 20) throw new Error(`FrontierRSI: ${d.tasks.length} tasks, expected 27`);
    const parts: Record<string, BoardPart> = {};
    for (const c of d.categories) parts[`area:${c.id}`] = { name: c.name, group: 'Research area', note: c.blurb };
    for (const t of d.tasks) parts[`task:${t.id}`] = { name: t.title, group: 'Task', note: t.desc };
    board.parts = parts;
    const models = [...new Set(d.tasks.flatMap((t) => t.models.map((r) => r.model)))];
    return models.map((model): LeaderboardRow => {
      const runs = d.tasks.map((t) => ({ t, r: t.models.find((r) => r.model === model) }));
      const score = (ts: typeof runs) => pct(mean(ts.map(({ r }) => r?.avg ?? 0)));
      const metrics: Record<string, number> = {};
      for (const c of d.categories) metrics[`area:${c.id}`] = score(runs.filter(({ t }) => t.category === c.id));
      for (const { t, r } of runs) if (r && r.avg !== null) metrics[`task:${t.id}`] = pct(r.avg);
      const first = runs.find(({ r }) => r)?.r;
      return {
        model,
        score: score(runs),
        harness: first?.harness,
        setting: first?.effort,
        trials: 2,
        cost: d.models[model]?.cost?.total_usd,
        metrics,
      };
    });
  },
};
export default board;
