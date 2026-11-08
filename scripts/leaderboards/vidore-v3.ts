// ViDoRe V3 retrieval mean NDCG@10 on its native 0–1 score scale.
// Only the all-task mean is eligible. Public-only subsets remain excluded.
// Preserve model configurations, representation types, and ten task scores.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral, nextFlight } from '../lib/html.ts';

const FEED = "https://mteb-leaderboard-backend.hf.space/v1/benchmarks/ViDoRe%28v3%29/scores";
const board: Leaderboard = {
 benchmark: "vidore-v3", url: "https://mteb-leaderboard.hf.space/benchmark/ViDoRe%28v3%29", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {
type R={model:{name:string;modelType?:string};meanTask:number;scoresByTask:Record<string,number>;meanPublic?:number;meanPrivate?:number;experiments?:Record<string,unknown>;embeddingDim?:number};
const data=await fetchJson<{rows:R[]}>(FEED);const rows:LeaderboardRow[]=[];
for(const r of data.rows){if(!r.model?.name||!Number.isFinite(r.meanTask))continue;const metrics:Record<string,number>=Object.fromEntries(Object.entries(r.scoresByTask).filter(([,v])=>Number.isFinite(v)));if(Number.isFinite(r.meanPublic))metrics.public=r.meanPublic!;if(Number.isFinite(r.meanPrivate))metrics.private=r.meanPrivate!;
 rows.push({model:r.model.name,score:r.meanTask,setting:['NDCG@10',r.model.modelType,r.embeddingDim?'embedding dimensions '+r.embeddingDim:undefined,r.experiments?JSON.stringify(r.experiments):undefined].filter(Boolean).join('; '),metrics});}return rows;
 },
};
export default board;
