// DuMateBench tests agents on 200 office tasks. Final scores give 30% weight
// to deterministic checks and 70% to judge ratings. The board stores both on a 0 to 1 scale.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://dumatebench.com/leaderboard';
type Result = { partial: number, judge: number, final: number };
const board: Leaderboard = {
  benchmark: 'dumatebench', url, feed: url, harnesses: 'system',
  terms: 'Baidu publishes these scores at https://dumatebench.com/leaderboard under the site’s terms.',
  stats: {
    partial: { name: 'Partial pass rate', unit: 'score', better: 'higher' },
    judge: { name: 'Judge score', unit: 'score', better: 'higher' },
  },
  async fetch() {
    const page = await fetchText(url);
    const path = page.match(/href="([^"]*\/chunks\/theme\.[^"]+\.js)"/)?.[1];
    if (!path) throw new Error('Missing leaderboard theme');
    const script = await fetchText(new URL(path, url).href);
    const start = script.indexOf('[{agent:"');
    if (start < 0) throw new Error('Missing leaderboard results');
    const groups = jsLiteral<{agent: string, scores: Record<string, Result>}[]>(
      script.slice(start).replace(/:\.(\d)/g, ':0.$1'), 0);
    const rows = groups.flatMap(({agent, scores}) => Object.entries(scores).map(([model, r]) => {
      if (![r.final, r.partial, r.judge].every(n => Number.isFinite(n) && n >= 0 && n <= 1))
        throw new Error('Invalid final, partial, or judge score');
      return {model, harness: agent, score: r.final, metrics: {partial: r.partial, judge: r.judge}};
    }));
    return checked(rows, 20);
  },
};
export default board;
