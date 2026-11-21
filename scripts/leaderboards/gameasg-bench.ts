// GameASG-Bench tests coding agents on 47 playable browser games.
// Tables 3 and 4 give strict game success, check pass rates and mean resources for nine agent stacks.
// Tables 5 to 8 compare tools, turn budgets, reasoning effort and harnesses for DeepSeek-V4-Flash.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2609.21293';
const num = (s: string) => numberCell(s.replaceAll(',', ''));
function success(value: string) {
  const match = value.match(/^(\d+)\/47 \(([\d.]+)\)$/);
  if (!match) throw new Error('Missing success count or rate');
  return { count: num(match[1]), rate: num(match[2]) };
}
const board: Leaderboard = {
  benchmark: 'gameasg-bench', static: 'paper', url: feed, feed,
  parts: { l1: 'L1', l2: 'L2', p0: 'L2 P0', p1: 'L2 P1', p2: 'L2 P2' },
  stats: {
    gamesPassed: { name: 'Games passed', unit: 'count' }, artifactKB: { name: 'Artifact size', unit: 'count', note: 'Artifact size in kilobytes.' },
    inputTokens: { name: 'Input tokens', unit: 'tokens' }, outputTokens: { name: 'Output tokens', unit: 'tokens' }, reasoningTokens: { name: 'Reasoning tokens', unit: 'tokens' }, evaluated: { name: 'Evaluated games', unit: 'count' },
  },
  terms: 'The authors publish these paper tables under the terms at https://arxiv.org/abs/2609.21293.',
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    function table(header: string) {
      const t = tables.find(t => t[0]?.join('|') === header);
      if (!t) throw new Error('GameASG table missing: ' + header);
      return t;
    }
    const main = table('Model|Harness|Strict task success|L1|L2|L2|L2|L2');
    const resources = table('Model|Harness|Artifact size (KB)|Input tokens (k)|Output tokens (k)|Monetary cost (USD)');
    if (main[1].slice(4).join('|') !== 'Mean|P0|P1|P2') throw new Error('Missing L2 priorities');
    const rows: LeaderboardRow[] = main.slice(2).map(([model, harness, strict, l1, l2, p0, p1, p2]) => {
      const cost = resources.find(r => r[0] === model && r[1] === harness);
      if (!cost) throw new Error('Missing model resource row');
      const { count, rate } = success(strict);
      return { model, harness, setting: 'Maximum reasoning effort', score: rate, cost: num(cost[5]), tokens: num(cost[4]) * 1000,
        metrics: { gamesPassed: count, l1: num(l1), l2: num(l2), p0: num(p0), p1: num(p1), p2: num(p2),
          artifactKB: num(cost[2]), inputTokens: num(cost[3]) * 1000, outputTokens: num(cost[4]) * 1000 } };
    });
    checked(rows, 9);
    const model = 'DeepSeek-V4-Flash';
    function add(setting: string, harness: string, strict: string, checks: string[], extra: Record<string, number> = {}) {
      const { count, rate } = success(strict);
      const [l1, p0, p1, p2] = checks.map(num);
      rows.push({ model, harness, setting, score: rate, metrics: { gamesPassed: count, l1, p0, p1, p2, ...extra } });
    }
    for (const [setting, strict, ...checks] of table('Tool setting|Strict task success|L1|L2 P0|L2 P1|L2 P2').slice(1)) {
      if (setting !== 'Full tool access') add(setting, setting.startsWith('No tools') ? 'Serialized API' : 'Claude Code', strict, checks);
    }
    for (const [limit, evaluated, strict, , ...checks] of table('Nominal turn budget|Evaluated / planned|Strict task success|Strict task success|L1|L2 P0|L2 P1|L2 P2').slice(2)) {
      if (limit !== '120') add(limit + ' turns', 'Claude Code', strict, checks, { evaluated: num(evaluated.split('/')[0]) });
    }
    for (const [effort, strict, l1, p0, p1, p2, tokens] of table('Effort|Strict task success|L1|L2 P0|L2 P1|L2 P2|Reasoning tokens').slice(1)) {
      if (effort === 'Max') {
        const base = rows.find(r => r.model === model && r.setting === 'Maximum reasoning effort');
        if (!base?.metrics) throw new Error('Missing maximum-effort baseline');
        base.metrics.reasoningTokens = num(tokens);
      } else add(effort + ' reasoning effort', 'Claude Code', strict, [l1, p0, p1, p2], { reasoningTokens: num(tokens) });
    }
    for (const [harness, strict, ...checks] of table('Harness|Strict task success|L1|L2 P0|L2 P1|L2 P2').slice(1)) {
      if (harness !== 'Claude Code') add('Maximum reasoning effort', harness, strict, checks);
    }
    return checked(rows, 17);
  },
};
export default board;
