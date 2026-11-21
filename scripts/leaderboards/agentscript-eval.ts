// AgentScript-Eval tests Agentforce code generation, debugging and optimization on 100 tasks.
// Tables 1, 3 and 4 report pass@3 for direct generation and pass@1 for agentic runs. Table 5 breaks down Opus scores.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2611.13183';
const board: Leaderboard = {
  benchmark: 'agentscript-eval', static: 'paper', url: feed, feed,
  terms: 'The authors publish these results on arXiv. https://arxiv.org/abs/2611.13183',
  parts: { authoring: 'Authoring', debugging: 'Debugging', optimization: 'Optimization' },
  stats: {
    compile: { name: 'Compile rate', unit: '%', better: 'higher' },
    partial: { name: 'Pass rate', unit: '%', better: 'higher' },
    outputTokens: { name: 'Output tokens', unit: 'tokens' },
    passAt3: { name: 'pass@3', unit: '%', better: 'higher' },
  },
  async fetch() {
    const ts = paperTables(await paperHtml(feed)).map(grid);
    function table(header: string) {
      const t = ts.find(t => t[0].join('|') === header);
      if (!t) throw new Error('Missing results table: ' + header);
      return t.slice(1);
    }
    const direct = table('Configuration|Model|pass@k (%)|Compile (%)|Pass rate (%)|Tokens/task');
    const few = table('Model|pass@3 (%)|Compile (%)|Pass rate (%)|Tokens/task');
    const agentic = table('Configuration|Model|pass@1 (%)|Compile (%)|Pass rate (%)|Tokens/task');
    const subsets = new Map(table('Configuration|Authoring (%)|Debugging (%)|Optimization (%)').map(([k, ...v]) => [k, v]));
    const rows: LeaderboardRow[] = [];
    function add(model: string, config: string, cells: string[], agent: boolean) {
      const [score, compile, partial, tokens] = cells;
      if (![score, compile, partial].every(v => /^\d+(\.\d+)?$/.test(v)) || !/^[\d,.]+k$/.test(tokens)) throw new Error('Invalid result');
      const outputTokens = Number(tokens.slice(0, -1).replaceAll(',', '')) * 1000;
      const metrics: Record<string, number> = { compile: Number(compile), partial: Number(partial), outputTokens };
      if (!agent) metrics.passAt3 = Number(score);
      if (model.includes('Opus')) {
        const sub = subsets.get(config === 'Baseline (no skills)' ? 'Agentic baseline' : config);
        if (!sub || sub.length !== 3) throw new Error('Missing Opus breakdown');
        ['authoring', 'debugging', 'optimization'].forEach((k, i) => { metrics[k] = Number(sub[i]); });
      }
      rows.push({ model, harness: agent ? config : undefined, setting: agent ? 'Agentic, pass@1' : config + ', pass@3', score: Number(score), metrics, tokens: outputTokens });
    }
    for (const [config, model, ...v] of direct) if (!config) add(model, 'Zero-shot direct', v, false);
    for (const [model, ...v] of few) add(model, 'Two-shot direct', v, false);
    for (const [config, model, ...v] of agentic) add(model, config, v, true);
    return checked(rows, 20);
  },
};
export default board;
