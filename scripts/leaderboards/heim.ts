// The source reports no overall score. The headline is the plain mean of the 18 parts, computed by this importer.
// HEIM evaluates text-to-image generation. Each scored table expresses performance as a higher-is-better mean win rate.
// The General information table contains run metadata and has no win rate.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { fetchJson } from '../lib/util.ts';

const feed='https://storage.googleapis.com/crfm-helm-public/heim/benchmark_output/runs/v1.1.0/groups/core_scenarios.json';
interface Cell {value?:number|string;lower_is_better?:boolean}
interface Table {title:string;header:Cell[];rows:Cell[][]}
const board:Leaderboard={
  benchmark:'heim',url:'https://crfm.stanford.edu/helm/heim/latest/',feed,
  terms:'Stanford CRFM publishes HEIM in its public HELM bucket. The code uses Apache 2.0, https://github.com/stanford-crfm/helm/blob/main/LICENSE.',
  async fetch(){
    const source=await fetchJson<Table[]>(feed);
    const ranked=source.filter(t=>t.title!=='General information');
    if(ranked.length!==18)throw new Error('Scored HEIM tables changed');
    const parts:Record<string,string>={};
    const metricsByModel=new Map<string,Record<string,number>>();
    for(const table of ranked){
      if(table.header[0]?.value!=='Model/adapter'||table.header[1]?.value!=='Mean win rate'||table.header[1].lower_is_better!==false)throw new Error('Invalid win-rate header');
      const key=table.title.replace(/[^A-Za-z0-9]+/g,'_').replace(/_$/,'');
      parts[key]=table.title.replace(' - ',': ');
      for(const row of table.rows){
        const model=row[0].value, value=row[1].value;
        if(typeof model!=='string')throw new Error('Missing model name');
        if(value===undefined)continue;
        if(typeof value!=='number'||value<0||value>1)throw new Error('Invalid win rate');
        const metrics=metricsByModel.get(model)??{};
        if(key in metrics)throw new Error('Duplicate model in '+table.title);
        metrics[key]=value;metricsByModel.set(model,metrics);
      }
    }
    const rows:LeaderboardRow[]=[];
    for(const [label,metrics] of metricsByModel){
      if(Object.keys(metrics).length!==ranked.length)continue;
      const split=label.match(/^(.+) \(([\d.]+)B\)$/);
      rows.push({model:split?.[1]??label,params:split?Number(split[2]):undefined,metrics,score:Object.values(metrics).reduce((a,b)=>a+b,0)/ranked.length});
    }
    board.parts=parts;
    return checked(rows,26);
  },
};
export default board;
