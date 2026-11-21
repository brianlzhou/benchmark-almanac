// The LLM Game Benchmark compares models playing tic-tac-toe, Gomoku and Connect Four.
// The board's most aggregated view reports "Wins (1st)" across game types, prompts and opponents.
// The raw matchup table supplies per-game wins, which must sum to the published result.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { fetchJson } from '../lib/util.ts';
const base='https://research-outcome.github.io/LLM-Game-Benchmark/leaderboard/';
const feed=base+'leaderboard-data-agg-gametype-prompttype-llm2.json';
const parts={'tic-tac-toe':'Tic-tac-toe',gomoku:'Gomoku','connect-four':'Connect Four'};
const board:Leaderboard={
  benchmark:'llm-game-benchmark',url:base,feed,parts,
  terms:'The authors publish their terms at https://github.com/research-outcome/LLM-Game-Benchmark/blob/main/LICENSE.',
  aliases:{'anthropic.claude-3-5-sonnet-20240620-v1:0':'claude-3-5-sonnet','anthropic.claude-3-sonnet-20240229-v1:0':'claude-3-sonnet','meta.llama3-70b-instruct-v1:0':'llama-3-70b'},
  async fetch(){
    const combined=await fetchJson<Record<string,string|number>[]>(feed);
    const raw=await fetchJson<Record<string,string>[]>(base+'leaderboard-data.json');
    const rows=[];
    for(const r of combined){
      const model=r.LLM1stPlayer;
      if(model==='random-play')continue;
      const score=r['Wins-1st'];
      if(typeof model!=='string'||typeof score!=='number')throw new Error('Missing combined first-player wins');
      const metrics:Record<string,number>={};
      for(const key of ['Disqualifications-1st','Disqualifications-2nd','Draws','InvalidMoves-1st','InvalidMoves-2nd','TotalMoves-1st','TotalMoves-2nd']){
        if(typeof r[key]!=='number')throw new Error('Invalid '+key);
        metrics[key.replace('-','')]=Number(r[key]);
      }
      let total=0;
      for(const match of raw.filter(g=>g.LLM1stPlayer===model)){
        const game=match.GameType;
        if(!(game in parts)||!/^\d+$/.test(match['Wins-1st']))throw new Error('Invalid matchup');
        const wins=Number(match['Wins-1st']);
        metrics[game]=(metrics[game]??0)+wins;total+=wins;
      }
      if(total!==score||Object.keys(parts).some(k=>!(k in metrics)))throw new Error('Game totals disagree: '+model);
      rows.push({model,score,metrics,setting:'First player, all prompts and opponents'});
    }
    return checked(rows,7);
  },
};
export default board;
