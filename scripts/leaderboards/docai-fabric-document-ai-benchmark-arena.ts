// DocAI Fabric ranks document parsers on field extraction accuracy. The All Documents table covers 500 documents
// and reports classification accuracy, hallucination rate, average latency and cost per document.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const feed = "https://docaifabric.com/benchmarks/";

const board: Leaderboard = {
  stats: { rank: { name: 'Rank', unit: 'count', better: 'lower' }, classification: { name: 'Classification accuracy', unit: '%', better: 'higher' }, hallucinationRate: { name: 'Hallucination rate', unit: '%', better: 'lower' }, latency: { name: 'Latency', unit: 'seconds', better: 'lower' } },
  benchmark: "docai-fabric-document-ai-benchmark-arena",
  url: "https://docaifabric.com/benchmarks/",
  feed,
  terms: "DocAI Fabric reserves all rights. robots.txt allows the feed path.",
  async fetch() {
    const header = ["#", "Model", "Type", "Extraction Accuracy", "Classification", "Hallucination Rate", "Avg Latency", "Cost/Doc"];
    const table = tables(await fetchText(feed)).map(table => table.map(row => row.map(cell => cell.text))).find(t => header.every((label, i) => t[0]?.[i] === label));
    if (!table || table.length <= 7) throw new Error('Missing leaderboard columns or rows');
    return table.slice(1).map(cells => {
      const [rank, model, type, ...rest] = cells;
      const values = rest.map(v => Number(v.replace(/[%$s]/g, '')));
      if (!model || values.length !== 5 || !values.every(Number.isFinite)) throw new Error('Incomplete document extraction row');
      const [score, classification, hallucinationRate, latency, cost] = values;
      return { model, score, cost, open: type.startsWith('Open-Source') || undefined,
        metrics: { rank: Number(rank), classification, hallucinationRate, latency } };
    });
  },
};
export default board;
