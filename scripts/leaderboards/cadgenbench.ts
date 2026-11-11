// CADGenBench (Hugging Face). The HuggingAI4Engineering/cadgenbench-leaderboard Space reads results.jsonl from
// the public cadgenbench-submissions dataset and sorts completed submissions by aggregate_score (the mean CAD
// score over generation and editing tasks, 0 to 1, shown as a percentage). Most of the 800+ submissions are
// community agents with free-text names. Preserve every completed submission. Only verified Hugging Face
// baseline names identify foundation models. Other submissions remain unlisted systems.
// aggregate_score times 100 is the score, and the submission date is the row date.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const FEED = 'https://huggingface.co/datasets/HuggingAI4Engineering/cadgenbench-submissions/resolve/main/results.jsonl';

interface Submission {
  status?: string;
  submission_id?: string;
  cadgenbench_version?: string;
  validation_status?: string;
  validity_rate?: number;
  score_by_task_type?: Record<string, number>;
  submitter_name?: string;
  submission_name?: string;
  aggregate_score?: number | null;
  submitted_at?: string;
}

const board: Leaderboard = {
  benchmark: 'cadgenbench',
  url: 'https://huggingface.co/spaces/HuggingAI4Engineering/cadgenbench-leaderboard',
  feed: `${FEED} (aggregate_score, all completed submissions)`,
  terms: 'Hugging Face dataset HuggingAI4Engineering/cadgenbench-submissions, licensed CC BY 4.0.',
  aliases: {},
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const line of (await fetchText(FEED)).split('\n')) {
      if (!line.trim()) continue;
      const s = JSON.parse(line) as Submission;
      const m = s.submission_name?.match(/^(.+?) HF Baseline with (\w+)$/);
      if (s.status !== 'completed' || typeof s.aggregate_score !== 'number' || !Number.isFinite(s.aggregate_score)) continue;
      if (!m || s.submitter_name !== 'HuggingFace') {
        rows.push({model: `CADGenBench submission ${s.submission_id || rows.length}: ${s.submission_name || 'unnamed'}`, score: s.aggregate_score * 100, harness: s.submitter_name, setting: [s.cadgenbench_version && `version ${s.cadgenbench_version}`, s.validation_status].filter(Boolean).join('; '), metrics: {validityRate: (s.validity_rate ?? 0) * 100, ...Object.fromEntries(Object.entries(s.score_by_task_type ?? {}).map(([k,v])=>[k,v*100]))}, date: s.submitted_at?.slice(0, 10)});
        continue;
      }
      rows.push({ model: m[1], score: s.aggregate_score * 100, harness: `HF baseline (${m[2]})`, date: s.submitted_at?.slice(0, 10) });
    }
    return rows;
  },
};
export default board;
