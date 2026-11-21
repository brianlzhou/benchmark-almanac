// The source reports no overall score. The headline is the plain mean of the 6 corpus parts, computed by this importer.
// SandhiKosh evaluates Sanskrit Sandhi merging tools. Table 2 reports exact merging accuracy for three named tools.
import type {Leaderboard} from './types.ts';
import {pdfText} from '../lib/boards/pdf-text.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const feed='https://aclanthology.org/L18-1712.pdf';
const parts={ruleBasedInternal:'Rule based: Internal',ruleBasedExternal:'Rule based: External',literature:'Literature',bhagavadGita:'Bhagavad-gita',uoh:'UoH',astaadhyaayi:'Astaadhyaayi'};
const board:Leaderboard={benchmark:'sandhikosh',url:'https://aclanthology.org/L18-1712/',feed,static:'paper',headline:'The paper reports no overall score, so this is the plain mean of its six corpus scores.',parts,terms:'ACL Anthology makes this paper available under its publication terms. https://aclanthology.org/faq/copyright/',async fetch(){
 const p=await pdfText(feed); if(!p.includes('Sandhi accuracy obtained by the three different'))throw Error('Missing SandhiKosh Table 2');
 const data={JNU:[14,28.8,35.3,23.64,37.4,16.9],UoH:[24,29.5,86.7,73.1,79.8,64.9],INRIA:[52.7,50.8,85.3,82.1,81.7,65.2]};
 return checked(Object.entries(data).map(([model,v])=>{const metrics=Object.fromEntries(Object.keys(parts).map((k,i)=>[k,v[i]]));return {model,score:v.reduce((a,b)=>a+b,0)/v.length,metrics,flag:'computed-mean'} as any;}),3);
}}; export default board;
