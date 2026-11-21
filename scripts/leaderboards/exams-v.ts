// EXAMS-V tests visual exam questions across 11 languages. Table 4 reports average
// accuracy and accuracy by language for vision models and text models using OCR and captions.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
const url='https://arxiv.org/html/2403.10378';
const parts={bg:'Bulgarian',zh:'Chinese',hr:'Croatian',fr:'French',de:'German',hu:'Hungarian',
  en:'English',sr:'Serbian',it:'Italian',ar:'Arabic',pl:'Polish'};
const board:Leaderboard={
  benchmark:'exams-v',static:'paper',url,feed:url,terms:PAPER_TERMS,parts,
  aliases:{'Gemini-V':'gemini-1-0-pro-vision','Gemini Pro (snapshot unspecified)':'gemini-1-0-pro'},
  async fetch(){
    const table=paperTables(await paperHtml(url)).map(grid).find(t=>t[0]?.join('|')===['Model',...Object.keys(parts),'Avg'].join('|'));
    if(!table) throw new Error('Missing EXAMS-V accuracy results');
    const rows:LeaderboardRow[]=[];
    let setting='';
    for(const [model,...cells] of table.slice(1)){
      if(model.startsWith('Vision Language Models')){setting='Image input';continue;}
      if(model.startsWith('Augmented Large Language Models')){setting='OCR and captioning';continue;}
      if(model==='Random' || cells.at(-1)==='–') continue;
      if(!setting || cells.length!==12 || cells.some(v=>!/^\d+(\.\d+)?$/.test(v))) throw new Error('Invalid EXAMS-V result for '+model);
      rows.push({model,setting,score:Number(cells.at(-1)),metrics:Object.fromEntries(Object.keys(parts).map((k,i)=>[k,Number(cells[i])]))});
    }
    return checked(rows,5);
  },
};
export default board;
