// Published full-test aggregate. Preserve author units and configurations.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL="https://arxiv.org/html/2010.05444";
const board:Leaderboard={benchmark:'ocnli',url:URL,feed:URL,terms:PAPER_TERMS,
 async fetch(){const t=paperTables(await paperHtml(URL)).map(grid).find(t=>JSON.stringify(t[0])==="[\"Maj.\",\"CBOW\",\"biLSTM\",\"ESIM\",\"BERT\",\"RoBERTa\"]");if(!t)throw new Error('Reviewed table missing');const out:LeaderboardRow[]=[];
 for(let i=1;i<t[0].length;i++)out.push({model:t[0][i]+' (OCNLI trained)',score:parseFloat(t[1][i]),metrics:{std:Number(t[1][i].match(/\(([\d.]+)\)/)?.[1])}});return checked(out,3);
 }};export default board;
