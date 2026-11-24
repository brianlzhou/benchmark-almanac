// IdeaTaste compares proposals to subsequent research papers and measures proposal diversity.
// The board lists citation matching first. Its all-areas view averages the four area scores and multiplies by 100.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { fetchJson } from '../lib/util.ts';
const feed='https://cxcscmu.github.io/IdeaTaste/assets/data/leaderboard.json';
const labels={match_cite:'Match-Cite',match_idea:'Match-Idea',diversity_cite:'Diversity-Cite',diversity_idea:'Diversity-Idea'};
const areas={ml_systems:'Machine learning systems',code_generation:'Code generation',world_models:'World models',automated_research:'Automated research'};
type BoardData={metrics:string[],methods:string[],areas:{key:string}[],models:{key:string,name:string}[],scores:Record<string,Record<string,Record<string,Record<string,number>>>>};
const board:Leaderboard={
  benchmark:'ideataste',url:'https://cxcscmu.github.io/IdeaTaste/#leaderboard',feed,
  terms:'The project uses MIT. https://github.com/cxcscmu/IdeaTaste/blob/main/LICENSE',
  headline:'The headline is Match-Cite, the first metric in the board’s all-areas view.',
  parts:Object.fromEntries(Object.entries(labels).flatMap(([key,name])=>[[key,{name,unit:'%' as const}],...Object.entries(areas).map(([a,label])=>[a+'_'+key,{name:label+': '+name,unit:'%' as const}])])),
  async fetch(){
    const d=await fetchJson<BoardData>(feed);
    if(d.metrics.join('|')!==Object.keys(labels).join('|') || d.areas.map(a=>a.key).sort().join('|')!==Object.keys(areas).sort().join('|')) throw new Error('Unexpected IdeaTaste metrics or areas');
    const rows:LeaderboardRow[]=[];
    for(const model of d.models) for(const setting of d.methods){
      const metrics:Record<string,number>={};
      for(const key of d.metrics){
        const scores=d.areas.map(({key:area})=>{
          const value=d.scores[model.key][area][setting][key];
          if(!Number.isFinite(value)) throw new Error('Missing score for '+model.name);
          return metrics[area+'_'+key]=100*value;
        });
        metrics[key]=scores.reduce((a,b)=>a+b,0)/scores.length;
      }
      rows.push({model:model.name,setting,score:metrics.match_cite,metrics});
    }
    return checked(rows,24);
  },
};
export default board;
