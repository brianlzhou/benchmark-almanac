// RoboARCade ranks robot agents by mean rubric completion across 22 tasks.
// The homepage table and its live run files give success, saturation and cost.
// The interval file also contains the trial scores used to compute the task means.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson, fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const page = 'https://roboarcade.org/';
const pause = () => new Promise(r => setTimeout(r, 1000));
type Interval = { mean: number; low: number; high: number; scores: [string, [number, number][]][] };
type Price = { average: { cost_usd: number | null; cost_lower_bound_usd?: number } };
type Run = { model: string; interface: string; average_score: number; saturation: number; average_cost_usd: number | null; provisional: boolean; updated_at: string };

const board: Leaderboard = {
  benchmark: 'roboarcade', url: page, feed: page,
  terms: 'RoboARCade publishes the leaderboard and its JSON assets without a separate score license.',
  stats: {
    saturation: { name: 'Saturation', unit: '%', better: 'higher' },
  },
  async fetch() {
    const html = await fetchText(page);
    const table = tables(html).find(t => t[0]?.[4]?.text.startsWith('Success (%)'));
    if (!table || !table[0][5]?.text.startsWith('Saturation') || !table[0][6]?.text.startsWith('Cost per trial')) throw new Error('Missing RoboARCade columns');
    await pause();
    const ci = await fetchJson<{models: Record<string, Interval>}>(page + 'assets/score-intervals.json');
    await pause();
    const prices = await fetchJson<{models: Record<string, Price>}>(page + 'assets/pricing/manifest.json');
    const rows: LeaderboardRow[] = [];
    this.parts = {};
    const add = (slug: string, label: string, view: string, harness: string, score: number, saturation: number, cost?: number, date?: string, provisional = false) => {
      const [, model, effort] = label.match(/^(.*) \(([^()]+)\)$/) ?? ['', label, ''];
      if (!model || !view || !harness || !Number.isFinite(score) || !Number.isFinite(saturation)) throw new Error('Incomplete RoboARCade row: ' + slug);
      const row: LeaderboardRow = { model, setting: [effort, view, provisional ? 'In progress' : ''].filter(Boolean).join(', '), harness, score, cost, date, link: page+'run/'+slug+'/', metrics: { saturation } };
      const lower = prices.models[slug]?.average.cost_lower_bound_usd;
      if (lower != null) row.metrics!.costLowerBoundUsd = lower;
      const interval = ci.models[slug];
      if (!provisional && interval && Math.abs(score - interval.mean * 100) <= 0.051) {
        row.low = interval.low * 100;
        row.high = interval.high * 100;
        const counts = new Set(interval.scores.map(([, trials]) => trials.length));
        if (counts.size === 1) row.trials = [...counts][0];
        for (const [task, trials] of interval.scores) {
          this.parts![task] = task;
          row.metrics![task] = 100 * trials.reduce((sum, [, value]) => sum + value, 0) / trials.length;
        }
      }
      rows.push(row);
    };
    for (const cells of table.slice(1)) {
      const slug = cells[1].html.match(/href="\/run\/([^/"]+)\//)?.[1];
      if (!slug || cells.length !== 7) throw new Error('Missing RoboARCade run');
      const price = prices.models[slug]?.average;
      add(slug, cells[1].text, cells[3].text, cells[2].text, parseFloat(cells[4].text), parseFloat(cells[5].text), price ? price.cost_usd ?? undefined : parseFloat(cells[6].text));
    }
    await pause();
    const script = await fetchText(page + 'assets/argon-preview.js');
    const cohorts = [...script.matchAll(/prefix:'([^']+)',slug:'([^']+)'/g)];
    if (cohorts.length < 3) throw new Error('Missing RoboARCade live cohorts');
    for (const [, prefix, slug] of cohorts) {
      await pause();
      const run = await fetchJson<Run>(page + 'assets/traces/' + prefix + '/run.json');
      add(slug, run.model, run.interface, 'Antigravity', run.average_score * 100, run.saturation * 100, run.average_cost_usd ?? undefined, run.updated_at.slice(0,10), run.provisional);
    }
    if (rows.length < 9) throw new Error('Expected at least nine RoboARCade runs');
    return rows;
  }
};
export default board;
