// The source reports no overall score. The headline is the plain mean of the 48 parts, computed by this importer.
// MELO links occupation titles across taxonomies and languages. Tables 5 and 6 give mean reciprocal rank for each task.
// The authors' results directory identifies the Romanian cross-language and Swedish monolingual columns where Table 6b repeats or mistypes a language.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
const feed='https://recsyshr.aau.dk/wp-content/uploads/2024/10/RecSysHR2024-paper_2.pdf';
const board:Leaderboard={
  benchmark:'melo-occupations',url:'https://github.com/Avature/melo-benchmark/tree/main/results',feed,
  terms:'Avature publishes its benchmark under the MIT license at https://github.com/Avature/melo-benchmark/blob/main/LICENSE. The paper credits its authors.',
  async fetch(){
    const pdf=await pdfText(feed);
    const section=pdf.slice(pdf.lastIndexOf('\fTable 5'));
    if(!section.includes('Mean reciprocal rank (MRR)')||!section.includes('Table 6'))throw new Error('Missing MRR tables');
    const parts:Record<string,string>={};
    const scores=new Map<string,Record<string,number>>();
    let countries:string[]=[], keys:string[]=[];
    for(const line of section.split('\n')){
      const words=line.trim().split(/\s+/);
      if(words.length>=4 && words.every(w=>/^[A-Z]{3}$/.test(w))){countries=words;continue;}
      if(words.length>=8 && words.every(w=>/^[a-z]{2}-[a-z]{2}$/.test(w))){
        if(words.length!==countries.length*2)throw new Error('Unexpected country header');
        keys=words.map((pair,i)=>{
          const country=countries[Math.floor(i/2)];
          if(country==='ROU' && i%2===1)pair='ro-en';
          if(country==='SWE' && i%2===0)pair='sv-sv';
          const key=country+'_'+pair.replace('-','_');parts[key]=country+': '+pair;
          return key;
        });
        continue;
      }
      const match=line.trim().match(/^(.+?)\s{2,}((?:(?:\d+\.\d+|-)\s+)+(?:\d+\.\d+|-))$/);
      if(!match)continue;
      const vals=match[2].split(/\s+/);
      if(vals.length!==keys.length)throw new Error('Invalid row width');
      const model=match[1]==='OpenAI'?'text-embedding-3-large':match[1];
      const metrics=scores.get(model)??{};
      vals.forEach((v,i)=>{if(v!=='-')metrics[keys[i]]=Number(v);});
      scores.set(model,metrics);
    }
    if(Object.keys(parts).length!==48)throw new Error('Missing MELO tasks');
    board.parts=parts;
    const rows:LeaderboardRow[]=[];
    for(const [model,metrics] of scores){
      const values=Object.values(metrics);
      if(values.length===48)rows.push({model,metrics,score:values.reduce((a,b)=>a+b,0)/48});
    }
    return checked(rows,12);
  },
};
export default board;
