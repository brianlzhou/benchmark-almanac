// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// Argus Inspection tests visual recognition and commonsense reasoning. Appendix Tables 4 and 5 report
// the basic and deceptive overall scores and ten domain scores at six decimal places.
import type { Leaderboard, BoardPart } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
const url='https://arxiv.org/html/2506.14805';
const groups=['Basic','Deceptive'];
const domains=['Fire and Combustion','Food and Water','Electricity and Chemical','Emergency and Medical','Weather and Nature','Road Safety','Outdoor Protection','Indoor Security','Wildlife and Environment','Relationships and Survive'];
const parts:Record<string,BoardPart>={};
for (const group of groups) {
  domains.forEach((name, i) => { parts[group + String(i + 1).padStart(2, '0')] = { name, group, unit: 'score' }; });
  parts[group + 'Overall'] = { name: 'Overall', group, unit: 'score' };
}
const board:Leaderboard={
  benchmark:'argus-inspection',static:'paper',url,feed:url,terms:PAPER_TERMS,parts,
  headline:'The authors give separate overall scores for basic and deceptive questions, so this is their plain mean.',
  aliases:{'Seed-1.5-VL-250428':'seed-1-5-vl','Gemini-2.5-Flash-Preview-05-20':'gemini-2-5-flash-may-2025','Gemini-2.5-Pro-Preview-05-06':'gemini-2-5-pro-may-2025',
    'GPT-4o-2024-11-20':'gpt-4o-nov-2024','InternVL-2-5-78b':'internvl2-5-78b','LLaVA-NeXT-34b':'llava-v1-6-34b'},
  async fetch(){
    const ts=paperTables(await paperHtml(url)).map(grid);
    const taxonomy=ts.find(t=>t[0]?.join('|')==='Domain|Topic|Vol');
    const scores=ts.filter(t=>t[0]?.join('|')==='MLLMs|01|02|03|04|05|06|07|08|09|10|Overall');
    if(!taxonomy || taxonomy.length!==12 || scores.length!==2) throw new Error('Missing Argus taxonomy or score tables');
    const byModel=new Map<string,Record<string,number>>();
    scores.forEach((t,i)=>{
      for(const [model,...cells] of t.slice(1)){
        if (cells.length!==11) throw new Error('Missing domain scores');
        const metrics=byModel.get(model)??{};
        cells.forEach((v,j)=>{
          if(!/^\d+\.\d+$/.test(v)) throw new Error('Invalid domain score for '+model);
          const key=groups[i]+(j===10?'Overall':t[0][j+1]);
          if(key in metrics) throw new Error('Duplicate score for '+model);
          parts[key]={group:groups[i],name:j===10?'Overall':taxonomy[j+1][0],unit:'score'};
          metrics[key]=Number(v);
        });
        byModel.set(model,metrics);
      }
    });
    const rows=[...byModel].filter(([,m])=>Number.isFinite(m.BasicOverall)&&Number.isFinite(m.DeceptiveOverall))
      .map(([model,metrics])=>({model,metrics,score:(metrics.BasicOverall+metrics.DeceptiveOverall)/2}));
    return checked(rows,26);
  },
};
export default board;
