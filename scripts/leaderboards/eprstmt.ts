// EPRSTMT test accuracy from FewCLUE. Backbones are identified in section 5.2.
import type {Leaderboard} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL='https://arxiv.org/html/2107.07498';
const board:Leaderboard={benchmark:'eprstmt',url:URL,feed:URL,terms:PAPER_TERMS,
 async fetch(){const t=paperTables(await paperHtml(URL)).map(grid).find(t=>t[1]?.[2]==='EPRSTMT');if(!t)throw new Error('FewCLUE table missing');
 return checked(t.slice(2).filter(c=>!['Majority','Human'].includes(c[0])).map(c=>({model:c[0].includes('ernie1.0')?'ERNIE1.0':c[0]==='Zero-shotG'?'NEZHA-Gen':'RoBERTa-wwm-ext',setting:c[0].replace(' ernie1.0','').replace(/([a-z])R$/,'$1').replace('Zero-shotG','Zero-shot'),score:parseFloat(c[2]),...(c[2].includes('(')?{metrics:{std:Number(c[2].match(/\(([\d.]+)\)/)?.[1])}}:{})})),3);
 }};export default board;
