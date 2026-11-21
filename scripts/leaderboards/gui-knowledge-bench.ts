// GUI Knowledge Bench averages eight interface knowledge scores with equal weight.
// The importer discovers the current website bundle and reads its model array as data.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';

const feed = "https://computer-use-agents.github.io/GUI-Knowledge-Bench/";
const board: Leaderboard = {
  benchmark: "gui-knowledge-bench",
  url: "https://computer-use-agents.github.io/GUI-Knowledge-Bench/",
  feed,
  terms: "The website repository uses the MIT License. The site returned 404 for robots.txt.",
  parts: { state: 'State', widget: 'Widget', layout: 'Layout', effect: 'Effect', type: 'Type', parameter: 'Parameter', goal: 'Goal', plan: 'Plan' },
  async fetch() {
    const html = await fetchText(feed);
    const path = html.match(/<script[^>]+src="([^"]*\/assets\/index-[^"]+\.js)"/)?.[1];
    if (!path) throw new Error('Missing GUI Knowledge bundle');
    await new Promise(resolve => setTimeout(resolve, 1000));
    const source = await fetchText(new URL(path, feed).href);
    const start = source.search(/\[\{model:"[^"]+",state:/);
    if (start < 0) throw new Error('Missing model array');
    const entries = jsLiteral<({ model: string } & Record<string, number>)[]>(source, start);
    if (entries.length < 9) throw new Error('Missing GUI models');
    return entries.map(r => {
      const metrics = Object.fromEntries(Object.keys(board.parts!).map(k => [k, r[k]]));
      if (!r.model || !Object.values(metrics).every(Number.isFinite)) throw new Error('Incomplete GUI score');
      return { model: r.model, score: Number((Object.values(metrics).reduce((a, b) => a + b, 0) / 8).toFixed(2)), metrics };
    });
  },
};
export default board;
