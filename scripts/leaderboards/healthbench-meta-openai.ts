// HealthBench Meta evaluates graders against physician judgments of rubric criteria.
// Table 6 reports the mean of positive and negative class F1. Table 5 breaks down
// the GPT-4.1 grader's scores by theme.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
const feed='https://arxiv.org/html/2505.08775';
export default {
  benchmark:'healthbench-meta-openai',url:feed,feed,static:'paper',
  terms:'Paper and license at https://arxiv.org/abs/2505.08775',
  parts: {
    emergencyreferrals: 'Emergency referrals',
    expertisetailoredcommunication: 'Expertise-tailored communication',
    respondingunderuncertainty: 'Responding under uncertainty',
    responsedepth: 'Response depth',
    healthdatatasks: 'Health data tasks',
    globalhealth: 'Global health',
    contextseeking: 'Context seeking',
  },
  async fetch(){
    const tables=paperTables(await paperHtml(feed)).map(grid);
    const main=tables.find(t=>t[0].join('|')==='Model|MF1');
    const themes=tables.find(t=>t[2]?.[0]==='Cluster theme' && t[0][3]==='Model' && t[1][3]==='MF1');
    if(!main || !themes || themes.length!==10) throw new Error('Missing meta-evaluation scores');
    const breakdown:Record<string,number>={};
    for(const [name,,,value] of themes.slice(3)){
      const key=name.toLowerCase().replace(/[^a-z]/g,'');
      breakdown[key]=numberCell(value);
    }
    return checked(main.slice(1).map(([model,value])=>({
      model,score:numberCell(value),metrics:model==='GPT-4.1'?breakdown:undefined,
    })),5);
  },
} satisfies Leaderboard;
