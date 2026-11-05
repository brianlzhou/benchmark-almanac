// MCP-Universe (Salesforce AI Research) on mcp-universe.github.io. The results section is static HTML with
// one table per track: the LLM ReAct track, the LLM function-calling track and an agent track. Each lists
// six domain columns, Average Evaluator Score, Average Steps and Overall Success Rate (0 to 100, the
// headline). The page's default "Overall" track is filled by script from the two LLM tracks, showing each
// model's highest success rate from either one, and this importer rebuilds it the same way. The track that
// gave the best score is kept as the harness. The agent track (frameworks such as Cursor) is not read.
// That track's Average Steps and Average Evaluator Score are kept as metrics.steps and metrics.evaluator.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const URL = 'https://mcp-universe.github.io/';

const board: Leaderboard = {
  benchmark: 'mcp-universe',
  url: `${URL}#results`,
  feed: `${URL} (ReAct and function-calling track tables, best Overall Success Rate per model)`,
  terms: 'Static GitHub Pages project site with no robots.txt and no terms; the MCP-Universe repository is Apache-2.0.',
  aliases: {
    'Claude-4.0-Sonnet': 'claude-sonnet-4',
    'Claude-4.0-Opus': 'claude-opus-4',
    'Claude-4.1-Opus': 'claude-opus-4-1',
    'Claude-4.5-Sonnet': 'claude-sonnet-4-5',
    'Claude-4.5-Haiku': 'claude-haiku-4-5',
    'Qwen3-Coder-480B-A35B-Instruct': 'qwen3-coder-480b-a35b',
    'Qwen3-235B-A22B-Instruct-2507': 'qwen3-235b-a22b-instruct-jul-2025',
    'Kimi-K2-0711': 'kimi-k2-jul-2025',
    'Kimi-K2-0905': 'kimi-k2-sep-2025',
  },
  async fetch() {
    const html = await fetchText(URL);
    // the track tables in page order: Overall (filled by script, empty here), ReAct, function calls, agents
    const tracks = tables(html).filter((t) => t[0]?.some((c) => c.text === 'Overall Success Rate'));
    if (tracks.length < 3 || !/ReAct/.test(html.slice(0, html.indexOf('(w/ Function Calls) Track')))) {
      throw new Error(`expected four MCP-Universe track tables, found ${tracks.length}`);
    }
    const best = new Map<string, LeaderboardRow>();
    [tracks[1], tracks[2]].forEach((t, k) => {
      const head = t[0].map((c) => c.text);
      const iModel = head.indexOf('Model');
      const iScore = head.indexOf('Overall Success Rate');
      const iSteps = head.indexOf('Average Steps');
      const iEval = head.indexOf('Average Evaluator Score');
      if (iModel < 0) throw new Error(`unexpected MCP-Universe header: ${head.join(' | ')}`);
      for (const r of t.slice(1)) {
        const name = r[iModel]?.text;
        const score = num(r[iScore]?.text);
        if (!name || score === undefined) continue;
        // "Claude-4.0-Sonnet-Thinking": the thinking mode of the named model
        const thinking = /-Thinking$/i.test(name) && !/^Qwen/i.test(name);
        const model = thinking ? name.replace(/-Thinking$/i, '') : name;
        const prev = best.get(name);
        if (!prev || score > prev.score) {
          const steps = iSteps >= 0 ? num(r[iSteps]?.text) : undefined;
          const evaluator = iEval >= 0 ? num(r[iEval]?.text) : undefined;
          const metrics = { ...(steps === undefined ? {} : { steps }), ...(evaluator === undefined ? {} : { evaluator }) };
          best.set(name, {
            model,
            score,
            setting: thinking ? 'thinking' : undefined,
            harness: k === 0 ? 'ReAct' : 'native function calling',
            ...(Object.keys(metrics).length ? { metrics } : {}),
          });
        }
      }
    });
    if (!best.size) throw new Error('no rows in the MCP-Universe track tables');
    return [...best.values()];
  },
};
export default board;
