// ViDoRe V3 retrieval mean NDCG@10 on its native 0–1 score scale.
// Only the all-task mean is eligible. Public-only subsets remain excluded.
// Preserve model configurations, representation types, and ten task scores.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://mteb-leaderboard-backend.hf.space/v1/benchmarks/ViDoRe%28v3%29/scores";
const board: Leaderboard = {
 benchmark: "vidore-v3", parts: {
  Vidore3PharmaceuticalsRetrieval: { name: 'Pharmaceuticals', group: 'Domain' },
  Vidore3EnergyRetrieval: { name: 'Energy', group: 'Domain' },
  Vidore3IndustrialRetrieval: { name: 'Industrial', group: 'Domain' },
  Vidore3NuclearRetrieval: { name: 'Nuclear', group: 'Domain' },
  Vidore3FinanceEnRetrieval: { name: 'Finance English', group: 'Domain' },
  Vidore3TelecomRetrieval: { name: 'Telecom', group: 'Domain' },
  Vidore3FinanceFrRetrieval: { name: 'Finance French', group: 'Domain' },
  Vidore3ComputerScienceRetrieval: { name: 'Computer science', group: 'Domain' },
  Vidore3PhysicsRetrieval: { name: 'Physics', group: 'Domain' },
  public: { name: 'Public', group: 'Split' },
  private: { name: 'Private', group: 'Split' },
  Vidore3HrRetrieval: { name: 'Human resources', group: 'Domain' },
}, url: "https://mteb-leaderboard.hf.space/benchmark/ViDoRe%28v3%29", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {
type R={model:{name:string;modelType?:string;openWeights?:boolean;license?:string;opennessScore?:number;memoryUsageMb?:number};totalParamsB?:number;activeParamsB?:number;maxTokens?:number;zeroShotPct?:number;meanTask:number;scoresByTask:Record<string,number>;meanPublic?:number;meanPrivate?:number;experiments?:Record<string,unknown>;embeddingDim?:number};
const data=await fetchJson<{rows:R[]}>(FEED);const rows:LeaderboardRow[]=[];
for(const r of data.rows){if(!r.model?.name||!Number.isFinite(r.meanTask))continue;const metrics:Record<string,number>=Object.fromEntries(Object.entries(r.scoresByTask).filter(([,v])=>Number.isFinite(v)));if(Number.isFinite(r.meanPublic))metrics.public=r.meanPublic!;if(Number.isFinite(r.meanPrivate))metrics.private=r.meanPrivate!;
 for (const [key,value] of Object.entries({activeParamsB:r.activeParamsB, maxTokens:r.maxTokens, embeddingDim:r.embeddingDim,
   zeroShotPct:r.zeroShotPct, opennessScore:r.model.opennessScore, memoryUsageMb:r.model.memoryUsageMb})) {
   if (typeof value === 'number' && Number.isFinite(value) && value >= 0) metrics[key] = value;
 }
 rows.push({model:r.model.name,params:r.totalParamsB ?? undefined,open:r.model.openWeights ?? undefined,license:r.model.license || undefined,score:r.meanTask,setting:['NDCG@10',r.model.modelType,r.embeddingDim?'embedding dimensions '+r.embeddingDim:undefined,r.experiments?JSON.stringify(r.experiments):undefined].filter(Boolean).join('; '),metrics});}return rows;
 },
};
export default board;
