// RBench (robot video generation, DAGroup-PKU). The Hugging Face Space DAGroup-PKU/RBench-Leaderboard (MIT)
// draws its default table from leaderboard.json in the Space repository: per model an "avg" (0 to 1) and
// per-task and per-embodiment scores, judged by a GPT model. leaderboard_qwen.json holds the same board
// judged by Qwen, which gives different scores and order, and is not read. The score is avg x 100 (the
// file mixes numbers and numeric strings).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://huggingface.co/spaces/DAGroup-PKU/RBench-Leaderboard/resolve/main/leaderboard.json';

const board: Leaderboard = {
  benchmark: 'rbench',
  url: 'https://huggingface.co/spaces/DAGroup-PKU/RBench-Leaderboard',
  feed: `${FEED} (avg)`,
  terms: 'File in a public Hugging Face Space licensed MIT.',
  aliases: {
    'Seedance 1.5 pro': 'seedance-v1-5-pro',
    // the board marks this row with "#"
    'Sora v2 Pro#': 'sora-2-pro',
    'Sora v1': 'sora',
    'Wan 2.5': 'wan-2-5-preview',
    'LTX-2': 'ltx-2-19b',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const data = await fetchJson<({model:string;avg:number|string}&Record<string,number|string>)[]>(FEED);
    return data.filter(r=>r.avg!==''&&Number.isFinite(Number(r.avg))).map(r=>{
      const metrics:Record<string,number>={};for(const [k,v]of Object.entries(r)){if(k==='model'||k==='avg'||v==='')continue;const n=Number(v);if(Number.isFinite(n))metrics[k]=n*100;}
      return {model:r.model,score:Number(r.avg)*100,setting:'GPT judge',metrics};
    });
  },
};
export default board;
