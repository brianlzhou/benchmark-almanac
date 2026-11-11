// LLM-AggreFact. llm-aggrefact.github.io is server-rendered (Next.js) with one HTML table: Model | Size |
// Average (balanced accuracy over the 11 datasets, 0 to 100, the ranking) | one column per dataset.
// Average is the score. Read all serialized models, not only the UI-selected subset.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { nextFlight, jsonAfter } from '../lib/html.ts';

const URL = 'https://llm-aggrefact.github.io/';

const board: Leaderboard = {
  benchmark: 'llm-aggrefact',
  url: URL,
  feed: `${URL} (serialized scoresData, mean dataset accuracy)`,
  terms: 'Static GitHub Pages site; robots.txt allows all paths and the page states no terms.',
  aliases:{'gpt-4o-2024-05-13':'gpt-4o-may-2024','gpt-4o-mini-2024-07-18':'gpt-4o-mini','Llama-3.1-405B-Instruct':'llama-3-1-405b'},
  async fetch() {
    const html=await fetchText(URL);
    const data=jsonAfter<Record<string,string|number>[]>(nextFlight(html),'"scoresData":');
    const rows:LeaderboardRow[]=[];
    for(const r of data){
      let model=String(r.model);const metrics:Record<string,number>={};
      for(const [k,v]of Object.entries(r))if(!['Average','Size'].includes(k)&&typeof v==='number'&&Number.isFinite(v))metrics[k]=v;
      const scores=Object.values(metrics);if(!scores.length)continue;
      if(/^(Claude-3\.5 Sonnet|Mistral-Large 2|GPT-4|GPT-3\.5|Gemini)/i.test(model)&&! /20\d\d-\d\d-\d\d/.test(model))model+=' [snapshot unspecified]';
      rows.push({model,score:Number((scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1)),setting:r.Size&&r.Size!=='-'?'size '+r.Size:undefined,metrics});
    }
    return rows;
  },
};
export default board;
