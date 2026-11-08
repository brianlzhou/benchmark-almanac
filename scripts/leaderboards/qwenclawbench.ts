// QwenClawBench v1.1: the page embeds the live MODELS array and displays mean_score times 100.
// Use that final score, not either grader component, and keep reasoning effort and grader metrics.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';
const FEED = 'https://skylenage-ai.github.io/QwenClawBench-Leaderboard/';
interface Entry { display_name: string; thinking_level?: string; mean_score: number; mean_auto_score: number; mean_llm_score: number; runs_per_task: number }
const board: Leaderboard = {
  benchmark: 'qwenclawbench', url: FEED, feed: FEED,
  terms: 'Public project leaderboard on GitHub Pages, subject to the project repository license and GitHub terms.',
  async fetch() {
    const html = await fetchText(FEED);
    if (!html.includes('qwenclawbench-v1.1-100')) throw new Error('QwenClawBench version changed');
    const entries = jsonAfter<Entry[]>(html, 'const MODELS =');
    return entries.filter(r => r.display_name && Number.isFinite(r.mean_score)).map(r => ({model:r.display_name,score:r.mean_score*100,setting:['v1.1',r.thinking_level].filter(Boolean).join(', '),metrics:{auto:r.mean_auto_score*100,llm:r.mean_llm_score*100,runsPerTask:r.runs_per_task}}));
  },
};
export default board;
