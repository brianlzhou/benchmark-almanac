// The source reports no overall score. The headline is the plain mean of the 6 parts, computed by this importer.
// RSIBench-Data evaluates researcher agents that generate training data for a fixed target model.
// The official site lists each selected checkpoint's score, wall time and Tinker cost for each benchmark.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';

const feed = 'https://rsibench.co/data/';
const parts = ['SWE-bench Verified', 'SWE-bench Multilingual', 'SWE-bench Pro', 'GPQA Diamond', 'AIME 2026', 'Terminal-Bench 2.0'];
const board: Leaderboard = {
  benchmark: 'rsibench-data', url: feed + '#official-results', feed,
  terms: 'The project repository links CC BY-NC 4.0. https://creativecommons.org/licenses/by-nc/4.0/',
  headline: 'The official table reports no combined score, so this is the plain mean of six benchmark scores.',
  parts: Object.fromEntries(parts.map(p => [p, p])),
  aliases: { 'Opus-4.8': 'claude-opus-4-8', 'Sonnet-5': 'claude-sonnet-5' },
  costPer: 'run',
  async fetch() {
    const table = tables(await fetchText(feed)).find(t =>
      t[0]?.map(c => c.text).join('|') === 'Benchmark|Agent|Official|Time (h)|Tinker cost ($)');
    if (!table) throw Error('Missing official researcher results');
    const rows = new Map<string, LeaderboardRow & { metrics: Record<string, number>, cost: number }>();
    let part = '';
    for (const cells of table.slice(1)) {
      if (cells.length === 5 && cells[1].text === 'Base model') { part = cells[0].text; continue; }
      const [agent, percent, hours, cost] = cells.map(c => c.text);
      const [harness, model] = agent.split(' · ');
      if (!model || !parts.includes(part) || !/^\d+\.\d+%$/.test(percent)
        || ![hours, cost].every(n => /^\d+\.\d+$/.test(n))) throw Error('Invalid official evaluation row');
      const row = rows.get(agent) ?? { model, harness, score: 0, cost: 0, metrics: {} as Record<string, number> };
      if (part in row.metrics) throw Error('Duplicate result: ' + part);
      row.metrics[part] = parseFloat(percent);
      row.metrics[part + ' time (h)'] = Number(hours);
      row.metrics[part + ' Tinker cost ($)'] = Number(cost);
      row.cost += Number(cost);
      rows.set(agent, row);
    }
    for (const row of rows.values()) {
      if (!parts.every(p => p in row.metrics)) throw Error('Incomplete official researcher matrix');
      row.score = parts.reduce((total, p) => total + row.metrics[p], 0) / parts.length;
    }
    return checked([...rows.values()], 4);
  },
};
export default board;
