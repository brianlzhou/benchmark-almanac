// The source reports no overall score. The headline is the plain mean of the 5 parts, computed by this importer.
// FinRED evaluates financial safety. Table II reports attack success rates by risk category and test method.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
const url='https://arxiv.org/html/2606.19887';
const risks=['R1: Cyber Threats','R2: Financial Crime','R3: Misinformation','R4: Consumer Rights','R5: Compliance Evasion'];
const board:Leaderboard={
  benchmark:'finred-financial-safety',static:'paper',url,feed:url,terms:PAPER_TERMS,
  aliases:{gemma3:'gemma-3-12b',EXAONE:'exaone-3-5-7-8b-instruct','Claude-4':'claude-sonnet-4'},
  parts:Object.fromEntries(risks.map((r,i)=>['r'+(i+1),{name:r,unit:'%' as const,better:'lower' as const}])),
  headline:'The paper reports no overall attack success rate. The headline averages its five financial risk categories.',
  async fetch(){
    const table=paperTables(await paperHtml(url)).map(grid).find(t=>t[1]?.slice(0,2).join('|')==='Taxonomy|Attack Method');
    if(!table || table[1].length!==14) throw new Error('Missing FinRED target columns');
    const body=table.slice(2);
    const rows:LeaderboardRow[]=[];
    for(const setting of new Set(body.map(r=>r[1]))){
      const byRisk=risks.map(r=>body.find(row=>row[0]===r && row[1]===setting));
      if(byRisk.some(r=>!r)) throw new Error('Missing FinRED risk category');
      for(let i=2;i<table[1].length;i++){
        const cells=byRisk.map(r=>r![i]);
        if(cells.every(v=>v==='-')) continue;
        if(cells.some(v=>!/^\d+(?:\.\d+)?$/.test(v))) throw new Error('Incomplete FinRED rate');
        const values=cells.map(Number);
        const source=table[1][i];
        // The authors expand these abbreviated headers in the target models paragraph.
        const model=({'Gemini-Pro':'Gemini 2.5 Pro (snapshot unspecified)','Gemini-Flash':'Gemini 2.5 Flash (snapshot unspecified)',
          'Llama3.1':'Llama-3.1-8B-it','Qwen2.5':'Qwen2.5-7B-it'} as Record<string,string>)[source]??source;
        rows.push({model,setting,score:values.reduce((a,b)=>a+b,0)/5,
          metrics:Object.fromEntries(values.map((v,j)=>['r'+(j+1),v]))});
      }
    }
    return checked(rows,62);
  },
};
export default board;
