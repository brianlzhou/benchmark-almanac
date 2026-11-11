// The official repository links AGI-Eval evaluation 61. Its read-only detail API includes the ranking.
// Scores are accuracy fractions. Keep ambiguous undated API model labels unlisted.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
const FEED = 'https://agi-eval.cn/commWebApi/evaluation/detail';
const board: Leaderboard = {
 benchmark: 'ugmathbench', url: 'https://agi-eval.cn/evaluation/detail?id=61', feed: FEED + ' (POST id=61)',
 terms: 'Public benchmark-author-linked AGI-Eval results. The almanac credits UGMathBench and links the source.',
 aliases: {'qwen3-235b-thinking':'qwen3-235b-a22b','qwen3-32b-thinking':'qwen3-32b','gemini2.5-pro-preview-0325':'gemini-2-5-pro-mar-2025','claude3.7-sonnet':'claude-3-7-sonnet','gpt4o-0806':'gpt-4o-aug-2024'},
 async fetch() {
  const d = JSON.parse(await fetchText(FEED, {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id:61})}));
  if (d.rescode !== 0 || d.data?.name !== 'UGMathBench' || !d.data.evaluationModelList?.length) throw new Error('UGMathBench ranking missing');
  return d.data.evaluationModelList.map((r: {modelName:string;score:string;evalTime:string}) => {
   const score = Number(r.score); if (!Number.isFinite(score)) throw new Error('Invalid UGMathBench score');
   const effort = r.modelName.match(/^(o[34]-mini)-medium$/);
   return {model: effort ? effort[1] : r.modelName === 'gpt4o-mini' ? 'GPT-4o mini (snapshot unspecified)' : r.modelName,
    setting: effort ? 'medium' : r.modelName.endsWith('-thinking') ? 'thinking' : undefined, score: score*100,date:r.evalTime};
  });
 },
};
export default board;
