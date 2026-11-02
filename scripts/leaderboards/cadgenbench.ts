// CADGenBench (Hugging Face). The HuggingAI4Engineering/cadgenbench-leaderboard Space reads results.jsonl from
// the public cadgenbench-submissions dataset and sorts completed submissions by aggregate_score (the mean CAD
// score over generation and editing tasks, 0 to 1, shown as a percentage). Most of the 800+ submissions are
// community agents with free-text names that do not say which model ran, so only Hugging Face's own model
// baselines ("Claude Opus 4.8 HF Baseline with Build123d") are read: the model is the name before
// "HF Baseline" and the CAD library becomes the harness. aggregate_score times 100 is the score, and the
// submission date is the row date.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const FEED = 'https://huggingface.co/datasets/HuggingAI4Engineering/cadgenbench-submissions/resolve/main/results.jsonl';

interface Submission {
  status?: string;
  submitter_name?: string;
  submission_name?: string;
  aggregate_score?: number | null;
  submitted_at?: string;
}

const board: Leaderboard = {
  benchmark: 'cadgenbench',
  url: 'https://huggingface.co/spaces/HuggingAI4Engineering/cadgenbench-leaderboard',
  feed: `${FEED} (aggregate_score, Hugging Face baselines)`,
  terms: 'Hugging Face dataset HuggingAI4Engineering/cadgenbench-submissions, licensed CC BY 4.0.',
  aliases: {},
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const line of (await fetchText(FEED)).split('\n')) {
      if (!line.trim()) continue;
      const s = JSON.parse(line) as Submission;
      const m = s.submission_name?.match(/^(.+?) HF Baseline with (\w+)$/);
      if (!m || s.status !== 'completed' || s.submitter_name !== 'HuggingFace' || typeof s.aggregate_score !== 'number') continue;
      rows.push({ model: m[1], score: s.aggregate_score * 100, harness: `HF baseline (${m[2]})`, date: s.submitted_at?.slice(0, 10) });
    }
    return rows;
  },
};
export default board;
