// LiveNewsBench Release 2 measures answers to recent-news questions under several search budgets.
// The score is accuracy as a percentage for each model and search setting.
// This importer reads the authors' JavaScript results object, which includes the average searches and clicks.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';

const PAGE = 'https://livenewsbench.com/';
const FEED = 'https://livenewsbench.com/data.js';
interface Config { title?: string; columns?: string[]; data?: (string | null)[][] }

const board: Leaderboard = {
  benchmark: 'livenewsbench-2',
  url: PAGE,
  feed: FEED,
  terms: 'The authors publish these results on the LiveNewsBench site. Results are credited to the LiveNewsBench authors.',
  async fetch() {
    const source = await fetchText(FEED);
    const data = jsLiteral<Record<string, Config>>(source, source.indexOf('{', source.indexOf('const resultsData')));
    const rows: LeaderboardRow[] = [];
    for (const [key, config] of Object.entries(data)) {
      if (!config.title || !config.data || config.data.length === 0) continue;
      for (const entry of config.data) {
        const [model, reasoning, open, official, searches, clicks, accuracy] = entry;
        const score = typeof accuracy === 'string' ? Number(accuracy.replace('%', '')) : NaN;
        if (typeof model !== 'string' || !Number.isFinite(score)) throw new Error(`LiveNewsBench Release 2: incomplete row in ${key}`);
        const parseAverage = (value: string | null) => value ? Number(value.match(/[\d.]+/)?.[0]) : undefined;
        const metrics: Record<string, number> = {};
        const searchAverage = typeof searches === 'string' ? parseAverage(searches) : undefined;
        const clickAverage = typeof clicks === 'string' ? parseAverage(clicks) : undefined;
        if (searchAverage !== undefined) metrics.searches = searchAverage;
        if (clickAverage !== undefined) metrics.clicks = clickAverage;
        rows.push({ model, score, setting: `${config.title}; reasoning ${reasoning === '✅' ? 'yes' : 'no'}; open ${open === '✅' ? 'yes' : 'no'}; official search ${official === '✅' ? 'yes' : 'no'}`, metrics });
      }
    }
    if (rows.length !== 41) throw new Error(`LiveNewsBench Release 2: ${rows.length} rows, expected 41`);
    return rows;
  },
};

export default board;
