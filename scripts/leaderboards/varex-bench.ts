// Maker leaderboard's full-document-set Exact Match, image modality.
import type {Leaderboard} from './types.ts';
import {fetchText} from '../lib/util.ts';
import {jsLiteral} from '../lib/html.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const URL='https://udibarzi.github.io/varex-bench/';
const board:Leaderboard={benchmark:'varex-bench', parts: {
  flat: { name: 'Flat', group: 'Category' },
  nested: { name: 'Nested', group: 'Category' },
  table: { name: 'Table', group: 'Category' },
},url:URL,feed:URL,
 stats:{anls:{name:'Average normalized Levenshtein similarity',unit:'score',better:'higher'},perfect:{name:'Perfect match rate',unit:'%',better:'higher'}},
 terms:'Public IBM Research project leaderboard; GitHub Pages robots.txt has no restriction on this path.',
 async fetch(){const html=await fetchText(URL);const start=html.indexOf('const models = [');if(start<0)throw new Error('Leaderboard data missing');
 const data=jsLiteral<{model:string;size:string;em:number;anls:number;flat:number;nested:number;table:number;perfect:number}[]>(html,html.indexOf('[',start));
 return checked(data.map(r=>({model:/^(Qwen|InternVL|Ministral|NuExtract|Gemma 3$|Gemma 3n|h2oVL)/.test(r.model)?`${r.model} ${r.size}`:r.model,score:r.em,params:/^\d+(?:\.\d+)?[MB]$/.test(r.size)?parseFloat(r.size)*(r.size.endsWith('M')?0.001:1):undefined,setting:'Image (V); temperature 0',metrics:{anls:r.anls,flat:r.flat,nested:r.nested,table:r.table,perfect:r.perfect}})),3);
 }};export default board;
