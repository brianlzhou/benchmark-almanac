// Gecko evaluates text-to-image generations for word-level, Likert and DSG(H) alignment.
// The paper reports no overall score, so the headline is the first score column, Gecko(R) word-level accuracy.
// Per Table 3 ("mean and std. deviation for the annotated judgements of all templates after mapping the ratings
// to the [0, 1] interval"), keep the headline standard deviation in metrics.std (scaled to 0 to 100).
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL='https://arxiv.org/html/2404.16820';
const mean=(cell:string)=>Number(cell.split('\\pm')[0])*100;
const spread=(cell:string)=>Number(cell.split('\\pm')[1])*100;
const board:Leaderboard={
  benchmark:'gecko',static:'paper',url:URL,feed:URL,terms:PAPER_TERMS,
  headline:'The paper reports no overall score, so this is the Gecko(R) word-level score, the first score column.',
  stats:{
    geckoRLikert:{name:'Gecko(R) Likert',unit:'%',better:'higher'},
    geckoRDSGH:{name:'Gecko(R) DSG(H)',unit:'%',better:'higher'},
    geckoSWL:{name:'Gecko(S) word-level',unit:'%',better:'higher'},
    geckoSLikert:{name:'Gecko(S) Likert',unit:'%',better:'higher'},
    geckoSDSGH:{name:'Gecko(S) DSG(H)',unit:'%',better:'higher'},
  },
  async fetch(){
    const ts=paperTables(await paperHtml(URL)).map(grid);
    const t=ts.find(x=>x[0]?.[0]==='Gen. model'&&x[2]?.[1]==='WL');
    if(!t)throw new Error('Gecko score table missing');
    const rows:LeaderboardRow[]=t.slice(3).map(r=>{
      const std=spread(r[7]);
      return {
        model:r[0],score:mean(r[7]),
        metrics:{
          ...(Number.isFinite(std)?{std}:{}),
          geckoRLikert:mean(r[8]),geckoRDSGH:mean(r[9]),
          geckoSWL:mean(r[10]),geckoSLikert:mean(r[11]),geckoSDSGH:mean(r[12]),
        },
      };
    }).filter(r=>Number.isFinite(r.score));
    return checked(rows,4);
  },
};
export default board;
