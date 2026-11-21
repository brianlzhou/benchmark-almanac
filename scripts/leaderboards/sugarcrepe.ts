// SugarCrepe tests compositional image-text understanding with replacement, swap, and addition distractors.
// SOTA2 ranks methods by overall caption-choice accuracy and stores category scores when available.
import type { Leaderboard } from './types.ts';
import { tables, text } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed='https://www.sota2.com/research/sota/compositional-reasoning-on-sugarcrepe';
const board:Leaderboard={benchmark:'sugarcrepe',url:feed,feed,host:'SOTA2',terms:'SOTA2 publishes this leaderboard at '+feed+'.',parts:{replaceObject:'REPLACE Object Acc',replaceAttribute:'REPLACE Attribute Acc',replaceRelation:'REPLACE Relation Acc',swapObject:'SWAP Object Acc',swapAttribute:'SWAP Attribute Acc',addObject:'ADD Object Acc',addAttribute:'ADD Attribute Acc'},async fetch(){const table=tables(await fetchText(feed)).find(t=>t[0].map(c=>c.text).join('|').startsWith('Method|Links|Overall Accuracy'));if(!table)throw new Error('Missing SugarCrepe leaderboard');return checked(table.slice(1).filter(r=>/^\d/.test(r[2].text)).map(r=>{const a=r[0].html.match(/<a\b[^>]*>([\s\S]*?)<\/a>/);if(!a)throw new Error('Missing SugarCrepe model');const setting=text(r[0].html.match(/role="tooltip">([\s\S]*?)<\/span>/)?.[1]??'');const metrics:Record<string,number>={};[3,4,5,7,8,10,11].forEach((i,j)=>{if(r[i]?.text && /^\d/.test(r[i].text))metrics[Object.keys(board.parts!)[j]]=numberCell(r[i].text)});return {model:text(a[1]),setting:setting||undefined,score:numberCell(r[2].text),metrics}}),10)}};
export default board;
