// MultiPL-E: BigCode's multilingual code leaderboard publishes Average score (pass@1, percent).
// Keep every submitted model and each language score. Throughput is a metric, not output tokens per task.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
const FEED = 'https://huggingface.co/spaces/bigcode/multilingual-code-evals/resolve/main/data/code_eval_board.csv';
const board: Leaderboard = {
  benchmark: 'multipl-e', url: 'https://huggingface.co/spaces/bigcode/multilingual-code-evals', feed: FEED,
  terms: 'Public BigCode Space results, subject to its repository license and Hugging Face terms.',
  async fetch() {
    const rows = parseCsv(await fetchText(FEED)).filter(r => r.Model && r['Average score']?.trim() && Number.isFinite(Number(r['Average score'])));
    if (!rows.length) throw new Error('No MultiPL-E scores');
    return rows.map(r => ({model: r.Model, score: Number(r['Average score']), metrics: Object.fromEntries(['humaneval-python','java','javascript','cpp','php','julia','d','lua','r','racket','rust','swift','Throughput (tokens/s)'].flatMap(k => r[k]?.trim() && Number.isFinite(Number(r[k])) ? [[k, Number(r[k])]] : []))}));
  },
};
export default board;
