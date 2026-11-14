// FrontierBioML (Valen Labs): 25 long-horizon machine learning tasks in computational biology, graded on sealed
// held-out data. The site's data/data.js assigns one JSON object to window.FBML_DATA, with every run of every
// agent: [task, trial, reward 0 to 1, passed checks, refused, agent minutes, cost in dollars, prompt tokens, output
// tokens]. It has no totals, so this importer computes the board's own score (assets/js/app.js agentStats): the
// mean over the 25 tasks of each task's mean reward, where failed and refused runs keep their reward of 0, shown out
// of 100. Only agents with every run done are ranked, as on the site. The JSON is parsed, never run.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const SITE = 'https://www.frontierbioml.com/';
const FEED = `${SITE}data/data.js`;

type Run = [string, string, number, boolean, boolean, number | null, number | null, number | null, number | null];
interface Agent { key: string; model: string; harness: string; reasoning?: string; runsPerTask?: number; complete?: boolean; runs: Run[] }
interface Data { tasks: { id: string }[]; taskSets?: { key: string; tasks: string[] }[]; agents: Agent[] }

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const round = (x: number, d: number) => Math.round(x * 10 ** d) / 10 ** d;
const has = (x: number | null): x is number => typeof x === 'number' && Number.isFinite(x);

const board: Leaderboard = {
  benchmark: 'frontierbioml',
  url: SITE,
  feed: `${FEED} (window.FBML_DATA, every run)`,
  terms: 'The site states no terms of use and has no robots.txt. It names data/data.js as the source of its raw scores.',
  chart: {
    title: 'Score against time',
    x: { key: 'minutes', label: 'Median agent minutes per run', unit: 'minutes', better: 'lower' },
    y: { key: 'score', label: 'Mean score', better: 'higher' },
    note: 'The board plots each agent’s mean score against its median minutes per run.',
  },
  async fetch() {
    const js = await fetchText(FEED);
    const start = js.indexOf('{', js.indexOf('window.FBML_DATA'));
    const d = JSON.parse(js.slice(start, js.lastIndexOf('}') + 1)) as Data;
    const tasks = d.taskSets?.find((s) => s.key === 'all')?.tasks ?? d.tasks.map((t) => t.id);
    if (tasks.length < 20) throw new Error(`FrontierBioML lists ${tasks.length} tasks`);
    const out: LeaderboardRow[] = [];
    for (const a of d.agents) {
      const per = a.runsPerTask ?? 1;
      const runs = a.runs.filter((r) => tasks.includes(r[0]));
      const byTask = tasks.map((t) => runs.filter((r) => r[0] === t).map((r) => Number(r[2])));
      if (byTask.some((xs) => xs.length < per)) continue; // still running: the site shows it unranked
      const minutes = runs.map((r) => r[5]).filter(has);
      const costs = runs.map((r) => r[6]).filter(has);
      const output = runs.map((r) => r[8]).filter(has);
      const metrics: Record<string, number> = {
        failed: runs.filter((r) => !r[4] && !r[3]).length,
        refused: runs.filter((r) => r[4]).length,
      };
      if (minutes.length) metrics.minutes = round(median(minutes), 1);
      if (costs.length) metrics.medianCost = round(median(costs), 2);
      out.push({
        model: a.model,
        setting: a.reasoning ? (a.reasoning === 'on' ? 'reasoning on' : `${a.reasoning} effort`) : undefined,
        harness: a.harness,
        score: round(mean(byTask.map(mean)) * 100, 1),
        cost: costs.length ? round(mean(costs), 2) : undefined,
        tokens: output.length ? Math.round(mean(output)) : undefined,
        metrics,
      });
    }
    if (out.length < 8) throw new Error(`FrontierBioML board has ${out.length} ranked agents`);
    return out;
  },
};
export default board;
