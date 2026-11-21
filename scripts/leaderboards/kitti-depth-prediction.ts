// KITTI depth prediction evaluates monocular depth estimates on the Eigen test split.
// The headline is the leaderboard's lower-is-better SILog error, with the other published errors as metrics.
import type {Leaderboard, LeaderboardRow} from './types.ts';
import {fetchText} from '../lib/util.ts';
import {tables} from '../lib/html.ts';
const FEED='https://www.cvlibs.net/datasets/kitti/eval_depth.php?benchmark=depth_prediction';
const board:Leaderboard={benchmark:'kitti-depth-prediction',url:FEED,feed:FEED,terms:'KITTI publishes this leaderboard for research evaluation. Results are credited to the KITTI Vision Benchmark Suite.',async fetch(){
 const table=tables(await fetchText(FEED)).find(t=>t.some(r=>r.some(c=>c.text==='Method'))); if(!table)throw new Error('KITTI depth table missing');
 const rows:LeaderboardRow[]=[];
 for(const c of table.slice(1)){if(!/^\d+$/.test(c[0]?.text||''))continue; const model=c[1]?.text.trim(); const vals=[c[4]?.text,c[5]?.text,c[6]?.text,c[7]?.text].map(Number); if(!model||vals.some(v=>!Number.isFinite(v)))throw new Error('KITTI depth row changed'); rows.push({model,score:vals[0],metrics:{sqErrorRel:vals[1],absErrorRel:vals[2],iRMSE:vals[3]},setting:'Eigen test split'});}
 if(rows.length<50)throw new Error(`KITTI depth table has ${rows.length} methods`); return rows;
}}; export default board;
