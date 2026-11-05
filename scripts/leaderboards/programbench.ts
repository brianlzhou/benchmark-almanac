// ProgramBench (200 tasks). programbench.com is a static Netlify page: its leaderboard table ranks runs by
// Resolved (fully solved instances, the score) and lists Almost (95% of tests passed) and Cost (average
// USD per task); rows past 30 sit in the same HTML behind "Load more". The Pareto chart's script holds
// the same runs as a results array with calls and tokens per task. The tokens there are read as output
// tokens: runs with hundreds of calls list only hundreds of thousands, far below their input. "TBA" costs stay empty.
// The results array also gives each run's date, calls (`turns`) and score, the chart's "% Test Passed (Unofficial
// Metric)" (`testsPassed`, a percent); the table's Almost column (≥ 95% of tests passed) is kept as `almost`.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const PAGE = 'https://programbench.com/';

const board: Leaderboard = {
  benchmark: 'programbench',
  url: PAGE,
  feed: `${PAGE} (static HTML table, Resolved, and the chart's results array)`,
  terms: 'Static page with no terms or robots.txt; the ProgramBench repository (facebookresearch/ProgramBench) is MIT.',
  aliases: {
    'GPT 6 Astra': 'gpt-6-astra',
    'GPT 5.5': 'gpt-5-5',
    'GPT 5.4': 'gpt-5-4',
    'GPT 5.4 mini': 'gpt-5-4-mini',
    'GPT 5 mini': 'gpt-5-mini',
    'Muse Wonder': 'muse-wonder',
  },
  chart: {
    title: 'Pareto',
    note: "The board's Pareto view plots the share of hidden tests passed, which it calls an unofficial metric, against cost, turns, tokens or date. This is its Turns view.",
    x: { key: 'turns', label: 'Turns per task', better: 'lower' },
    y: { key: 'testsPassed', label: '% Test Passed', unit: '%', better: 'higher' },
  },
  async fetch() {
    const html = await fetchText(PAGE);
    const [t] = tables(html);
    const head = t?.[0]?.map((c) => c.text);
    if (!head || head[2] !== 'Model' || head[3] !== 'Agent' || !/^Resolved/.test(head[4]) || !/^Almost/.test(head[5]) || !/^Cost/.test(head[6])) {
      throw new Error(`unexpected ProgramBench header: ${head?.join(' | ')}`);
    }
    const chart = html.match(/var results = (\[[\s\S]*?\]);/);
    type Point = { model: string; tokens?: number | null; calls?: number | null; score?: number | null; date?: number | null };
    const points = new Map<string, Point>();
    if (chart) for (const r of JSON.parse(chart[1]) as Point[]) points.set(r.model, r);
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      const model = r[2]?.text;
      const score = num(r[4]?.text);
      if (!model || score === undefined) continue;
      const p = points.get(model);
      const metrics: Record<string, number> = {};
      const almost = num(r[5]?.text);
      if (almost !== undefined) metrics.almost = almost;
      if (typeof p?.score === 'number') metrics.testsPassed = p.score * 100;
      if (typeof p?.calls === 'number') metrics.turns = p.calls;
      rows.push({
        model,
        harness: r[3]?.text || undefined,
        score,
        cost: num(r[6]?.text),
        tokens: p?.tokens || undefined,
        date: typeof p?.date === 'number' ? new Date(p.date).toISOString().slice(0, 10) : undefined,
        metrics,
      });
    }
    return rows;
  },
};
export default board;
