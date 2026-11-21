// JEEM tests culturally grounded Arabic image captioning across five dialect subsets.
// The source reports no overall score. The headline is the plain mean of the five DCScore F1 parts, computed here.
// This importer reads the paper's Table 3.
import type {Leaderboard,LeaderboardRow} from './types.ts'; import {checked} from '../lib/boards/arxiv-span-tables.ts';
const FEED='https://aclanthology.org/2026.findings-eacl.18.pdf';
const parts={MSA:{name:'MSA'},JO:{name:'Jordanian'},AE:{name:'Emirati'},EG:{name:'Egyptian'},MA:{name:'Moroccan'}};
const board:Leaderboard={benchmark:'jeem',url:'https://aclanthology.org/2026.findings-eacl.18/',feed:FEED,static:'paper',headline:'The paper reports no overall score, so this is the plain mean of its five dialect DCScore F1 scores.',parts,terms:'ACL Anthology terms. https://aclanthology.org/faq/copyright/',async fetch(){const vals:{model:string; parts:number[]}[]=[{model:'AIN',parts:[48.32,51.57,52.16,43.90,55.32]},{model:'AyaV',parts:[70.43,71.49,70.15,62.41,66.50]},{model:'Palo',parts:[50.08,54.97,53.28,47.09,58.33]},{model:'GPT-4o',parts:[68.00,66.39,66.53,62.06,66.58]}];return checked(vals.map(v=>({model:v.model,score:v.parts.reduce((a,b)=>a+b,0)/v.parts.length,metrics:Object.fromEntries(Object.entries(parts).map(([k],i)=>[k,v.parts[i]]))})),4);}};export default board;
