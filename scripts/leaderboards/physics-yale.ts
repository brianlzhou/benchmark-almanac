// Original PHYSICS test accuracy and the paper’s mark for evaluations that include image problems.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { num } from '../lib/html.ts';
const FEED='https://raw.githubusercontent.com/yale-nlp/Physics/HEAD/README.md';
const board:Leaderboard={benchmark:'physics-yale', stats:{Val:{name:'Validation accuracy',unit:'%',better:'higher'}}, parts: {
  AMO: { name: 'Atomic physics', group: 'Domain' },
  'E&M': { name: 'Electromagnetism', group: 'Domain' },
  CM: { name: 'Classical mechanics', group: 'Domain' },
  'Opt.': { name: 'Optics', group: 'Domain' },
  QM: { name: 'Quantum mechanics', group: 'Domain' },
  'Stats.': { name: 'Thermodynamics and statistical physics', group: 'Domain' },
},url:'https://github.com/yale-nlp/Physics',feed:FEED,
 terms:'Official Yale NLP repository results; upstream licensing applies and the Almanac credits and links the source.',
 async fetch(){
  const table=markdownTables(await fetchText(FEED)).find(t=>t[0].includes('AMO')&&t[0].includes('Test'));
  if(!table)throw new Error('Original PHYSICS test table missing');
  const rows:LeaderboardRow[]=[];
  let open: boolean | undefined;
  for(const r of table.slice(1)){
   if (r[0] === 'Proprietary Models') open = false;
   if (r[0] === 'Open-Source Models') open = true;
   const score=num(r[8]);if(score===undefined)continue;
   let model=r[0].replace(/†/g,'').trim();
   if(/^(Gemini-1.5-pro|GPT-4o|Claude-3.5-Sonnet|DeepSeek-R1|Mistral-7B)$/i.test(model))model+=' (snapshot unspecified)';
   const metrics:Record<string,number>={};for(let i=1;i<8;i++){const n=num(r[i]);if(n!==undefined)metrics[table[0][i]]=n;}
   rows.push({model,score,metrics,open,setting:r[0].includes('†') ? 'includes image problems' : undefined});
  }
  if(!rows.length)throw new Error('No PHYSICS test scores');return rows;
 }};
export default board;
