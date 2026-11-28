// EmbodiedCLBench tests transfer from basic tasks to advanced simulated tasks.
// The project site's main results report advanced task success for each learning setting
// and basic task success before learning for each agent and model.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const url='https://pku-value-lab.github.io/EmbodiedCLBench-homepage/';
const board:Leaderboard={
  benchmark:'embodiedclbench',harnesses:'system',url,feed:url,terms:'The authors publish the comparison at https://pku-value-lab.github.io/EmbodiedCLBench-homepage/.',
  parts:{basic:'Basic task success (zero-shot)'},
  headline:'The headline measures success on advanced tasks, where the authors test transfer from basic tasks.',
  async fetch(){
    const t=tables(await fetchText(url)).map(t=>t.map(r=>r.map(c=>c.text))).find(t=>
      t[0]?.join('|')==='Success Rate (%)|Basic Task|Advanced Task' &&
      t[1]?.join('|')==='Harness|Model|Zero-shot|Zero-shot|In-Context Learning|Skill Learning');
    if(!t) throw new Error('Missing advanced task success rates');
    let harness='';
    const rows:LeaderboardRow[]=[];
    for(const cells of t.slice(2)){
      if(cells.length===6) harness=cells[0];
      const [model,basic,...rates]=cells.slice(-5);
      if(!harness || rates.length!==3 || ![basic,...rates].every(v=>/^\d+(?:\.\d+)?$/.test(v))) throw new Error('Invalid agent result');
      rates.forEach((v,i)=>rows.push({model,harness,setting:t[1][3+i],score:Number(v),metrics:{basic:Number(basic)}}));
    }
    return checked(rows,24);
  },
};
export default board;
