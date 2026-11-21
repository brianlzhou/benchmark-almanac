// HumanAgencyBench measures six behaviors that support user agency on 3,000 prompts.
// The authors define the overall score as "Overall (mean of 6)" in figures/plot_all_models.py.
// The plot combines the six standard errors in quadrature and divides by six.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText,parseCsv } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed='https://raw.githubusercontent.com/BenSturgeon/HumanAgencyBench/HEAD/figures/results_summary_38_models.csv';
const dims=['ask_clarifying_questions','avoid_value_manipulation','correct_misinformation','defer_important_decisions','encourage_learning','maintain_social_boundaries'];
const board:Leaderboard={
  benchmark:'humanagencybench',url:'https://github.com/BenSturgeon/HumanAgencyBench#results',feed,
  terms:'The authors publish the results with attribution on GitHub. https://github.com/BenSturgeon/HumanAgencyBench#results',
  parts:Object.fromEntries(dims.map(key=>[key,{name:key.replaceAll('_',' '),unit:'%' as const}])),
  aliases:{'claude-3-5-sonnet-20240620':'claude-3-5-sonnet','claude-3-5-sonnet-20241022':'claude-3-5-sonnet-october-2024',
    'gemini-2.5-flash-preview-04-17':'gemini-2-5-flash-apr-2025','gemini-2.5-pro-preview-03-25':'gemini-2-5-pro-mar-2025',
    'llama-4-maverick-instruct':'llama-4-maverick','llama-4-scout-instruct':'llama-4-scout'},
  async fetch(){
    const groups=new Map<string,Record<string,number>>();
    for(const r of parseCsv(await fetchText(feed))){
      if(!r.subject_model || !dims.includes(r.dimension) || !r.mean || !r.se || Number(r.n)!==500) throw new Error('Incomplete HAB record');
      const metrics=groups.get(r.subject_model) ?? {};
      if(r.dimension in metrics) throw new Error('Duplicate dimension for '+r.subject_model);
      metrics[r.dimension]=100*Number(r.mean);
      metrics[r.dimension+'_stderr']=100*Number(r.se);
      groups.set(r.subject_model,metrics);
    }
    const rows:LeaderboardRow[]=[];
    for(const [model,metrics] of groups){
      const score=dims.reduce((sum,k)=>sum+metrics[k],0)/6;
      metrics.stderr=Math.hypot(...dims.map(k=>metrics[k+'_stderr']))/6;
      if(!Number.isFinite(metrics.stderr)) throw new Error('Missing dimension standard error');
      rows.push({model:model==='gpt-5-high'?'gpt-5':model,setting:model==='gpt-5-high'?'High reasoning effort':undefined,score,metrics});
    }
    return checked(rows,38);
  },
};
export default board;
