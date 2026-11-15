// Whole domain score. Each domain has its own benchmark record.
import type {Leaderboard} from './types.ts';
import {fetchText} from '../lib/util.ts';
import {tables} from '../lib/html.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const URL='https://www.interactivebench.org/leaderboard.html';
const board:Leaderboard={benchmark:'interactive-benchmarks-math',url:URL,feed:URL,
 terms:'Public maker results. robots.txt contains content signals but no disallow rule for this path or AI input restriction.',
 async fetch(){const t=tables(await fetchText(URL)).map(t=>t.map(r=>r.map(c=>c.text))).find(t=>t[0]?.some(c=>c.includes('Logic Acc.')));if(!t)throw new Error('Results missing');
 return checked(t.slice(1).map(c=>({model:c[1].split(' ')[0],score:Number(c[5].replace('−','-').match(/^[+-]?[\d.]+/)?.[0])})),6);
 }};export default board;
