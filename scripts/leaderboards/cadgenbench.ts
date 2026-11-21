// CADGenBench (Hugging Face). The HuggingAI4Engineering/cadgenbench-leaderboard Space reads results.jsonl from
// the public cadgenbench-submissions dataset and sorts completed submissions by aggregate_score (the mean CAD
// score over generation and editing tasks, 0 to 1, shown as a percentage). Most of the 800+ submissions are
// community agents with free-text names. Preserve every completed submission. Only verified Hugging Face
// baseline names identify foundation models. Other submissions remain unlisted systems.
// Read task scores and coverage for baselines and community submissions, with validation marks and artifact links.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const FEED = 'https://huggingface.co/datasets/HuggingAI4Engineering/cadgenbench-submissions/resolve/main/results.jsonl';

interface Submission {
  status?: string;
  submission_id?: string;
  cadgenbench_version?: string;
  validation_status?: string;
  submission_blob_url?: string;
  per_task_scores?: Record<string, Record<string, number>>;
  validity_rate?: number;
  score_by_task_type?: Record<string, number>;
  submitter_name?: string;
  submission_name?: string;
  aggregate_score?: number | null;
  submitted_at?: string;
}

const board: Leaderboard = {
  benchmark: 'cadgenbench',
  verified: 'validated by CADGenBench',
  parts: {
    generation: { name: 'Generation', group: 'Task type' },
    editing: { name: 'Editing', group: 'Task type' },
  },
  url: 'https://huggingface.co/spaces/HuggingAI4Engineering/cadgenbench-leaderboard',
  feed: `${FEED} (aggregate_score, all completed submissions)`,
  terms: 'Hugging Face dataset HuggingAI4Engineering/cadgenbench-submissions, licensed CC BY 4.0.',
  stats: { validityRate: { name: 'Validity rate', unit: '%', better: 'higher' } },
  aliases: {},
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const line of (await fetchText(FEED)).split('\n')) {
      if (!line.trim()) continue;
      const s = JSON.parse(line) as Submission;
      const m = s.submission_name?.match(/^(.+?) HF Baseline with (\w+)$/);
      if (s.status !== 'completed' || typeof s.aggregate_score !== 'number' || !Number.isFinite(s.aggregate_score)) continue;
      const baseline = m && s.submitter_name === 'HuggingFace';
      const metrics: Record<string, number> = {};
      if (typeof s.validity_rate === 'number') metrics.validityRate = 100 * s.validity_rate;
      for (const [task, score] of Object.entries(s.score_by_task_type ?? {})) metrics[task] = 100 * score;
      for (const [task, detail] of Object.entries(s.per_task_scores ?? {})) {
        const columns = { validity_rate: 'ValidityRate', n_samples: 'Samples', n_valid: 'Valid', n_invalid: 'Invalid', n_missing: 'Missing' };
        for (const [key, suffix] of Object.entries(columns)) {
          if (typeof detail[key] === 'number') metrics[task + suffix] = detail[key] * (key === 'validity_rate' ? 100 : 1);
        }
      }
      rows.push({
        model: baseline ? m[1] : `CADGenBench submission ${s.submission_id || rows.length}: ${s.submission_name || 'unnamed'}`,
        harness: baseline ? `HF baseline (${m[2]})` : s.submitter_name,
        score: s.aggregate_score * 100, metrics, date: s.submitted_at?.slice(0, 10),
        setting: [s.cadgenbench_version && `version ${s.cadgenbench_version}`, s.validation_status].filter(Boolean).join('; '),
        verified: s.validation_status === 'validated' ? true : s.validation_status === 'unvalidated' ? false : undefined,
        submitter: s.submitter_name, link: s.submission_blob_url?.startsWith('https://') ? s.submission_blob_url : undefined,
      });
    }
    return rows;
  },
};
export default board;
