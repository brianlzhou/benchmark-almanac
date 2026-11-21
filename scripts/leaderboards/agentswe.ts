// AgentSWE tests coding agents that create, edit or optimize other agents. The project page reproduces Table 1.
// Creation and Editing use rubric scores out of 100. Optimization measures the percentage of the remaining gap closed.
import type { Leaderboard, BoardPart } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { fetchText } from '../lib/util.ts';

const feed = 'https://vectorspacelab.github.io/AgentSWE/';
const board: Leaderboard = {
  benchmark: 'agentswe', url: feed, feed, terms: 'The project uses Apache 2.0, https://github.com/VectorSpaceLab/AgentSWE/blob/main/LICENSE.',
  headline: 'The authors report no overall score, so the headline is Creation, the first stage in their results table.',
  async fetch() {
    const html = await fetchText(feed);
    const names = /const BUILDERS = (\[[^\n]+\]);/.exec(html);
    const data = /const DATA = (\{[\s\S]+?\n  \});/.exec(html);
    if (!names || !data) throw new Error('Missing builder table');
    const models: string[] = JSON.parse(names[1]);
    const groups: Record<string, [string, ...number[]][]> = JSON.parse(data[1]
      .replace(/\b(creation|editing|optimization):/g, '"$1":').replace(/,\s*([\]}])/g, '$1'));
    const metrics = models.map(() => ({} as Record<string, number>));
    const parts: Record<string, BoardPart> = {};
    for (const [stage, count] of Object.entries({ creation: 10, editing: 10, optimization: 5 })) {
      const label = stage[0].toUpperCase() + stage.slice(1);
      const table = groups[stage];
      if (table.length !== count + 1 || table.at(-1)?.[0] !== 'Mean') throw new Error('Incomplete ' + stage);
      for (const [task, ...values] of table) {
        if (values.length !== models.length || !values.every(Number.isFinite)) throw new Error('Missing builder score');
        const key = task === 'Mean' ? stage : stage + '_' + task.replace(/[^\p{L}\p{N}]+/gu, '_');
        parts[key] = { name: task === 'Mean' ? label : task, group: label, unit: stage === 'optimization' ? '%' : 'score' };
        values.forEach((v, i) => { metrics[i][key] = v; });
      }
    }
    board.parts = parts;
    return checked(models.map((model, i) => ({ model, score: metrics[i].creation, metrics: metrics[i], harness: 'Codex' })), 5);
  },
};
export default board;
