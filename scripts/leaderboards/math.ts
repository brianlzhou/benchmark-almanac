// Read overall test accuracy and the seven subject accuracies in the MATH paper.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, uncertain, checked } from '../lib/boards/arxiv-span-tables.ts';
import { num } from '../lib/html.ts';
const feed='https://arxiv.org/html/2103.03874';
export default {
  benchmark:'math', parts: {
  Prealgebra: { name: 'Prealgebra', group: 'Domain' },
  Algebra: { name: 'Algebra', group: 'Domain' },
  'Number Theory': { name: 'Number theory', group: 'Domain' },
  'Counting & Probability': { name: 'Counting & Probability', group: 'Domain' },
  Geometry: { name: 'Geometry', group: 'Domain' },
  'Intermediate Algebra': { name: 'Intermediate algebra', group: 'Domain' },
  Precalculus: { name: 'Precalculus', group: 'Domain' },
},url:'https://arxiv.org/abs/2103.03874',feed,terms:PAPER_TERMS,
  async fetch():Promise<LeaderboardRow[]> {
    const ts=flatPaperTables(await paperHtml(feed)).map(grid);
    const t=ts.find(t=>t[0]?.[1]==='Prealgebra' && t[0].at(-1)==='Average');
    if(!t)throw new Error('MATH overall table missing');
    const rows=t.slice(1).map(r=>({model:r[0].replace(/\*$/,''),setting:r[0].endsWith('*')?'few-shot':'fine-tuned',score:num(r.at(-1))!,params:num(r[0].match(/([\d.]+)B/)?.[1]),metrics:Object.fromEntries(t[0].slice(1,-1).map((k,i)=>[k,num(r[i+1])!]))}));
    return checked(rows,3);
  },
} satisfies Leaderboard;
