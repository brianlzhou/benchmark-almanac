// MTEB: the original English v1 suite, matching the catalog’s original benchmark.
// The API publishes meanTask as its headline mean. Fractions become percentages.
// The API also publishes model metadata, task-type aggregates and individual task scores.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://mteb-leaderboard-backend.hf.space/v1/benchmarks/MTEB%28eng%2C%20v1%29/scores";
const board: Leaderboard = {
  benchmark: "mteb",
  parts: {
    PairClassification: { name: 'Pair classification', group: 'Task type' },
    Classification: { name: 'Classification', group: 'Task type' },
    Clustering: { name: 'Clustering', group: 'Task type' },
    Retrieval: { name: 'Retrieval', group: 'Task type' },
    Reranking: { name: 'Reranking', group: 'Task type' },
    Summarization: { name: 'Summarization', group: 'Task type' },
    STS: { name: 'Semantic textual similarity', group: 'Task type' },
  },
  url: "https://mteb-leaderboard-backend.hf.space/v1/benchmarks/MTEB%28eng%2C%20v1%29/scores",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    type R = { model: { name:string, openWeights?:boolean, license?:string, memoryUsageMb?:number },
      meanTask:number|null, meanTaskType:number|null, scoresByTaskType:Record<string,number>, scoresByTask:Record<string,number>,
      zeroShotPct:number|null, activeParamsB:number|null, totalParamsB:number|null, embeddingDim:number|null, maxTokens:number|null };
    const d=await fetchJson<{benchmarkName:string,rows:R[]}>(FEED);
    if(d.benchmarkName!=='MTEB(eng, v1)')throw new Error('MTEB suite changed');
    return d.rows.filter(r=>typeof r.meanTask==='number').map(r => {
      const metrics = Object.fromEntries(Object.entries(r.scoresByTaskType).filter(([,v])=>typeof v==='number').map(([k,v])=>[k,v*100]));
      for (const [name,value] of Object.entries(r.scoresByTask)) {
        if (typeof value !== 'number') continue;
        const key = 'task' + name;
        board.parts![key] = { name, group: 'Task' };
        metrics[key] = value * 100;
      }
      for (const key of ['zeroShotPct','activeParamsB','embeddingDim','maxTokens'] as const) {
        if (typeof r[key] === 'number') metrics[key] = r[key];
      }
      if (typeof r.meanTaskType === 'number') metrics.meanTaskType = r.meanTaskType * 100;
      if (typeof r.model.memoryUsageMb === 'number') metrics.memoryUsageMb = r.model.memoryUsageMb;
      return {model:r.model.name,score:r.meanTask!*100,metrics,params:r.totalParamsB ?? undefined,
        open:r.model.openWeights ?? undefined,license:r.model.license ?? undefined};
    });
  },
};

// The shared resolver otherwise guesses the newest snapshot for an undated family name.
// Preserve these board labels as unlisted entries until the source identifies a snapshot.
const readRows = board.fetch;
board.fetch = async () => (await readRows()).map(r => {
  const name = r.model.replace(/^[\w.-]+\//, '').replace(/[ _]/g, '-');
  const ambiguous = /^(?:gpt-4o|gpt-4|gpt-4-turbo|gpt-3[.-]5-turbo|claude-3[.-]5-sonnet|claude-sonnet-3[.-]5|deepseek-v3|deepseek-r1|gemini-(?:1[.-]5|2[.-]0|2[.-]5)-(?:pro|flash)(?:-preview|-exp|-thinking|-thinking-exp)?)$/i.test(name);
  return ambiguous ? {...r, model: `${r.model} (snapshot unspecified)`} : r;
});

export default board;
