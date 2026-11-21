// LocalSearchBench checks answers to questions about local merchants. The project page lists correctness
// for each model and thinking setting, alongside answer quality and search-process metrics.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const feed = "https://localsearchbench.github.io/#leaderboard";

const board: Leaderboard = {
  benchmark: "local-search-bench-meituan",
  stats: {
    'Avg. tool calls': { name: 'Average tool calls', unit: 'count', better: 'lower' },
    'Avg. rounds': { name: 'Average rounds', unit: 'count', better: 'lower' },
    Completeness: { name: 'Completeness score', unit: '%', better: 'higher' }, Fluency: { name: 'Fluency score', unit: '%', better: 'higher' }, Faithfulness: { name: 'Faithfulness score', unit: '%', better: 'higher' }, Safety: { name: 'Safety score', unit: '%', better: 'higher' }, 'Action Relevance': { name: 'Action relevance', unit: '%', better: 'higher' }, 'Evidence Sufficiency': { name: 'Evidence sufficiency', unit: '%', better: 'higher' }, 'Causal Coherence': { name: 'Causal coherence', unit: '%', better: 'higher' }, 'Search Efficiency': { name: 'Search efficiency', unit: '%', better: 'higher' },
  },
  url: "https://localsearchbench.github.io/#leaderboard",
  feed,
  terms: "The repository publishes the same standings under the MIT license and requests attribution to LocalSearchBench. The host has no robots.txt.",
  async fetch() {
    const all = tables(await fetchText(feed)).map(t => t.map(r => r.map(c => c.text)));
    const answers = all.find(t => t[0]?.[3] === 'Correctness (%)');
    const process = all.find(t => t[0]?.[1] === 'Action Relevance (%)');
    if (!answers || !process || answers.length < 17 || process.length !== answers.length) throw new Error('Missing LocalSearchBench results');
    return answers.slice(1).map(row => {
      const other = process.find(r => r[0] === row[0]);
      if (!other || row.length !== 8 || other.length !== 5) throw new Error('Incomplete search metrics');
      const label = row[0].match(/^(.+?) \((.+)\)$/);
      const metrics: Record<string, number> = {};
      for (const [header, cells] of [[answers[0], row], [process[0], other]]) {
        for (let i = 1; i < cells.length; i++) {
          const value = Number(cells[i]);
          if (!cells[i].trim() || !Number.isFinite(value)) throw new Error('Invalid search result');
          if (header[i] !== 'Correctness (%)') metrics[header[i].replace(' (%)', '')] = value;
        }
      }
      return { model: label?.[1] ?? row[0], setting: label?.[2], score: Number(row[3]), metrics };
    });
  },
};
export default board;
