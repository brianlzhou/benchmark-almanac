// Maker's default Avg Score: equal mean of four skill scores, rounded to one decimal.
import type {Leaderboard} from './types.ts';
import {fetchJson} from '../lib/util.ts';
const FEED='https://huggingface.co/spaces/KL4805/shopping_mmlu_leaderboard/raw/main/ShoppingMMLU_overall.json';
const board:Leaderboard={benchmark:'shopping-mmlu', parts: {
  'Shopping Concept Understanding': { name: 'Shopping concept understanding', group: 'Category' },
  'Shopping Knowledge Reasoning': { name: 'Shopping knowledge reasoning', group: 'Category' },
  'User Behavior Alignment': { name: 'User behavior alignment', group: 'Category' },
  'Multi-lingual Abilities': { name: 'Multilingual abilities', group: 'Category' },
},url:'https://huggingface.co/spaces/KL4805/shopping_mmlu_leaderboard',feed:FEED,
 terms:'Public maker results file; Hugging Face robots.txt permits this raw path. No additional reading restriction is stated.',
 async fetch(){const d=await fetchJson<{results:Record<string,Record<string,unknown>>}>(FEED);
 const keys=['Shopping Concept Understanding','Shopping Knowledge Reasoning','User Behavior Alignment','Multi-lingual Abilities'];
 const rows=Object.entries(d.results).map(([model,r])=>{const values=keys.map(k=>(r[k] as {Overall:number})?.Overall);if(values.some(v=>typeof v!=='number'||!Number.isFinite(v)))throw new Error('Incomplete skill scores');
 return {model:model==='ChatGPT'?'GPT-3.5-Turbo (snapshot unspecified)':model,score:Math.round(values.reduce((a,b)=>a+b,0)/4*10)/10,metrics:Object.fromEntries(keys.map((k,i)=>[k,values[i]]))};});
 if(rows.length<3)throw new Error('Too few models');return rows;
 }};export default board;
