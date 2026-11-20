import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { num } from '../lib/html.ts';
const URL='https://raw.githubusercontent.com/OFA-Sys/AIR-Bench/HEAD/README.md';
const board:Leaderboard={benchmark:'air-bench-foundation', parts: {
  'Speech grounding': { name: 'Speech grounding', group: 'Task type' },
  'Spoken language identification': { name: 'Spoken language identification', group: 'Task type' },
  'Speaker gender recognition': { name: 'Speaker gender recognition', group: 'Task type' },
  'Emotion recognition': { name: 'Emotion recognition', group: 'Task type' },
  'Speaker age prediction': { name: 'Speaker age prediction', group: 'Task type' },
  'Speech entity recognition': { name: 'Speech entity recognition', group: 'Task type' },
  'Intent classification': { name: 'Intent classification', group: 'Task type' },
  'Speaker number verification': { name: 'Speaker number verification', group: 'Task type' },
  'Synthesized voice detection': { name: 'Synthesized voice detection', group: 'Task type' },
  'Audio grounding': { name: 'Audio grounding', group: 'Task type' },
  'Vocal sound classification': { name: 'Vocal sound classification', group: 'Task type' },
  'Acoustic scene classification': { name: 'Acoustic scene classification', group: 'Task type' },
  'Sound question answering': { name: 'Sound question answering', group: 'Task type' },
  'Music instruments classification': { name: 'Music instruments classification', group: 'Task type' },
  'Music genre classfication': { name: 'Music genre classification', group: 'Task type' },
  'Music note analysis-pitch': { name: 'Music note analysis, pitch', group: 'Task type' },
  'Music note analysis-velocity': { name: 'Music note analysis, velocity', group: 'Task type' },
  'Music question answering': { name: 'Music question answering', group: 'Task type' },
  'Music emotion detection': { name: 'Music emotion detection', group: 'Task type' },
},url:'https://github.com/OFA-Sys/AIR-Bench',feed:URL,terms:'Apache-2.0 benchmark repository. The Almanac credits the authors and links the source.',async fetch(){
 const t=markdownTables(await fetchText(URL)).find(t=>t[0]?.[0]==='Categories');
 const avg=t?.find(r=>r[0]==='Average');if(!t||!avg)throw new Error('Foundation average missing');
 return t[0].slice(1).flatMap((model,j)=>{const score=num(avg[j+1]);if(score===undefined)return [];
 return [{model,score,metrics:Object.fromEntries(t.slice(2).filter(r=>r[0]!=='Average').flatMap(r=>{const n=num(r[j+1]);return n===undefined?[]:[[r[0],n]];}))}];});
 }};export default board;
