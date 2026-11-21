// The ViGiL3D authors compare seven published baselines by accuracy with ground-truth masks. Their paper gives overall results and a breakdown by grounding difficulty.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const feed = "https://arxiv.org/html/2501.01366v2";


const board: Leaderboard = {
  benchmark: "vigil3d", static: 'paper',
  url: "https://www.codabench.org/competitions/9829/",
  feed,
  terms: "The authors publish baseline scores in their arXiv paper. arXiv permits HTML access with a 15-second crawl delay. Codabench serves a challenge.",
  async fetch(){
    const all=tables(await fetchText(feed)).map(t=>t.map(r=>r.map(c=>c.text)));
    const scores=all.find(t=>t[0].includes('ViGiL3D') && t[1]?.includes('Acc/GT'));
    const parts=all.find(t=>t[1]?.includes('Overall') && t[1].includes('CG') && t[1].includes('NFN'));
    if(!scores || !parts || scores.length<9) throw new Error('Missing author baseline tables');
    board.parts=Object.fromEntries(parts[1].slice(2).map(k=>[k,k]));
    return scores.slice(2).map(r=>{
      const model=r[0],score=Number(r[1]);const breakdown=parts.find(p=>p[0]===model);
      if(!breakdown || Number(breakdown[1])!==score) throw new Error('Mismatched overall accuracy');
      const metrics:Record<string,number>={};
      for(let i=2;i<=6;i++) metrics[scores[1][i]]=Number(r[i]);
      for(let i=2;i<parts[1].length;i++) metrics[parts[1][i]]=Number(breakdown[i]);
      if(!Object.values(metrics).every(Number.isFinite)) throw new Error('Invalid ViGiL3D result');
      return {model,score,metrics};
    });
  },
};
export default board;
