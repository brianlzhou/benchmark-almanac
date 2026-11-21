// FrontierEE Bench: Evident Machines' results table, read from the benchmark page. Each model's row gives its
// reasoning effort, Pass@1 and cost per trial. The cost chart's point titles add the passed count and the 95% credible
// interval ("Claude Fable 5.2: $4.44 per run, 11/30 passed (37%, 95% interval 28–53%)").
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const URL = 'https://evidentmachines.com/frontier-ee-bench/';
const text = (s: string) => s.replace(/<!-- -->/g, '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim();

const board: Leaderboard = {
  benchmark: 'frontier-ee-bench',
  url: URL,
  feed: `${URL} (the results table and the cost chart's point titles in the page HTML)`,
  terms: 'Evident Machines’ terms (November 2026) allow automated collection as its robots.txt permits, and robots.txt allows this page. Results are credited to Evident Machines.',
  stats: { passed: { name: 'Runs passed', unit: 'count' }, runs: { name: 'Runs', unit: 'count' } },
  async fetch() {
    const html = await fetchText(URL);
    const body = html.match(/<tbody>([\s\S]*?)<\/tbody>/)?.[1];
    if (!body) throw new Error('FrontierEE Bench: results table missing');
    const asOf = html.match(/As of (\d{1,2}) (\w+) (\d{4})/);
    const date = asOf ? new Date(`${asOf[2]} ${asOf[1]}, ${asOf[3]} UTC`).toISOString().slice(0, 10) : undefined;
    // the chart's titles: name -> passed, attempts, interval
    const detail = new Map(
      [...html.matchAll(/<title>([^<:]+): \$([\d.]+) per run, (\d+)\/(\d+) passed \((\d+)%, 95% interval (\d+)[–-](\d+)%\)/g)].map((m) => [
        m[1].trim(),
        { passed: Number(m[3]), runs: Number(m[4]), low: Number(m[6]), high: Number(m[7]) },
      ]),
    );
    const rows: LeaderboardRow[] = [...body.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map(([, tr]) => {
      const name = text(tr.match(/<span>([^<]+)<\/span>/)?.[1] ?? '');
      const effort = text(tr.match(/__effort">([^<]+)</)?.[1] ?? '');
      const score = Number(text(tr.match(/__score">([\s\S]*?)<\/td>/)?.[1] ?? '').replace('%', ''));
      const cost = Number(text(tr.match(/__cost">([\s\S]*?)<\/td>/)?.[1] ?? '').replace('$', ''));
      const d = detail.get(name);
      if (!name || !Number.isFinite(score) || !d) throw new Error(`FrontierEE Bench: cannot read the row for "${name}"`);
      return {
        model: name,
        score,
        setting: effort || undefined,
        date,
        cost: Number.isFinite(cost) ? cost : undefined,
        trials: 3,
        low: d.low,
        high: d.high,
        metrics: { passed: d.passed, runs: d.runs },
      };
    });
    if (rows.length < 5) throw new Error(`FrontierEE Bench: ${rows.length} rows, expected at least 5`);
    return rows;
  },
};
export default board;
