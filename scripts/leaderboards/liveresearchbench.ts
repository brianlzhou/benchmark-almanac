// LiveResearchBench (Salesforce AI Research). livedeepresearch.github.io has one server-rendered table of
// research agents in three groups (group rows: "Single-Agent with Web Search", "Single-Agent Deep
// Research", "Multi-Agent Deep Research"), scored on four report criteria and their Avg, the headline. Avg
// is the score. Plain models in the web-search group get the harness "web search". Systems written
// "Open Deep Research (w. GPT-5)" keep the model with the system as the harness. Deep research products
// keep their own names, and only those with a model record match.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const PAGE = 'https://livedeepresearch.github.io/';

const board: Leaderboard = {
  benchmark: 'liveresearchbench',
  url: PAGE,
  feed: `${PAGE} (server-rendered table, Avg)`,
  terms: 'Static GitHub Pages project page (no robots.txt, so nothing is disallowed); it publishes no terms.',
  aliases: {
    'Claude 4 Sonnet': 'claude-sonnet-4',
    'Claude 4.1 Opus': 'claude-opus-4-1',
    'OpenAI o3 Deep Research': 'deep-research',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const t = tables(await fetchText(PAGE)).find((rows) => rows[0]?.some((c) => c.text === 'Avg') && rows[0]?.some((c) => c.text === 'Agent Name'));
    if (!t) throw new Error('LiveResearchBench table not found');
    const head = t[0].map((c) => c.text);
    const [iName, iAvg] = [head.indexOf('Agent Name'), head.indexOf('Avg')];
    const rows: LeaderboardRow[] = [];
    let group = '';
    for (const r of t.slice(1)) {
      if (r.length === 1) {
        group = r[0].text;
        continue;
      }
      const name = r[iName]?.text ?? '';
      const score = num(r[iAvg]?.text);
      if (!name || score === undefined) continue;
      const w = name.match(/^(.+?)\s*\(w\.\s*([^)]+)\)$/);
      if (w) rows.push({ model: w[2].trim(), score, harness: w[1].trim() });
      else rows.push({ model: name, score, harness: /web search/i.test(group) ? 'web search' : undefined });
    }
    return rows;
  },
};
export default board;
