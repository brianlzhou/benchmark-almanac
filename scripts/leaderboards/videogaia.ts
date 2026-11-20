// Whole-suite answer accuracy, using the maker's agent loop.
import type {Leaderboard} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL='https://arxiv.org/html/2608.14718';
const board:Leaderboard={benchmark:'videogaia', parts: {
  culture: { name: 'Culture', group: 'Domain' },
  geography: { name: 'Geography', group: 'Domain' },
  dailyLife: { name: 'Daily life', group: 'Domain' },
  history: { name: 'History', group: 'Domain' },
  technology: { name: 'Technology', group: 'Domain' },
  economics: { name: 'Economics', group: 'Domain' },
},url:URL,feed:URL,terms:PAPER_TERMS,
 async fetch(){const t=paperTables(await paperHtml(URL)).map(grid).find(t=>t[0]?.[7]==='Overall'&&t[0]?.[1]==='Culture');if(!t)throw new Error('Overall result table missing');
 return checked(t.slice(1).filter(c=>/^\d/.test(c[7])).map(c=>({model:c[0].split(' ')[0],harness:'VideoGAIA agent loop',score:Number(c[7]),metrics:{culture:Number(c[1]),geography:Number(c[2]),dailyLife:Number(c[3]),history:Number(c[4]),technology:Number(c[5]),economics:Number(c[6])}})),3);
 }};export default board;
