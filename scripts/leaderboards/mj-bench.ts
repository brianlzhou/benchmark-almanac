// Maker's default Overall Score: perspective-weighted mean, rounded to two decimals.
// Weights and calculation are published in the official Space app.py.
import type {Leaderboard} from './types.ts';
import {fetchJson} from '../lib/util.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const TREE='https://huggingface.co/api/datasets/MJ-Bench/MJ-Bench-Results/tree/main/mjbench-results/overall-results';
const board:Leaderboard={benchmark:'mj-bench', parts: {
  Alignment: { name: 'Alignment', group: 'Dimension' },
  Safety: { name: 'Safety', group: 'Dimension' },
  Quality: { name: 'Quality', group: 'Dimension' },
  Bias: { name: 'Bias', group: 'Dimension', note: 'The official leaderboard combines this perspective score into its weighted overall score.' },
},url:'https://huggingface.co/spaces/MJ-Bench/MJ-Bench-Leaderboard',feed:TREE,
 terms:'Public maker results dataset; Hugging Face robots.txt permits these API and raw-file paths.',
 async fetch(){const files=await fetchJson<{type:string;path:string}[]>(TREE);const rows=[];const weights:Record<string,number>={Alignment:724,Safety:574,Quality:1121,Bias:540};
 for(const f of files.filter(f=>f.type==='file'&&f.path.endsWith('.json'))){
 const data=await fetchJson<Record<string,unknown>[]>('https://huggingface.co/datasets/MJ-Bench/MJ-Bench-Results/raw/main/'+f.path.split('/').map(encodeURIComponent).join('/'));
 for(const r of data){if(Object.keys(weights).some(k=>typeof r[k]!=='number'))throw new Error('Missing perspective score');
 const metrics=Object.fromEntries(Object.keys(weights).map(k=>[k,Number(r[k])]));const score=Math.round(Object.entries(weights).reduce((s,[k,w])=>s+Number(r[k])*w,0)/2959*100)/100;
 rows.push({model:String(r.Model),score,setting:String(r['Input Type']),metrics});}
 }return checked(rows,3);
 }};export default board;
