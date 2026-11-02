// LongBench v2 (Tsinghua and Zhipu). longbench2.github.io serves its leaderboard as a static HTML table:
// Model (with the maker in a <p> under the name), Params, Context, Date, then Overall, Easy, Hard, Short,
// Medium and Long, each as a pair of columns: without and with chain of thought. The board sorts by Overall
// with CoT, and reasoning models (marked with a brain) only have that column, so Overall with CoT is kept
// with the setting "CoT" and Overall without CoT is kept with no setting. The Human row is dropped.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables, text } from '../lib/html.ts';

const URL = 'https://longbench2.github.io/';

const board: Leaderboard = {
  benchmark: 'longbench-v2',
  url: `${URL}#leaderboard`,
  feed: `${URL} (results table)`,
  terms: 'Static GitHub Pages project page with no stated terms; the LongBench repository is MIT-licensed.',
  aliases: {
    // the board dates this row 2024-10-22, the October 2024 release
    'Claude 3.5 Sonnet': 'claude-3-5-sonnet-october-2024',
    'Qwen3-235B-A22B-Instruct-2507': 'qwen3-235b-a22b-instruct-jul-2025',
    'Qwen3-30B-A3B-Thinking-2507': 'qwen3-30b-a3b-thinking-jul-2025',
    'Kimi-K2-Instruct': 'kimi-k2-jul-2025',
    'Mistral Large 24.11': 'mistral-large-2-nov-2024',
    // the LongBench v2 paper evaluates Llama-3.1-Nemotron-70B-Instruct
    'Nemotron 70B': 'llama-3-1-nemotron-70b-instruct',
  },
  async fetch() {
    const t = tables(await fetchText(URL)).find((rows) => rows[0]?.some((c) => /^Overall/.test(c.text)));
    if (!t) throw new Error('results table not found');
    const head = t[0].map((c) => c.text);
    if (head[1] !== 'Model' || !/^Date$/.test(head[4]) || !/^Overall/.test(head[5])) throw new Error(`unexpected columns: ${head.join(' | ')}`);
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(2)) {
      if (r.length < 7) continue;
      const model = text(r[1].html.replace(/<p\b[\s\S]*?<\/p>/gi, '')).replace(/🧠/g, '').trim();
      if (!model || /^human$/i.test(model)) continue;
      const date = /^\d{4}-\d\d-\d\d$/.test(r[4].text) ? r[4].text : undefined;
      const plain = num(r[5].text);
      const cot = num(r[6].text);
      if (plain !== undefined) rows.push({ model, score: plain, date });
      if (cot !== undefined) rows.push({ model, score: cot, setting: 'CoT', date });
    }
    return rows;
  },
};
export default board;
