// Arena-T2I Hard scores the fraction of prompt requirements an image satisfies, accounting for dependencies.
// Table 1 gives the 310-prompt leaderboard. Tables 5 and 6 give subsets and Table 7 adds open models.
import type { Leaderboard,LeaderboardRow } from './types.ts';
import { paperHtml,PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { grid,flatPaperTables,checked } from '../lib/boards/arxiv-span-tables.ts';
const feed='https://arxiv.org/html/2606.31711';
const categories=['3D modeling','Art','Cartoon','Commercial design','Photorealistic','Portraits','Text'];
const board:Leaderboard={
  benchmark:'arena-t2i-hard',url:'https://banyuanhao.github.io/Arena-T2I-Hard-Page/',feed,static:'paper',terms:PAPER_TERMS,
  parts:Object.fromEntries([...categories,'Gemini-3-Pro (243 prompts)','GPT-5.4 (243 prompts)'].map(c=>[c,c])),
  stats:{dpg:{name:'Dependency prompt grounding',unit:'score',better:'higher'},dsg:{name:'Dependency satisfaction grounding',unit:'score',better:'higher'},arenaScore:{name:'Arena score',unit:'score',better:'higher'}},
  aliases:{'gemini-3-pro-image-preview-2k':'gemini-3-pro-image-nano-banana-pro-2k','gpt-image-1.5-high-fidelity':'gpt-image-1-5',
    'gemini-2.5-flash-image (nano-banana)':'gemini-2-5-flash-image-preview-nano-banana','imagen-4.0-ultra-generate-001':'imagen-4-ultra-generate-001',
    'imagen-4.0-generate-001':'imagen-4-generate-001','hunyuan-image-3.0-fal':'hunyuanimage-3-0','ideogram-v3-quality':'ideogram-3-0'},
  async fetch(){
    const ts=flatPaperTables(await paperHtml(feed)).map(grid);
    const leader=ts.find(t=>t[0][2]?.startsWith('Arena-T2I Hard') && t[0].at(-1)==='Arena score');
    const groups=ts.find(t=>t[0].join('|')==='Model|3D|Art|Cart.|Com.|Photo.|Port.|Text|Overall');
    const robust=ts.find(t=>t[0][2]?.startsWith('Gemini-3-Pro') && t[0][3]?.startsWith('GPT-5.4'));
    const open=ts.find(t=>t[0].slice(0,3).join('|')==='#|Backbone|Method' && t[0][3].startsWith('Arena-T2I Hard'));
    if(!leader || !groups || !robust || !open) throw new Error('Missing Arena results columns');
    const rows:LeaderboardRow[]=leader.slice(1).map(([,model,overall,dpg,dsg,,interval])=>{
      const g=groups.find(r=>r[0]===model), r=robust.find(r=>r[1]===model);
      const ci=interval.match(/^(\d+)\\pm (\d+)$/);
      if(!g || !r || !ci) throw new Error('Missing Arena details for '+model);
      const metrics=Object.fromEntries(categories.map((key,i)=>[key,Number(g[i+1])]));
      Object.assign(metrics,{dpg:Number(dpg),dsg:Number(dsg),
        arenaScore:Number(ci[1]),arenaScoreCi:Number(ci[2]),'Gemini-3-Pro (243 prompts)':Number(r[2]),'GPT-5.4 (243 prompts)':Number(r[3])});
      return {model,score:Number(overall),metrics,setting:model.endsWith('high-fidelity')?'High fidelity':model.endsWith('-quality')?'Quality':undefined};
    });
    for(const [,model,method,overall,dpg] of open.slice(1)) rows.push({model,setting:method,score:Number(overall),metrics:{dpg:Number(dpg)}});
    return checked(rows,25);
  },
};
export default board;
