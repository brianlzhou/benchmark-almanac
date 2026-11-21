// HaluBench tests whether a model detects answers unsupported by the supplied passage.
// Table 3 gives accuracy on the full benchmark and each of its six source datasets.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2407.08488';
const parts = ['HaluEval','RAGTruth','FinanceBench','DROP','CovidQA','PubMedQA'];
const board: Leaderboard = {
  benchmark: 'halubench', url: feed, feed, static: 'paper',
  terms: "The authors publish the results under the terms on the paper record. https://arxiv.org/abs/2407.08488",
  parts:Object.fromEntries(parts.map(name => [name,{name,unit:'%' as const}])),
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(t => t[0].join('|') === ['Model',...parts,'Overall'].join('|'));
    if (!table) throw new Error('Missing HaluBench accuracy columns');
    const pct = (s:string) => {
      if (!s.endsWith('%')) throw new Error('Invalid accuracy: '+s);
      return numberCell(s.slice(0,-1));
    };
    const rows:LeaderboardRow[] = table.slice(1).filter(r => r[0] !== 'RAGAS Faithfulness').map(([model,...values]) => {
      if (values.length !== 7) throw new Error('Missing HaluBench accuracy');
      return {model,score:pct(values[6]),metrics:Object.fromEntries(parts.map((k,i) => [k,pct(values[i])]))};
    });
    return checked(rows,10);
  },
};
export default board;
