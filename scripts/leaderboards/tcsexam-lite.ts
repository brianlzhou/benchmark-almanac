// TCSExam-Lite evaluates theorem proving, solver engineering, constructions and open-conjecture work. This importer reads Table 3.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {flatPaperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL='https://arxiv.org/html/2611.07962';
const board:Leaderboard={benchmark:'tcsexam-lite',static:'paper',harnesses:'system',url:URL,feed:URL,terms:PAPER_TERMS,parts:{theorem:{name:'Theorem proving'},solver:{name:'Solver engineering'},constructions:{name:'Constructions'}},async fetch(){const h=await paperHtml(URL),a=h.indexOf('<figure id="S5.T3"'),b=h.indexOf('</figure>',a);if(a<0||b<0)throw new Error('TCSExam Lite table missing');const t=grid(flatPaperTables(h.slice(a,b+9))[0]);const configs = flatPaperTables(h).map(grid).find(rows => rows[0]?.join('|') === 'Model|Harness|Effort|Full|Lite');
if (!configs) throw new Error('TCSExam harness table missing');
// the table gives each agent's version ("Claude Code 2.1.283"), and the site knows agents by name, so the version goes
const harnessByModel = new Map(configs.slice(1).map(row => [row[0], row[1].trim().replace(/\s+v?\d+(?:\.\d+)+$/, '')]));
return checked(t.slice(1).map(r=>({model:r[0],harness:harnessByModel.get(r[0]),score:Number(r[5]),metrics:{theorem:Number(r[1]),solver:Number(r[2]),constructions:Number(r[3]),conjectures:Number(r[4])}})),9);}};export default board;
