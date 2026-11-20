// MultiPL-E: BigCode's multilingual code leaderboard publishes Average score (pass@1, percent).
// Keep every submitted model and each language score. Throughput is a metric, not output tokens per task.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
const FEED = 'https://huggingface.co/spaces/bigcode/multilingual-code-evals/resolve/main/data/code_eval_board.csv';
const board: Leaderboard = {
  benchmark: 'multipl-e', parts: {
  'humaneval-python': { name: 'Python', group: 'Language' },
  java: { name: 'Java', group: 'Language' },
  javascript: { name: 'JavaScript', group: 'Language' },
  cpp: { name: 'C++', group: 'Language' },
  php: { name: 'PHP', group: 'Language' },
  julia: { name: 'Julia', group: 'Language' },
  d: { name: 'D', group: 'Language' },
  lua: { name: 'Lua', group: 'Language' },
  r: { name: 'R', group: 'Language' },
  racket: { name: 'Racket', group: 'Language' },
  rust: { name: 'Rust', group: 'Language' },
  swift: { name: 'Swift', group: 'Language' },
}, url: 'https://huggingface.co/spaces/bigcode/multilingual-code-evals', feed: FEED,
  terms: 'Public BigCode Space results, subject to its repository license and Hugging Face terms.',
  async fetch() {
    const rows = parseCsv(await fetchText(FEED)).filter(r => r.Model && r['Average score']?.trim() && Number.isFinite(Number(r['Average score'])));
    if (!rows.length) throw new Error('No MultiPL-E scores');
    return rows.map(r => ({model: r.Model, score: Number(r['Average score']), params: r['Size (B)']?.trim() && Number.isFinite(Number(r['Size (B)'])) && Number(r['Size (B)']) > 0 ? Number(r['Size (B)']) : undefined, link: r['Submission PR']?.startsWith('https://') ? r['Submission PR'] : r.Links?.startsWith('https://') ? r.Links : undefined, metrics: Object.fromEntries(['humaneval-python','java','javascript','cpp','php','julia','d','lua','r','racket','rust','swift','Throughput (tokens/s)','Win Rate','Seq_length','#Languages','Throughput (tokens/s) bs=50','Peak Memory (MB)'].flatMap(k => r[k]?.trim() && Number.isFinite(Number(r[k])) ? [[k, Number(r[k])]] : []))}));
  },
};
export default board;
