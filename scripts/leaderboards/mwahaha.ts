// MWAHAHA uses human votes to rate generated jokes. Table 7 of the organizers' paper defines Avg Elo:
// "The average is computed only over subtasks in which the system participated."
// We read the five official Elo files, retaining each subtask's bootstrap interval and battle count.
// Table 7 and Section 7 identify the participating models: https://aclanthology.org/2026.semeval-1.454/
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://pln-fing-udelar.github.io/semeval-2026-humor-gen/';
const tracks = ['a-en','a-es','a-zh','b1','b2'];
interface Entry {system:string;rating:number;rating_q025:number;rating_q975:number;num_battles:number}
const systems: Record<string,[string,string,string[]?]> = {
  baseline:['Gemini 2.5 Flash (snapshot unspecified)','Organizers'], SLPG_FJWU_Insa:['Phi-2','SLPG_FJWU_Insa'],
  oseminck:['DeepSeek-R1','Lattice'], abdulmj1:['Llama-3.1-8B','AI4PC'], jayicodes:['Qwen2.5-7B','Edward Ajayi'],
  deepgpt:['Qwen2.5-3B','deepgpt'], hugang11:['Qwen2.5-7B','hugang11'], stefanoprea:['Gemma','FunnyBorg'],
  clashing:['Qwen2.5-3B-Instruct','CUET_clashing',['Qwen2.5-3B-Instruct','Salamandra-2B-Instruct']],
  j10official:['Gemma 3 27B','j10official',['Gemma 3 27B','Nemotron']],
  arampageos:['Qwen2.5-14B-Instruct','DUTH',['Qwen2.5-14B-Instruct','Mistral-7B-Instruct']],
  t_abbasi7:['Llama-3-8B','YNWA_AZ',['Llama-3-8B','BLIP','TinyLlama']],
};
const board: Leaderboard = {
  benchmark:'mwahaha',url:url+'results.html',feed:url+'scores/a-en.json',
  terms:'The organizers publish the attributed competition results. '+url+'results.html',
  parts:{'a-en':'Task A: English','a-es':'Task A: Spanish','a-zh':'Task A: Chinese',b1:'Task B1',b2:'Task B2'},harnesses:'system',
  async fetch() {
    const data = new Map<string,LeaderboardRow>();
    for (const [i,key] of tracks.entries()) {
      if (i) await new Promise(r => setTimeout(r,1000));
      const entries = await fetchJson<Entry[]>(url+'scores/'+key+'.json');
      if (!entries.some(e => e.system === 'baseline')) throw new Error('Missing MWAHAHA subtask '+key);
      for (const e of entries) {
        if (!systems[e.system]) continue;
        const [model,team,models] = systems[e.system];
        const row = data.get(team) ?? {model,models,submitter:team,harness:team === 'Organizers' ? undefined : team,
          setting:team === 'Organizers' ? 'Zero-shot' : undefined,score:0,metrics:{}};
        if (![e.rating,e.rating_q025,e.rating_q975,e.num_battles].every(Number.isFinite)) throw new Error('Invalid Elo row');
        Object.assign(row.metrics!,{[key]:e.rating,[key+'Low']:e.rating_q025,[key+'High']:e.rating_q975,[key+'Battles']:e.num_battles});
        data.set(team,row);
      }
    }
    const rows = [...data.values()];
    for (const row of rows) {
      const scores = tracks.filter(k => k in row.metrics!).map(k => row.metrics![k]);
      row.score = scores.reduce((a,b)=>a+b,0)/scores.length;
    }
    return checked(rows,12);
  },
};
export default board;
