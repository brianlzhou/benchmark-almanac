// Captioning with ground-truth event segments, micro-level CIDEr. Other averaging protocols stay metrics.
// Dense description predicts segments and has its own benchmark record.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { mdTables } from './big-bench-extra-hard.ts';
import { num } from '../lib/html.ts';
const feed='https://raw.githubusercontent.com/LuoweiZhou/YouCook2-Leaderboard/master/README.md';
const board:Leaderboard={benchmark:'youcook2',url:'https://github.com/LuoweiZhou/YouCook2-Leaderboard',feed,
 terms:'The authors publish these results in their public repository; the Almanac credits and links the original source.',
 async fetch():Promise<LeaderboardRow[]>{
  const s=(await fetchText(feed)).split('## Video Captioning')[1]?.split('## Dense Video Description')[0];
  if(!s)throw new Error('YouCook2 captioning section missing');
  const ts=mdTables(s);const t=ts[0];if(!t?.head.includes('C'))throw new Error('YouCook2 CIDEr table missing');
  const rows:LeaderboardRow[]=[];
  for(const r of t.rows){const score=num(r[t.head.indexOf('C')]);if(score===undefined)continue;
   const metrics:Record<string,number>={};for(const k of ['B@3','B@4','M']){const v=num(r[t.head.indexOf(k)]);if(v!==undefined)metrics[k]=v;}
   for(const [i,key]of [[1,'macroCIDEr'],[2,'paragraphCIDEr']] as const){const other=ts[i]?.rows.find(x=>x[0]===r[0]);if(other){const v=num(other[ts[i].head.indexOf('C')]);if(v!==undefined)metrics[key]=v;}}
   rows.push({model:r[0],score,setting:'micro-level captioning; ground-truth segments',metrics});
  }
  if(!rows.length)throw new Error('No YouCook2 micro CIDEr rows');return rows;
 }
};
export default board;
