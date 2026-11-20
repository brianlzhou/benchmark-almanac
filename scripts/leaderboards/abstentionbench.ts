// AbstentionBench: the authors’ analysis averages dataset F1 values by model; this reproduces
// that macro average and converts fractions to percentages. Dataset coverage is explicit, since some
// configurations cover only a subset. Scenario and dataset scores and post-training variants are retained.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = "https://raw.githubusercontent.com/facebookresearch/AbstentionBench/main/analysis/abstention_performance.csv";
const board: Leaderboard = {
 benchmark: "abstentionbench",
 parts: {
   'scenario: answer unknown': { name: 'Answer unknown', group: 'Category' },
   'scenario: false premise': { name: 'False premise', group: 'Category' },
   'scenario: stale': { name: 'Stale', group: 'Category' },
   'scenario: subjective': { name: 'Subjective', group: 'Category' },
   'scenario: underspecified context': { name: 'Underspecified context', group: 'Category' },
   'scenario: underspecified intent': { name: 'Underspecified intent', group: 'Category' },
   'dataset: BB/Known unknowns': { name: 'BB/Known unknowns', group: 'Split' },
   'dataset: CoCoNot/Unknowns': { name: 'CoCoNot/Unknowns', group: 'Split' },
   'dataset: CoCoNot/Unsupported': { name: 'CoCoNot/Unsupported', group: 'Split' },
   'dataset: KUQ/Future unknowns': { name: 'KUQ/Future unknowns', group: 'Split' },
   'dataset: KUQ/Unsolved problems': { name: 'KUQ/Unsolved problems', group: 'Split' },
   'dataset: CoCoNot/False presumptions': { name: 'CoCoNot/False presumptions', group: 'Split' },
   'dataset: FalseQA': { name: 'FalseQA', group: 'Split' },
   'dataset: KUQ/False assumptions': { name: 'KUQ/False assumptions', group: 'Split' },
   'dataset: QAQA': { name: 'QAQA', group: 'Split' },
   'dataset: CoCoNot/Temporal': { name: 'CoCoNot/Temporal', group: 'Split' },
   'dataset: FreshQA': { name: 'FreshQA', group: 'Split' },
   'dataset: CoCoNot/Humanizing': { name: 'CoCoNot/Humanizing', group: 'Split' },
   'dataset: CoCoNot/Subjective': { name: 'CoCoNot/Subjective', group: 'Split' },
   'dataset: KUQ/Controversial': { name: 'KUQ/Controversial', group: 'Split' },
   'dataset: MoralChoice': { name: 'MoralChoice', group: 'Split' },
   'dataset: ALCUNA': { name: 'ALCUNA', group: 'Split' },
   'dataset: BB/Disambiguate': { name: 'BB/Disambiguate', group: 'Split' },
   'dataset: BBQ': { name: 'BBQ', group: 'Split' },
   'dataset: GPQA-Diamond': { name: 'GPQA-Diamond', group: 'Split' },
   'dataset: GSM8K': { name: 'GSM8K', group: 'Split' },
   'dataset: MMLU Math': { name: 'MMLU Math', group: 'Split' },
   'dataset: MediQ': { name: 'MediQ', group: 'Split' },
   'dataset: Musique': { name: 'Musique', group: 'Split' },
   'dataset: QASPER': { name: 'QASPER', group: 'Split' },
   'dataset: SQuAD 2.0': { name: 'SQuAD 2.0', group: 'Split' },
   'dataset: UMWP': { name: 'UMWP', group: 'Split' },
   'dataset: WorldSense': { name: 'WorldSense', group: 'Split' },
   'dataset: CoCoNot/Incomprehensible': { name: 'CoCoNot/Incomprehensible', group: 'Split' },
   'dataset: KUQ/Ambiguous': { name: 'KUQ/Ambiguous', group: 'Split' },
   'dataset: SituatedQA/Geo': { name: 'SituatedQA/Geo', group: 'Split' },
   'dataset: MMLU History': { name: 'MMLU History', group: 'Split' },
 },
 url: "https://github.com/facebookresearch/AbstentionBench",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  const data=parseCsv(await fetchText(FEED)).filter(r=>r.f1_score.trim()!=='' && Number.isFinite(Number(r.f1_score)));
  const groups=new Map<string,typeof data>();
  for(const r of data){const key=r.model_name_formatted+'|'+r.post_training_stage;groups.set(key,[...(groups.get(key)??[]),r]);}
  return [...groups.values()].map(rs=>{
    const mean=(records:typeof data,k:string)=>records.reduce((sum,r)=>sum+Number(r[k]),0)/records.length*100;
    const metrics:Record<string,number>={precision:mean(rs,'precision'),recall:mean(rs,'recall'),datasets:rs.length};
    for(const scenario of new Set(rs.map(r=>r.scenario_label)))metrics['scenario: '+scenario]=mean(rs.filter(r=>r.scenario_label===scenario),'f1_score');
    for(const r of rs)metrics['dataset: '+r.dataset_name_formatted]=Number(r.f1_score)*100;
    return {model:rs[0].model_name_formatted,score:mean(rs,'f1_score'),setting:`macro F1; ${rs.length} datasets`+(rs[0].post_training_stage!=='NA'?'; '+rs[0].post_training_stage:''),metrics};
  });
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
