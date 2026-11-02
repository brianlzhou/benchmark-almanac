// MCP-Universe (Salesforce AI Research) on mcp-universe.github.io. The results section is static HTML with
// one table per track: the LLM ReAct track, the LLM function-calling track and an agent track. Each lists
// six domain columns, Average Evaluator Score, Average Steps and Overall Success Rate (0 to 100, the
// headline). The page's default "Overall" track is filled by script from the two LLM tracks, showing each
// model's highest success rate from either one, and this importer rebuilds it the same way. The track that
// gave the best score is kept as the harness. The agent track (frameworks such as Cursor) is not read.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const URL = 'https://mcp-universe.github.io/';

const board: Leaderboard = {
  benchmark: 'mcp-universe',
  url: `${URL}#results`,
  feed: `${URL} (ReAct and function-calling track tables, best Overall Success Rate per model)`,
  terms: 'Static GitHub Pages project site with no robots.txt and no terms; the MCP-Universe repository is Apache-2.0.',
  aliases: {},
  async fetch() {
    const html = await fetchText(URL);
    // the tables follow their track headings in order: overall (filled by script), ReAct, function calls, agents
    const marks = ['(w/ ReAct) Track', '(w/ Function Calls) Track'].map((m) => html.indexOf(m));
    if (marks.some((i) => i < 0)) throw new Error('MCP-Universe track headings not found');
    const best = new Map<string, LeaderboardRow>();
    marks.forEach((at, k) => {
      const t = tables(html.slice(at))[0];
      const head = t?.[0]?.map((c) => c.text) ?? [];
      const iModel = head.indexOf('Model');
      const iScore = head.indexOf('Overall Success Rate');
      if (iModel < 0 || iScore < 0) throw new Error(`unexpected MCP-Universe header: ${head.join(' | ')}`);
      for (const r of t.slice(1)) {
        const model = r[iModel]?.text;
        const score = num(r[iScore]?.text);
        if (!model || score === undefined) continue;
        const prev = best.get(model);
        if (!prev || score > prev.score) best.set(model, { model, score, harness: k === 0 ? 'ReAct' : 'native function calling' });
      }
    });
    if (!best.size) throw new Error('no rows in the MCP-Universe track tables');
    return [...best.values()];
  },
};
export default board;
