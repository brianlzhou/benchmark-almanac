// xbench-ScienceQA (xbench AGI Tracking series). xbench.org is a single-page app. Its boards come from two
// places, and both are read here as data, never run: a public Strapi API at admin.xbench-ai.com (base URL
// and query strings named in the site bundle), and literal arrays inside the bundle for the older boards.
// ScienceQA reads /api/scienceqas with the page's own query (ranked rows only): per model the score (mean
// accuracy, 0 to 100, the ranking), best of N, reasoning effort and evaluation date. Other xbench importers
// use xbenchApi and xbenchArray from this file.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson, fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';

export const XBENCH_API = 'https://admin.xbench-ai.com/api/';
export const XBENCH_TERMS =
  'Public JSON API and bundle data of the xbench.org app; robots.txt on both hosts allows all paths and the site states no terms.';

/** One xbench API endpoint, with the query string the site itself sends. */
export const xbenchApi = <T>(path: string) => fetchJson<T>(XBENCH_API + path);

/**
 * A literal array from the xbench.org bundle, found by the start of its first element (for example
 * `[{rank:1,model:"o3",company:"OpenAI",average:`). The bundle name changes on each deploy, so it is
 * found in the page first.
 */
export async function xbenchArray<T>(start: RegExp): Promise<T[]> {
  const page = 'https://xbench.org/';
  const src = (await fetchText(page)).match(/src="(\/[^"]*\/index-[\w-]+\.js)"/)?.[1];
  if (!src) throw new Error('no bundle script on the xbench page');
  const js = await fetchText(new URL(src, page).href);
  const at = js.search(start);
  if (at < 0) throw new Error(`no array matching ${start} in the xbench bundle`);
  return jsLiteral<T[]>(js, at);
}

interface Entry {
  score?: number;
  reasoning_effort?: string;
  evaluationDate?: string;
  model?: { name?: string };
}

const PATH = 'scienceqas?sort[0]=score:desc&sort[1]=BoN:desc&pagination[limit]=100&populate[model][populate]=company&filters[is_ranked]=true';

const board: Leaderboard = {
  benchmark: 'xbench-scienceqa',
  url: 'https://xbench.org/agi/scienceqa',
  feed: XBENCH_API + PATH,
  terms: XBENCH_TERMS,
  aliases: {},
  async fetch() {
    const { data } = await xbenchApi<{ data: Entry[] }>(PATH);
    const rows: LeaderboardRow[] = [];
    for (const e of data) {
      const model = e.model?.name?.trim();
      if (!model || typeof e.score !== 'number') continue;
      const effort = e.reasoning_effort && e.reasoning_effort !== 'default' ? e.reasoning_effort : undefined;
      rows.push({ model, score: e.score, setting: effort, date: e.evaluationDate });
    }
    return rows;
  },
};
export default board;
