// The source reports no overall score. The headline is the plain mean of the 4 parts, computed by this importer.
// HMU-Bench tests music understanding from ABC notation and audio in Chinese and English.
// The official aggregate files preserve the 0 to 4 judge scores and the audio full-credit rates.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { fetchJson } from '../lib/util.ts';
const base='https://raw.githubusercontent.com/stepaudiollm/hmu-bench/HEAD/data/public/aggregate_results/';
const feed=base+'abc_aggregate_results.json';
type Model={id:string,label:string,overall:{zh:number,en:number}};
type ABC=Model & {group:string,domains:Record<string,number>,solution_requirements:Record<string,number>};
type Audio=Model & {configurations:Record<string,{score:number,fcr_percent:number}>};
const main=['ABC Chinese','ABC English','Audio Chinese','Audio English'];
const abcKeys=['global_information','pitch_and_melody','tonality_and_harmony','rhythm','form_and_temporal_structure','verifiable_symbolic_tasks','extraction','single_step','multi_step'];
const audioKeys=['global_easy','global_hard','local_easy','local_medium','local_hard'];
const board:Leaderboard={
  benchmark:'hmu-bench',url:'https://github.com/stepaudiollm/hmu-bench#results',feed,
  terms:'The authors describe evaluation-only use subject to Suno terms. https://github.com/stepaudiollm/hmu-bench#citation-and-licensing',
  headline:'The headline is the plain mean of the Chinese and English scores for the ABC notation and audio tracks.',
  parts:Object.fromEntries([...main,...abcKeys,...audioKeys,...audioKeys.map(k=>k+'_fcr')].map(k=>[k,{name:k.replaceAll('_',' ').replace(/ fcr$/,' full-credit rate'),unit:k.endsWith('_fcr')?'%' as const:'score' as const}])),
  async fetch(){
    const abc=await fetchJson<{models:ABC[]}>(feed);
    const audio=await fetchJson<{models:Audio[]}>(base+'audio_aggregate_results.json');
    const rows:LeaderboardRow[]=[];
    for(const a of abc.models.filter(r=>r.group==='omni')){
      const b=audio.models.find(r=>r.id===a.id || (a.id==='stepaudio3' && r.id==='stepaudio3_0909'));
      if(!b) throw new Error('Missing audio scores for '+a.label);
      const totals=[a.overall.zh,a.overall.en,b.overall.zh,b.overall.en];
      const metrics:Record<string,number>=Object.fromEntries(main.map((k,i)=>[k,totals[i]]));
      for(const k of abcKeys) metrics[k]=a.domains[k] ?? a.solution_requirements[k];
      for(const k of audioKeys){
        metrics[k]=b.configurations[k].score;
        metrics[k+'_fcr']=b.configurations[k].fcr_percent;
      }
      if(!Object.values(metrics).every(Number.isFinite)) throw new Error('Incomplete HMU-Bench scores');
      rows.push({model:a.label,score:totals.reduce((sum,v)=>sum+v,0)/4,metrics});
    }
    return checked(rows,7);
  },
};
export default board;
