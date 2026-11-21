// GTA-2 tests tool agents on long workflows with deliverables. Table 6 reports success on the final deliverable.
// Root SR is the percentage of workflows with a successful final output.
import type { Leaderboard } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2604.15715';
const columns = ['Tool SR','P-SR','O-SR','L-SR','C-SR','Root Score','Leaf SR','Root SR'];
const board: Leaderboard = {
  benchmark: 'gta-2', static: 'paper', feed, url: feed, terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  parts: { 'P-SR':'Perception', 'O-SR':'Operation', 'L-SR':'Logic', 'C-SR':'Creativity',
    'Leaf SR':'Leaf success rate', 'Tool SR':'Tool success rate', 'Root Score':{ name:'Root Score',unit:'score'}, 'Root SR':{name:'Root success rate',unit:'%'} },
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[0]?.[1]?.includes('Deliverable-Centric') &&
      JSON.stringify(t[1]?.slice(1)) === JSON.stringify(columns));
    if (!table) throw Error('Missing GTA-Workflow results');
    const rows = table.slice(2).filter(r => !['Closed-source','Open-source'].includes(r[0])).map(r => {
      const metrics = Object.fromEntries(columns.map((key,i) => [key, r[i+1]?.trim() ? Number(r[i+1]) : NaN]));
      if (!Object.values(metrics).every(Number.isFinite)) throw Error('Invalid measures for ' + r[0]);
      return {model:r[0], score:metrics['Root SR'], metrics};
    });
    return checked(rows,13);
  },
};
export default board;
