// Read HHH scores by shot count and alignment dimension, companion measures and model configuration.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson, githubHeaders } from '../lib/util.ts';
const API = 'https://api.github.com/repos/google/BIG-bench/contents/bigbench/benchmark_tasks/hhh_alignment/results';
const hhhDimensions = ['Other','Harms','Helpfulness','Honesty'];
const hhhMeasureDefs: Record<string,{name:string;unit:string;better?:'higher'|'lower'}> = {
  WeightedLogProbabilities:{name:'Weighted log probabilities',unit:'score',better:'higher'}, WeightedProbabilities:{name:'Weighted probabilities',unit:'score',better:'higher'}, MacroF1:{name:'Macro F1',unit:'score',better:'higher'}, ExpectedCalibrationError:{name:'Expected calibration error',unit:'score',better:'lower'}, BrierScore:{name:'Brier score',unit:'brier',better:'lower'},
};
const hhhStats: Record<string,{name:string;unit:string;better?:'higher'|'lower'}> = {
  expectedCalibrationError: hhhMeasureDefs.ExpectedCalibrationError, brierScore: hhhMeasureDefs.BrierScore, normalizedAggregateScore:{name:'Normalized aggregate score',unit:'score',better:'higher'}, weightedLogProbabilities:hhhMeasureDefs.WeightedLogProbabilities, weightedProbabilities:hhhMeasureDefs.WeightedProbabilities, macroF1:hhhMeasureDefs.MacroF1, trainingSteps:{name:'Training steps',unit:'count'}, trainingBatchSize:{name:'Training batch size',unit:'count'}, nonEmbeddingParams:{name:'Non-embedding parameters',unit:'count'}, flopMatchedNonEmbeddingParams:{name:'FLOP-matched non-embedding parameters',unit:'count'},
};
for (const dimension of hhhDimensions) for (const [suffix, definition] of Object.entries(hhhMeasureDefs)) hhhStats[dimension + suffix] = { ...definition, name: `${dimension} ${definition.name.toLowerCase()}` };
const board: Leaderboard = {
 benchmark: 'combined-hhh-evals-anthropic', parts: {
  Other: { name: 'Other', group: 'Dimension' },
  Harms: { name: 'Harms', group: 'Dimension' },
  Helpfulness: { name: 'Helpfulness', group: 'Dimension' },
  Honesty: { name: 'Honesty', group: 'Dimension' },
}, url: 'https://github.com/google/BIG-bench/tree/main/bigbench/benchmark_tasks/hhh_alignment', feed: API,
 stats: hhhStats,
 terms: 'Official public BIG-bench results. The almanac credits the benchmark authors and links the source.',
 async fetch() {
  const files = await fetchJson<{name: string; download_url: string}[]>(API,{headers:githubHeaders()});
  const rows: LeaderboardRow[] = [];
  for (const f of files.filter(f => /^scores_.*\.json$/.test(f.name) && !/dummy|random|human/i.test(f.name))) {
   await new Promise(r => setTimeout(r, 1050));
   const d = await fetchJson<any>(f.download_url);
   for (const s of d.scores ?? []) {
    const score = s.score_dict?.multiple_choice_grade;
    if (s.subtask_description !== 'hhh_alignment' || typeof score !== 'number') continue;
    const metrics: Record<string, number> = {};
    const measureKeys:Record<string,string>={weighted_log_probabilities:'weightedLogProbabilities',
      weighted_probabilities:'weightedProbabilities',macro_f1:'macroF1',expected_calibration_error:'expectedCalibrationError',
      calibration_multiple_choice_brier_score:'brierScore',normalized_aggregate_score:'normalizedAggregateScore'};
    for (const item of d.scores) {
      if (item.number_of_shots!==s.number_of_shots) continue;
      const part=item.subtask_description?.startsWith('hhh_alignment:') ? item.subtask_description.split(':')[1] : '';
      if (!part && item!==s) continue;
      if (part && typeof item.score_dict?.multiple_choice_grade==='number') metrics[part]=item.score_dict.multiple_choice_grade*100;
      for(const [source,key] of Object.entries(measureKeys)) {
        const value=item.score_dict?.[source];
        if(typeof value==='number') metrics[part ? part+key[0].toUpperCase()+key.slice(1) : key]=value;
      }
    }
    for (const [source,key] of [['training_steps','trainingSteps'],['training_batch_size','trainingBatchSize'],
      ['non_embedding_params','nonEmbeddingParams'],['flop_matched_non_embedding_params','flopMatchedNonEmbeddingParams']]) {
      if (typeof d.model[source]==='number') metrics[key]=d.model[source];
    }
    if (typeof d.model.decoding_params?.temperature==='number') metrics.temperature=d.model.decoding_params.temperature;
    rows.push({model: `${d.model.model_family} ${d.model.model_name}`, score: score * 100, setting: `${s.number_of_shots}-shot`,
      params:typeof d.model.total_params==='number' ? d.model.total_params/1e9 : undefined,link:f.download_url,metrics});
   }
  }
  if (!rows.length) throw new Error('HHH aggregate results missing');
  return rows;
 },
};
export default board;
