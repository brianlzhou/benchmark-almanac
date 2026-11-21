// FreiHAND tests 3D hand pose estimates from a single image. OpenCodePapers ranks models by
// Procrustes-aligned mean per-joint position error in millimeters and includes auxiliary mesh metrics.
import type { Leaderboard } from './types.ts';
import { tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const url='https://opencodepapers-b7572d.gitlab.io/benchmarks/3d-hand-pose-estimation-on-freihand.html';
const board:Leaderboard={
  benchmark:'freihand',url,feed:url,terms:'OpenCodePapers publishes the comparison at https://opencodepapers-b7572d.gitlab.io/benchmarks/3d-hand-pose-estimation-on-freihand.html.',
  parts:{vertex:{name:'PA-MPVPE',unit:'score',better:'lower',note:'Aligned mean vertex position error in millimeters.'},
    f5:{name:'PA-F@5mm',unit:'score',better:'higher'},f15:{name:'PA-F@15mm',unit:'score',better:'higher'}},
  async fetch(){
    const t=tables(await fetchText(url)).find(t=>t[0]?.map(c=>c.text.replace(' ↕','')).join('|')===
      'Paper|Code|PA-MPJPE|PA-MPVPE|PA-F@5mm|PA-F@15mm|ModelName|ReleaseDate');
    if(!t) throw new Error('Missing FreiHAND pose error table');
    const rows=t.slice(1).filter(r=>r[2].text && !/et al\.$/i.test(r[6].text)).map(r=>{
      const [score,vertex,f5,f15]=r.slice(2,6).map(c=>c.text);
      if(!r[6].text || [score,vertex,f5,f15].some(v=>v && !/^\d+(?:\.\d+)?$/.test(v))) throw new Error('Invalid FreiHAND result');
      const metrics:Record<string,number>={};
      if(vertex) metrics.vertex=Number(vertex);
      if(f5) metrics.f5=Number(f5);
      if(f15) metrics.f15=Number(f15);
      const paper=r[0].html.match(/href="([^"]+)"/)?.[1];
      return {model:r[6].text,score:Number(score),metrics,link:paper?new URL(paper,url).href:undefined};
    });
    return checked(rows,32);
  },
};
export default board;
