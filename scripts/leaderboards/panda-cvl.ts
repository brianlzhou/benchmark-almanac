// F1 combines accuracy on good examples with correction on no-good examples.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
import {paperTables,grid} from '../lib/boards/arxiv-span-tables.ts';
const URL="https://arxiv.org/html/2609.24983";
const board:Leaderboard={benchmark:'panda-cvl', static: 'paper',parts:{goodAccuracy:{name:'GoodAcc',group:'Dimension'},correction:{name:'Corr.-NG',group:'Dimension'}}, url:URL,feed:URL,terms:PAPER_TERMS,
 async fetch(){const t=paperTables(await paperHtml(URL)).map(grid).find(t=>t[0]?.[2]==='GoodAcc');if(!t)throw new Error('Reviewed overall table missing');const out:LeaderboardRow[]=[];
 let mode='';for(const c of t.slice(1)){if(!/^[\d.]+$/.test(c[5])){mode=c[0];continue;}let model=c[0].replace(/ (?:ByteDance|OpenAI|Moonshot AI|StepFun|Qwen Team).*$/,'');const effort=model.includes('(xhigh)')?'; effort xhigh':'';model=model.replace(' (xhigh)','');if(model==='GPT-6')model+=' (variant unspecified)';const size=model.match(/-(\d+)B-A(\d+)B/i);out.push({model,params:size ? Number(size[1]) : undefined,setting:mode+effort,score:Number(c[5]),metrics:{...(size ? {activeParams:Number(size[2])} : {}),format:Number(c[1]),goodAccuracy:Number(c[2]),localization:Number(c[3]),correction:Number(c[4])}});}return checked(out,3);
 }};export default board;
