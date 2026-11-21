// BigFinanceBench scores financial research agents against expert rubrics. Its main comparison ranks models by rubric score and reports answer accuracy and rubric criteria.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

const FEED = 'https://arxiv.org/html/2606.03829';
function number(value: string): number {
  const clean = value?.trim().replace(/%$/, '');
  if (!/^-?\d+(?:\.\d+)?$/.test(clean)) throw new Error(`Invalid paper score: ${value}`);
  return Number(clean);
}

const board: Leaderboard = {
  benchmark: 'bigfinancebench', static: 'paper',
  url: 'https://arxiv.org/abs/2606.03829',
  feed: FEED,
  terms: PAPER_TERMS,
  stats:{answerAccuracy:{name:'Answer accuracy',unit:'%',better:'higher'},rubricCriteria:{name:'Rubric criteria score',unit:'%',better:'higher'}},
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(FEED));
    const table = tables.find(t => t[0]?.[0] === "Model" && t[0]?.[1] === "Rubric score" && t[0]?.[2] === "Answer acc." && t[0]?.[3] === "Rubric criteria");
    if (!table) throw new Error("Missing bigfinancebench results table");
    const rows: LeaderboardRow[] = [];
    for (const cells of table.slice(1)) {
      const model = cells[0];
      const score = number(cells[1].replace('\\%', '%'));
      rows.push({ model, score, metrics: { answerAccuracy: number(cells[2].replace('\\%', '%')), rubricCriteria: number(cells[3].replace('\\%', '%')) } });
    }
    if (rows.length < 10) throw new Error("Incomplete bigfinancebench comparison");
    return rows;
  },
};
export default board;
