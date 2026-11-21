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
    taskAmazonCounterfactualClassification: { name: 'AmazonCounterfactualClassification', group: 'Task' }, taskAmazonPolarityClassification: { name: 'AmazonPolarityClassification', group: 'Task' }, taskAmazonReviewsClassification: { name: 'AmazonReviewsClassification', group: 'Task' }, taskArguAna: { name: 'ArguAna', group: 'Task' }, taskArxivClusteringP2P: { name: 'ArxivClusteringP2P', group: 'Task' }, taskArxivClusteringS2S: { name: 'ArxivClusteringS2S', group: 'Task' }, taskAskUbuntuDupQuestions: { name: 'AskUbuntuDupQuestions', group: 'Task' }, taskBIOSSES: { name: 'BIOSSES', group: 'Task' }, taskBanking77Classification: { name: 'Banking77Classification', group: 'Task' }, taskBiorxivClusteringP2P: { name: 'BiorxivClusteringP2P', group: 'Task' }, taskBiorxivClusteringS2S: { name: 'BiorxivClusteringS2S', group: 'Task' }, taskCQADupstackRetrieval: { name: 'CQADupstackRetrieval', group: 'Task' }, taskClimateFEVER: { name: 'ClimateFEVER', group: 'Task' }, taskDBPedia: { name: 'DBPedia', group: 'Task' }, taskEmotionClassification: { name: 'EmotionClassification', group: 'Task' }, taskFEVER: { name: 'FEVER', group: 'Task' }, taskFiQA2018: { name: 'FiQA2018', group: 'Task' }, taskHotpotQA: { name: 'HotpotQA', group: 'Task' }, taskImdbClassification: { name: 'ImdbClassification', group: 'Task' }, taskMSMARCO: { name: 'MSMARCO', group: 'Task' }, taskMTOPDomainClassification: { name: 'MTOPDomainClassification', group: 'Task' }, taskMTOPIntentClassification: { name: 'MTOPIntentClassification', group: 'Task' }, taskMassiveIntentClassification: { name: 'MassiveIntentClassification', group: 'Task' }, taskMassiveScenarioClassification: { name: 'MassiveScenarioClassification', group: 'Task' }, taskMedrxivClusteringP2P: { name: 'MedrxivClusteringP2P', group: 'Task' }, taskMedrxivClusteringS2S: { name: 'MedrxivClusteringS2S', group: 'Task' }, taskMindSmallReranking: { name: 'MindSmallReranking', group: 'Task' }, taskNFCorpus: { name: 'NFCorpus', group: 'Task' }, taskNQ: { name: 'NQ', group: 'Task' }, taskQuoraRetrieval: { name: 'QuoraRetrieval', group: 'Task' }, taskRedditClustering: { name: 'RedditClustering', group: 'Task' }, taskRedditClusteringP2P: { name: 'RedditClusteringP2P', group: 'Task' }, taskSCIDOCS: { name: 'SCIDOCS', group: 'Task' }, 'taskSICK-R': { name: 'SICK-R', group: 'Task' }, taskSTS12: { name: 'STS12', group: 'Task' }, taskSTS13: { name: 'STS13', group: 'Task' }, taskSTS14: { name: 'STS14', group: 'Task' }, taskSTS15: { name: 'STS15', group: 'Task' }, taskSTS16: { name: 'STS16', group: 'Task' }, taskSTS17: { name: 'STS17', group: 'Task' }, taskSTS22: { name: 'STS22', group: 'Task' }, taskSTSBenchmark: { name: 'STSBenchmark', group: 'Task' }, taskSciDocsRR: { name: 'SciDocsRR', group: 'Task' }, taskSciFact: { name: 'SciFact', group: 'Task' }, taskSprintDuplicateQuestions: { name: 'SprintDuplicateQuestions', group: 'Task' }, taskStackExchangeClustering: { name: 'StackExchangeClustering', group: 'Task' }, taskStackExchangeClusteringP2P: { name: 'StackExchangeClusteringP2P', group: 'Task' }, taskStackOverflowDupQuestions: { name: 'StackOverflowDupQuestions', group: 'Task' }, taskSummEval: { name: 'SummEval', group: 'Task' }, taskTRECCOVID: { name: 'TRECCOVID', group: 'Task' }, taskTouche2020: { name: 'Touche2020', group: 'Task' }, taskToxicConversationsClassification: { name: 'ToxicConversationsClassification', group: 'Task' }, taskTweetSentimentExtractionClassification: { name: 'TweetSentimentExtractionClassification', group: 'Task' }, taskTwentyNewsgroupsClustering: { name: 'TwentyNewsgroupsClustering', group: 'Task' }, taskTwitterSemEval2015: { name: 'TwitterSemEval2015', group: 'Task' }, taskTwitterURLCorpus: { name: 'TwitterURLCorpus', group: 'Task' },
  },
  stats: { zeroShotPct: { name: 'Zero-shot percentage', unit: '%', better: 'higher' }, embeddingDim: { name: 'Embedding dimensions', unit: 'count' }, maxTokens: { name: 'Maximum tokens', unit: 'tokens' }, meanTaskType: { name: 'Mean task-type score', unit: '%', better: 'higher' }, activeParamsB: { name: 'Active parameters', unit: 'billions' }, memoryUsageMb: { name: 'Memory usage', unit: 'count', note: 'Memory usage in megabytes.' } },
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
