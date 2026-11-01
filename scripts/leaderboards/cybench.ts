// Cybench (40 professional CTF tasks). cybench.github.io parses data/leaderboard.csv with PapaParse: per
// model the task count (Count), End-to-End % Solved (the headline, 0 to 100) and subtask columns. The board
// mixes its own runs with results that footnotes (superscript marks) attribute to the HAL leaderboard and
// lab system cards, and some rows cover only 35 to 39 of the 40 tasks; those rows keep the task count as
// the setting so they are not read as full-set scores. The marks are dropped from model names.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = 'https://cybench.github.io/data/leaderboard.csv';

const board: Leaderboard = {
  benchmark: 'cybench',
  url: 'https://cybench.github.io/',
  feed: `${FEED} (End-to-End % Solved)`,
  terms: 'CSV on the Cybench GitHub Pages site, which states no terms; the Cybench repository is Apache-2.0.',
  aliases: {
    'OpenAI o3-mini': 'o3-mini',
    'OpenAI o1-mini': 'o1-mini',
    'OpenAI o1-preview': 'o1-preview',
    'GPT-4.5-preview': 'gpt-4-5',
    'Mixtral 8x22b Instruct': 'mixtral-8x22b',
    'Llama 3 70b Chat': 'llama-3-70b',
    'Llama 3.1 405B Instruct': 'llama-3-1-405b',
    // the paper's August 2024 runs
    'GPT-4o': 'gpt-4o-may-2024',
    'Claude 3.5 Sonnet': 'claude-3-5-sonnet',
    'Gemini 1.5 Pro': 'gemini-1-5-pro-may-2024',
  },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const r of parseCsv(await fetchText(FEED))) {
      const score = Number(r['End-to-End % Solved']);
      const model = r.Model?.replace(/[¹²³⁰-⁹†*]+/g, '').trim();
      if (!model || !r['End-to-End % Solved'] || !Number.isFinite(score)) continue;
      const count = Number(r.Count);
      rows.push({ model, score, setting: count && count !== 40 ? `${count} of 40 tasks` : undefined });
    }
    return rows;
  },
};
export default board;
