// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// CRAG-MM tests factual answers about images in single-turn and multi-turn conversations.
// Tables 4 and 5 report truthfulness, accuracy, missing answers and hallucinations for both parts.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2510.26160';
const parts = ['Single-turn', 'Multi-turn'];
const measures = ['Accuracy', 'Missing', 'Hallucination'];
const board: Leaderboard = {
  benchmark: 'crag-mm', static: 'paper', url: feed, feed,
  terms: 'The authors publish these results under the arXiv nonexclusive license. https://arxiv.org/abs/2510.26160',
  headline: 'The paper reports no overall score, so this is the plain mean of single-turn and multi-turn truthfulness.',
  parts: Object.fromEntries(parts.map(name => [name, name])),
  stats: { ...Object.fromEntries(parts.flatMap(part => measures.map((m, i) => [part + ': ' + m,
    { name: part + ': ' + m, unit: '%', better: i === 0 ? 'higher' : 'lower' }]))),
    earlyStop: { name: 'Multi-turn early stopping', unit: '%', better: 'lower' } },
  aliases: { 'Llama 3.2 90B': 'llama-3-2-90b', 'Llama 3.2 11B': 'llama-3-2-11b', 'Claude Sonnet': 'claude-sonnet-4',
    'Gemini': 'gemini-2-5-pro-jun-2025' },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const groups = new Map<string, LeaderboardRow>();
    for (const column of ['Model', 'System']) {
      const t = tables.find(t => t[0].includes(column) && t[0].includes('Truth.') && t[0].includes('Early Stop.'));
      if (!t || t[0].slice(-5).join('|') !== 'Acc.|Miss.|Hallu.|Truth.|Early Stop.') throw new Error('CRAG-MM columns changed');
      let part = '', task = '';
      for (const cells of t.slice(1)) {
        part = cells[0] || part;
        if (!parts.includes(part)) throw new Error('Unknown QA split');
        let model = cells.at(-6)!;
        let setting = 'Embedded search';
        if (column === 'Model') {
          task = cells[1] || task;
          if (task === 'Task 1') continue; // Single-source retrieval has no multi-turn run.
          setting = task === 'MM-LLM' ? 'No retrieval' : 'Multi-source retrieval';
        } else if (model === 'Winning team') continue;
        else if (model === 'Llama 3.2 11B RAG') { model = 'Llama 3.2 11B'; setting = 'Multi-source retrieval'; }
        const key = JSON.stringify([model, setting]);
        const row = groups.get(key) ?? { model, setting, score: 0, metrics: {} };
        if (part in row.metrics!) throw new Error('Duplicate result for ' + key);
        row.metrics![part] = numberCell(cells.at(-2)!);
        measures.forEach((name, i) => { row.metrics![part + ': ' + name] = numberCell(cells[cells.length - 5 + i]); });
        if (part === 'Multi-turn') row.metrics!.earlyStop = numberCell(cells.at(-1)!);
        groups.set(key, row);
      }
    }
    for (const row of groups.values()) row.score = Number(((row.metrics![parts[0]] + row.metrics![parts[1]]) / 2).toFixed(3));
    return checked([...groups.values()], 10);
  },
};
export default board;
