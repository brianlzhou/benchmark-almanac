import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
const API = 'https://api.github.com/repos/google/BIG-bench/contents/bigbench/benchmark_tasks/hhh_alignment/results';
const board: Leaderboard = {
 benchmark: 'combined-hhh-evals-anthropic', url: 'https://github.com/google/BIG-bench/tree/main/bigbench/benchmark_tasks/hhh_alignment', feed: API,
 terms: 'Official public BIG-bench results. The almanac credits the benchmark authors and links the source.',
 async fetch() {
  const files = await fetchJson<{name: string; download_url: string}[]>(API);
  const rows: LeaderboardRow[] = [];
  for (const f of files.filter(f => /^scores_.*\.json$/.test(f.name) && !/dummy|random|human/i.test(f.name))) {
   await new Promise(r => setTimeout(r, 1050));
   const d = await fetchJson<any>(f.download_url);
   for (const s of d.scores ?? []) {
    const score = s.score_dict?.multiple_choice_grade;
    if (s.subtask_description !== 'hhh_alignment' || typeof score !== 'number') continue;
    const metrics: Record<string, number> = {};
    for (const part of d.scores) if (part.number_of_shots === s.number_of_shots && part.subtask_description?.startsWith('hhh_alignment:') && typeof part.score_dict?.multiple_choice_grade === 'number') metrics[part.subtask_description.split(':')[1]] = part.score_dict.multiple_choice_grade * 100;
    rows.push({model: `${d.model.model_family} ${d.model.model_name}`, score: score * 100, setting: `${s.number_of_shots}-shot`, metrics});
   }
  }
  if (!rows.length) throw new Error('HHH aggregate results missing');
  return rows;
 },
};
export default board;
