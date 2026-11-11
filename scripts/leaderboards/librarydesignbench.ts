// LibraryDesignBench scores pass-rate squared times simplicity, averaged with equal task weights.
// The source fractions become 0-100 scores. Cost is mean dollars to design one library task;
// implementation-problem cost remains a separate metric. Production/no-library references are excluded.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://ldbench.com/data/site.json";
const board: Leaderboard = {
 benchmark: "librarydesignbench", url: "https://ldbench.com", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',
 chart:{title:'Library quality vs. design cost',x:{key:'cost',label:'Mean design cost per library',unit:'$',better:'lower'},y:{key:'score',label:'Library quality',unit:'score',better:'higher'}},
 async fetch() {
const d=await fetchJson<any>(FEED);return d.design.rows.map((r:any)=>({model:r.model==='DeepSeek V4 Pro'?r.model+' [snapshot unspecified]':r.model,harness:r.harness,score:r.score.mean*100,cost:r.libraryCost?.mean,setting:'Library design; equal task weights',metrics:{cost:r.libraryCost?.mean,problemCost:r.problemCost?.mean,scoreLow:r.score.lo*100,scoreHigh:r.score.hi*100,scoreSE:r.score.se*100,passRate:r.passRate.mean*100,simplicity:r.simplicity.mean,complete:r.cells.complete,total:r.cells.total}}));
 },
};
export default board;
