// The ViGiL3D authors compare seven published baselines by accuracy with ground-truth masks. Their paper gives overall results and a breakdown by grounding difficulty.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { tables } from '../lib/html.ts';

const feed = "https://arxiv.org/html/2501.01366v2";


const board: Leaderboard = {
  benchmark: "vigil3d", static: 'paper',
  url: "https://www.codabench.org/competitions/9829/",
  feed,
  stats: {
    'Acc@25': {name: 'Accuracy at 25 IoU', unit: '%', better: 'higher', note: 'Accuracy using ground-truth or predicted boxes at an intersection over union threshold of 0.25.'},
    'Acc@50': {name: 'Accuracy at 50 IoU', unit: '%', better: 'higher', note: 'Accuracy using ground-truth or predicted boxes at an intersection over union threshold of 0.50.'},
    'F1/GT': {name: 'F1 with ground-truth boxes', unit: '%', better: 'higher'},
    'F1@25': {name: 'F1 at 25 IoU', unit: '%', better: 'higher'},
    'F1@50': {name: 'F1 at 50 IoU', unit: '%', better: 'higher'},
    latency: {name: 'Inference time', unit: 'seconds', better: 'lower'},
  },
  terms: "The authors publish baseline scores in their arXiv paper. arXiv permits HTML access with a 15-second crawl delay. Codabench serves a challenge.",
  async fetch(){
    const all=tables(await paperHtml(feed)).map(t=>t.map(r=>r.map(c=>c.text)));
    const scores=all.find(t=>t[0].includes('ViGiL3D') && t[1]?.includes('Acc/GT'));
    const parts=all.find(t=>t[1]?.includes('Overall') && t[1].includes('CG') && t[1].includes('NFN'));
    const methodTable=all.find(t=>t[0]?.includes('# Parameters'));
    if(!scores || !parts || !methodTable || scores.length<9) throw new Error('Missing author baseline tables');
    const iTime=methodTable[0].findIndex(h=>/^Inference Time/i.test(h));
    const methodInfo=new Map(methodTable.slice(1).map(r=>{
      const size=r[1]?.match(/^(\d+(?:\.\d+)?)([MB])/i);
      const tm=iTime>=0 ? r[iTime]?.match(/^(\d+(?:\.\d+)?)\s*(m|s)?/i) : null;
      const latency=tm ? Number(tm[1])*(tm[2]?.toLowerCase()==='m'?60:1) : undefined;
      return [r[0], {params:size ? Number(size[1])/(size[2].toUpperCase()==='M'?1000:1) : undefined, latency}];
    }));
    board.parts=Object.fromEntries(parts[1].slice(2).map(k=>[k,k]));
    return scores.slice(2).map(r=>{
      const model=r[0],score=Number(r[1]);const breakdown=parts.find(p=>p[0]===model);
      if(!breakdown || Number(breakdown[1])!==score) throw new Error('Mismatched overall accuracy');
      const metrics:Record<string,number>={};
      for(let i=2;i<=6;i++) metrics[scores[1][i]]=Number(r[i]);
      for(let i=2;i<parts[1].length;i++) metrics[parts[1][i]]=Number(breakdown[i]);
      const info=methodInfo.get(model);
      if(info?.latency!==undefined) metrics.latency=info.latency;
      if(!Object.values(metrics).every(Number.isFinite)) throw new Error('Invalid ViGiL3D result');
      return {model,score,params:info?.params,metrics};
    });
  },
};
export default board;
