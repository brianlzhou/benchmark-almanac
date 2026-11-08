// MixEval (dynamic benchmark mixture). mixeval.github.io is a static page whose first table is the chat
// model leaderboard: MixEval-Hard, MixEval, Arena Elo and the mixed sub-benchmarks. The MixEval column
// (0 to 100) is the score. Rows with "-" there (scored on MixEval-Hard only) are skipped. The second table
// covers base models on a different protocol, retained under a separate setting and model identity. Rows carry no dates. The board's newest
// entry is o1-preview (September 2024), so rows are dated 2024-09-12 to keep the resolver on snapshots
// from that time.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const URL = 'https://mixeval.github.io/';

const board: Leaderboard = {
  benchmark: 'mixeval',
  url: `${URL}#leaderboard`,
  feed: `${URL} (static HTML table, MixEval column)`,
  terms: 'Static GitHub Pages site; the page content is CC BY-SA 4.0.',
  aliases: {
    'Claude 3.5 Sonnet-0620': 'claude-3-5-sonnet',
    'Gemini 1.5 Pro-API-0514': 'gemini-1-5-pro-may-2024',
    'LLaMA-3-70B-Instruct': 'llama-3-70b',
    'LLaMA-3-8B-Instruct': 'llama-3-8b',
    'GPT-3.5-Turbo-0125': 'gpt-3-5-turbo-jan-2024',
    'DeepSeek-V2': 'deepseek-v2-moe-236b-may-2024',
    'Yi-1.5-34B-Chat': 'yi-1-5-34b',
    'Qwen1.5-32B-Chat': 'qwen1-5-32b',
  },
  async fetch() {
    const all = tables(await fetchText(URL)).filter(rows => rows[0]?.some(c => /^MixEval-Hard/.test(c.text)));
    const rows: LeaderboardRow[] = [];
    for (const [index, t] of all.entries()) {
    if (!t) throw new Error('MixEval table not found');
    const head = t[0].map((c) => c.text);
    const iScore = head.findIndex((h) => /^MixEval(\s|$)/.test(h) && !/Hard/.test(h));
    if (iScore < 0) throw new Error(`unexpected MixEval header: ${head.join(' | ')}`);
    for (const r of t.slice(1)) {
      let model = r[0]?.text.replace(/^OpenAI\s+/, '');
      if (model && index > 0) model += ' (base)';
      if (/^Reka Edge/i.test(model ?? '')) model += ' (2024 board version)';
      const score = /^\s*-\s*$/.test(r[iScore]?.text ?? '') ? undefined : num(r[iScore]?.text);
      // the registry's only Reka Edge is the 2026 release, not the February 2024 model on this board
      if (model && score !== undefined) rows.push({ model, score, date: '2024-09-12', setting: index > 0 ? 'base-model protocol' : 'chat-model protocol' });
    }
    }
    return rows;
  },
};
export default board;
