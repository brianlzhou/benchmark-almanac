// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// Tables 3 and 4 report code correctness first, then instruction adherence, for English and Chinese prompts.
// Each language average covers eight programming languages.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables,grid,checked } from '../lib/boards/arxiv-span-tables.ts';

const feed='https://arxiv.org/html/2507.22462';
const languages=['Python','Java','Cpp','C-sharp','Typescript','Javascript','Php','Shell','Avg.'];
const splits=['English','Chinese'];
const parts=Object.fromEntries(splits.flatMap(split=>languages.flatMap(lang=>['Correctness','Instruction adherence'].map(metric=>{
  const name=[split,lang==='Avg.'?'':lang,metric].filter(Boolean).join(' ');
  return [name,name];
}))));
const board:Leaderboard={
  benchmark:'ifevalcode',static:'paper',feed,url:feed,terms:PAPER_TERMS+' https://arxiv.org/licenses/',parts,
  headline:'The paper reports separate averages by prompt language. The headline is the plain mean of English and Chinese code correctness.',
  aliases:{'Claude-3.5-Sonnet (snapshot unspecified)':'claude-3-5-sonnet','Qwen3-3/30B':'qwen3-30b-a3b','Qwen3-22B/235B':'qwen3-235b-a22b'},
  async fetch(){
    const grids=paperTables(await paperHtml(feed)).map(grid).filter(t=>t[0]?.[0]==='Models' && t[0]?.[18]==='Avg.' &&
      languages.every((l,i)=>t[0][2+2*i]===l && t[1][2+2*i]==='Corr.' && t[1][3+2*i]==='Instr.'));
    if(grids.length!==2) throw Error('Missing English or Chinese evaluation');
    const rows=new Map<string,LeaderboardRow>();
    for(const [i,t] of grids.entries()){
      for(const r of t.slice(2)){
        if(r[0]===r[1]) continue;
        const raw=r[0], size=r[1];
        const model=raw.replace('-think','')+(size && !raw.startsWith('Deepseek-V') && raw!=='Deepseek-R1'?'-'+size:'');
        const setting=raw==='Qwen3-think'?'Thinking':raw==='Qwen3'?'Non-thinking':undefined;
        const key=JSON.stringify([model,setting]);
        const row=rows.get(key)??{model,setting,score:0,metrics:{}};
        for(const [j,lang] of languages.entries()){
          for(const [k,metric] of ['Correctness','Instruction adherence'].entries()){
            const value=r[2+2*j+k];
            if(!value?.trim() || !Number.isFinite(Number(value))) throw Error('Missing '+metric+' for '+model);
            row.metrics![[splits[i],lang==='Avg.'?'':lang,metric].filter(Boolean).join(' ')]=Number(value);
          }
        }
        rows.set(key,row);
      }
    }
    for(const r of rows.values()) r.score=(r.metrics!['English Correctness']+r.metrics!['Chinese Correctness'])/2;
    return checked([...rows.values()],50);
  },
};
export default board;
