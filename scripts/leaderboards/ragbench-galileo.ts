// The source reports no overall score. The headline is the plain mean of the 12 parts, computed by this importer.
// RAGBench evaluates judges of retrieval-augmented answers. Table 3 reports hallucination AUROC and errors for relevance and utilization.
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import type { BoardPart, Leaderboard } from './types.ts';
const feed = 'https://arxiv.org/html/2407.11005';
const judges = ['GPT-3.5', 'RAGAS', 'TruLens', 'DeBERTA'];
const datasets = ['PubMedQA', 'CovidQA-RAG', 'HotpotQA', 'MS Marco', 'HAGRID', 'ExpertQA', 'DelucionQA', 'EManual', 'TechQA', 'FinQA', 'TAT-QA', 'CUAD'];
const staticParts: Record<string, BoardPart> = Object.fromEntries(datasets.flatMap(dataset => [
  [dataset + ' Hal', {name: dataset + ' hallucination AUROC', group: 'Hallucination AUROC', better: 'higher'}],
  [dataset + ' Rel', {name: dataset + ' context relevance RMSE', group: 'Relevance RMSE', better: 'lower'}],
])) as Record<string, BoardPart>;
const board: Leaderboard = {
  benchmark: 'ragbench-galileo', url: feed, feed, static: 'paper', parts: staticParts,
  terms: 'The authors license the paper under CC BY 4.0. https://arxiv.org/abs/2407.11005',
  headline: 'The paper reports separate metrics, so the headline is the plain mean of hallucination AUROC across its 12 datasets.',
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t =>
      judges.every((name, i) => t[0][3 * i + 1] === name) && t[1]?.[0] === 'Dataset');
    if (!table || table.length !== 14) throw new Error('Missing Table 3 test splits');
    return checked(judges.map((judge, j) => {
      const metrics: Record<string, number> = {};
      let total = 0;
      for (const row of table.slice(2)) {
        const dataset = row[0];
        for (const [offset, prefix] of ['Hal', 'Rel', 'Util'].entries()) {
          const index = 3 * j + offset + 1;
          if (!table[1][index].startsWith(prefix)) throw new Error('Changed metric columns for ' + judge);
          const cell = row[index].replace(/\s*∗$/, '');
          if (cell === '-' && offset === 2) continue;
          const value = numberCell(cell);
          const key = dataset + ' ' + prefix;
          metrics[key] = value;
          board.parts![key] = {name: dataset, group: ['Hallucination AUROC', 'Relevance RMSE', 'Utilization RMSE'][offset], better: offset ? 'lower' : 'higher'};
          if (offset === 0) total += value;
        }
      }
      return {model: judge === 'RAGAS' ? 'GPT-3.5' : judge, harness: judge === 'RAGAS' ? judge : undefined,
        setting: judge === 'GPT-3.5' ? 'Zero-shot' : judge === 'RAGAS' ? 'Few-shot' : undefined, score: total / 12, metrics};
    }), 4);
  },
};
export default board;
