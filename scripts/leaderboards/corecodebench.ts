// CoreCodeBench evaluates code generation on atomic and composite repository tasks.
// The paper reports six accuracy-rate parts for each task type and no overall column.
// This importer stores the plain mean of the six published rates.
import type { BoardPart, Leaderboard, LeaderboardRow} from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const FEED = 'https://arxiv.org/html/2507.05281';
const parts: Record<string, BoardPart> = Object.fromEntries([
  ['AtomicOverallAC', 'Atomic overall accuracy'], ['AtomicOverallRate', 'Atomic overall pass rate'], ['AtomicDevelopmentAC', 'Atomic development accuracy'], ['AtomicDevelopmentRate', 'Atomic development pass rate'], ['AtomicBugFixAC', 'Atomic bug-fix accuracy'], ['AtomicBugFixRate', 'Atomic bug-fix pass rate'], ['AtomicTDDAC', 'Atomic test-driven development accuracy'], ['AtomicTDDRate', 'Atomic test-driven development pass rate'],
  ['CompositeOverallAC', 'Composite overall accuracy'], ['CompositeOverallRate', 'Composite overall pass rate'], ['CompositeDevelopmentAC', 'Composite development accuracy'], ['CompositeDevelopmentRate', 'Composite development pass rate'], ['CompositeBugFixRate', 'Composite bug-fix pass rate'], ['CompositeTDDAC', 'Composite test-driven development accuracy'], ['CompositeTDDRate', 'Composite test-driven development pass rate'],
].map(([key, name]) => [key, { name, unit: '%', better: 'higher' as const }]));
const board: Leaderboard = { benchmark: 'corecodebench', static: 'paper', url: FEED, feed: FEED, terms: PAPER_TERMS,
 parts,
 headline: 'The paper reports no overall score, so this is the plain mean of its six atomic and composite task rates.',
 async fetch(): Promise<LeaderboardRow[]> {
  const tables = paperTables(await paperHtml(FEED)).map(grid).filter(t => t[0]?.[1] === 'Model');
  const byModel = new Map<string, number[]>();
  for (const table of tables.slice(0, 2)) for (const row of table.slice(2)) {
   const model = row[1]; if (!model || model === 'Model') continue;
   const values = [row[3], row[5], row[7]].map(Number); if (values.some(v => !Number.isFinite(v))) throw new Error(`Invalid CoreCodeBench row: ${row.join('|')}`);
   byModel.set(model, [...(byModel.get(model) ?? []), ...values]);
  }
  return checked([...byModel].map(([model, values]) => ({ model, score: values.reduce((a, b) => a + b, 0) / values.length, setting: 'atomic and composite tasks', metrics: { atomicDevRate: values[0], atomicBugFixRate: values[1], atomicTddRate: values[2], compositeDevRate: values[3], compositeBugFixRate: values[4], compositeTddRate: values[5] } })), 9);
 },
};
export default board;
