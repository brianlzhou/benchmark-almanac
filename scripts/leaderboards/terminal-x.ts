// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// Terminal-X tests coding agents on single-shot work, multi-turn development and repository upgrades.
// The launch article gives each task suite its own percentage and inference protocol.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { tables, text, num } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';

const feed = 'https://unipat.ai/blog/TerminalX';
const parts = { depth: 'DeepTerminalBench: Pass@1', iteration: 'EvoCode-Bench: MT@4', evolution: 'RoadmapBench: Resolved' };
const suites = [
  { key: 'depth', score: 'Pass@1' }, { key: 'iteration', score: 'MT@4' }, { key: 'evolution', score: 'Resolved %' },
];
const board: Leaderboard = {
  benchmark: 'terminal-x', url: feed, feed, parts, terms: 'UniPat AI publishes its results at https://unipat.ai/blog/TerminalX.',
  stats: {
    depthTurns: {name: 'DeepTerminalBench turns', unit: 'count'}, depthOutputTokens: {name: 'DeepTerminalBench output tokens', unit: 'tokens'},
    iterationTurns: {name: 'EvoCode-Bench turns', unit: 'count'}, iterationOutputTokens: {name: 'EvoCode-Bench output tokens', unit: 'tokens'},
    singleRound: {name: 'Single-round completion', unit: '%', better: 'higher'}, multiTurnCompletion: {name: 'Multi-turn completion', unit: '%', better: 'higher'},
    evolutionTurns: {name: 'RoadmapBench turns', unit: 'count'}, evolutionOutputTokens: {name: 'RoadmapBench output tokens', unit: 'tokens'},
    roadmapCompletion: {name: 'Roadmap completion', unit: 'score', better: 'higher', note: 'Completion rate stored from 0 to 1.'},
  },
  headline: 'UniPat reports no overall score, so this is the plain mean of its three suite percentages under their respective evaluation protocols.',
  async fetch() {
    const all = tables(await fetchText(feed));
    const models = new Map<string, LeaderboardRow>();
    for (const { key, score } of suites) {
      const table = all.find(t => t[0]?.some(c => c.text === score) && t[0]?.some(c => c.text === 'Model'));
      if (!table) throw new Error('Missing ' + score + ' table');
      const cols = table[0].map(c => c.text);
      for (const cells of table.slice(1)) {
        const cell = cells[cols.indexOf('Model')];
        const name = text(cell.html.match(/<span class="tb-lb-model(?: [^"]*)?">([^<]+)<\/span>/)?.[1] ?? '').replace(/-high$/i, '');
        if (!name) throw new Error('Missing model');
        const id = name.toLowerCase().replace(/^qwen-/, 'qwen');
        const row = models.get(id) ?? { model: name, score: 0, metrics: {}, harness: 'terminus-2', date: '2026-05-02' };
        const metrics = row.metrics!;
        if (key in metrics) throw new Error('Duplicate model for ' + key);
        const value = (column: string) => {
          const parsed = num(cells[cols.indexOf(column)]?.text);
          if (parsed === undefined) throw new Error('Missing ' + column);
          return parsed;
        };
        metrics[key] = value(score);
        metrics[key + 'Turns'] = value(cols.includes('Avg. Turns') ? 'Avg. Turns' : 'Avg Turns');
        metrics[key + 'OutputTokens'] = 1000 * value('Output Tok. (K)');
        if (key === 'iteration') {
          row.setting = 'EvoCode-Bench: ' + text(cell.html.match(/class="tb-lb-model-setting">([^<]+)/)?.[1] ?? '');
          metrics.singleRound = value('SR');
          metrics.multiTurnCompletion = value('Comp');
        }
        if (key === 'evolution') metrics.roadmapCompletion = value('Completion');
        models.set(id, row);
      }
    }
    const rows = Array.from(models.values()).filter(r => Object.keys(parts).every(k => k in r.metrics!));
    for (const row of rows) row.score = (row.metrics!.depth + row.metrics!.iteration + row.metrics!.evolution) / 3;
    return checked(rows, 6);
  },
};
export default board;
