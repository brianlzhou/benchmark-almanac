// SkateBench V2. skatebench.t3.gg is a Next.js page whose results ship inside its page script chunk as a
// JSON.parse('...') literal: per model (an API-style id with the reasoning setting appended,
// "gpt-5.4-high") the correct, incorrect and error counts over 390 trick definitions, the success rate,
// cost and tokens. The success rate (0 to 100) is the score. The chunk name changes on each deploy, so it is
// found in the page first; the literal is read as data, never run. The page hides some models behind a
// filter by default; every model in the data is passed on. Each row also carries averageDuration as "latency"
// (seconds per response), the page's "Response Latency" chart and the time view of its "Value Matrix" scatter.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://skatebench.t3.gg/';

interface Result {
  model: string;
  successRate?: number;
  totalTests?: number;
  averageCostPerTest?: number;
  totalCompletionTokens?: number;
  /** Mean response time in milliseconds. */
  averageDuration?: number;
}

const board: Leaderboard = {
  benchmark: 'skatebench-2',
  url: PAGE,
  feed: `${PAGE} (results literal in the app/page script chunk, successRate)`,
  terms: 'Public page; skatebench.t3.gg has no robots.txt rules and states no terms.',
  chart: {
    title: 'Value Matrix',
    note: 'Accuracy against average response time; the page toggles this view with cost, and top-left is best.',
    x: { key: 'latency', label: 'Average response time', unit: 's', better: 'lower', log: true },
    y: { key: 'score', label: 'Accuracy', unit: '%', better: 'higher' },
  },
  async fetch() {
    const html = await fetchText(PAGE);
    const src = html.match(/src="(\/_next\/static\/chunks\/app\/page-[^"]+\.js[^"]*)"/)?.[1];
    if (!src) throw new Error('no page chunk on the SkateBench page');
    const js = await fetchText(new URL(src.replace(/&amp;/g, '&'), PAGE).href);
    const start = js.indexOf(`JSON.parse('{"c":[`);
    if (start < 0) throw new Error('no results literal in the page chunk');
    const body = js.slice(start + "JSON.parse('".length);
    const end = body.search(/(?<!\\)'\)/);
    const data = JSON.parse(body.slice(0, end).replace(/\\'/g, "'").replace(/\\\\/g, '\\')) as { c: Result[] };
    const rows: LeaderboardRow[] = [];
    for (const r of data.c) {
      if (!r.model || typeof r.successRate !== 'number') continue;
      // "claude-4.6-opus-thinking-high" -> "claude-opus-4.6-high"; "gpt-5-default" -> "gpt-5"
      const model = r.model
        .replace(/-default$/, '')
        .replace(/^claude-(\d+(?:\.\d+)?)-(opus|sonnet|haiku)/, 'claude-$2-$1')
        .replace(/-thinking-(minimal|low|medium|high|xhigh|max)$/, '-$1');
      rows.push({
        model,
        score: Number(r.successRate.toFixed(2)),
        cost: r.averageCostPerTest,
        tokens: r.totalCompletionTokens && r.totalTests ? r.totalCompletionTokens / r.totalTests : undefined,
        metrics: typeof r.averageDuration === 'number' && r.averageDuration > 0 ? { latency: Number((r.averageDuration / 1000).toFixed(2)) } : undefined,
      });
    }
    return rows;
  },
};
export default board;
