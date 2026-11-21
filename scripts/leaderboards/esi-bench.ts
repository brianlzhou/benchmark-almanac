// The source reports no overall score. The headline is the plain mean of the 29 parts, computed by this importer.
// ESI-Bench tests spatial reasoning through interaction. Table 2 reports subcategory accuracy by observation paradigm.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
const url='https://arxiv.org/html/2605.18746';
const names=["View Hallucination","Partial Occlusion","Material Transparency","Rigid Containment","Liquid Volume","Deformable","Inclined Plane","Stacking & Stability","Reflection Authoring","Spatial Relations","Correspondence","Linear Alignment","Geometric Configuration","Physical Contact","Dimensional Size","Spatial Distance","Connectivity","Traversable Passage","Regional Boundary","Long-Term Navigation","Counting w Occlusion","Spatial Segmentation","Merged Observation","Category Ambiguity","Structural Enclosure","Illumination Variability","Unobserved Change","Agent Observation","Action Order Inference"];
const settings=['Passive Single','Passive Multiple','Active Multiple','GT Passive'];
const board:Leaderboard={
  benchmark:'esi-bench',static:'paper',url,feed:url,terms:PAPER_TERMS,
  headline:'The paper reports no overall accuracy. The headline averages the 29 subcategory accuracies.',
  parts:Object.fromEntries(names.map(n=>[n,n])),
  async fetch(){
    const t=paperTables(await paperHtml(url)).map(grid).find(t=>t[2]?.join('|')===['Category / Subcategory',...Array(5).fill(settings).flat()].join('|') &&
      t[1]?.slice(1,17).join('|')===['GPT-5','Gemini 3.1','VGGT + Gemini','GT 3D + Gemini'].flatMap(m=>Array(4).fill(m)).join('|'));
    if(!t) throw new Error('Missing ESI-Bench results');
    const tasks=t.slice(3).filter(r=>!r.every(c=>c===r[0]));
    if(tasks.map(r=>r[0]).join('|')!==names.join('|')) throw new Error('Changed ESI-Bench subcategories');
    const rows:LeaderboardRow[]=[];
    for(let col=1;col<=16;col++){
      const metrics=Object.fromEntries(tasks.map(row=>{
        if(!/^\d+(?:\.\d+)?$/.test(row[col])) throw new Error('Missing subcategory accuracy');
        return [row[0],Number(row[col])];
      }));
      const label=t[1][col], augmented=label.includes(' + Gemini');
      rows.push({model:augmented?'Gemini 3.1':label,...(augmented?{harness:label.split(' + ')[0]}:{}),
        setting:t[2][col],score:Object.values(metrics).reduce((a,b)=>a+b,0)/names.length,metrics});
    }
    return checked(rows,16);
  },
};
export default board;
