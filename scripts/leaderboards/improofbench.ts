// IMProofBench complete-solution percentage from the official progress-grade chart. Pairwise subquestion scores measure something different; preserve grading coverage and framework metadata.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';

const FEED = "https://improofbench.math.ethz.ch/questions/leaderboard/";
const board: Leaderboard = {
 benchmark: "improofbench",
 url: "https://improofbench.math.ethz.ch/questions/leaderboard/",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
const html=await fetchText(FEED);const d=jsonAfter<{models:any[]}>(html,"createProgressGradeChart('progressGradeChart', ");
return d.models.filter(r=>r.percentages?.length===4).map(r=>({model:r.model_name.replace(/\s*\([^)]+\)$/,''),score:r.percentages[3],setting:r.model_name.match(/\(([^)]+)\)$/)?.[1]?.toLowerCase(),harness:r.framework_type,metrics:{totalQuestions:r.total_questions,observedQuestions:r.observed_questions,estimatedQuestions:r.estimated_questions,coverage:r.coverage_ratio,standardError:r.se_percentages?.[3]}}));
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
