// MathVista (testmini, 1,000 problems). mathvista.github.io draws its leaderboard from
// data/results/model_scores.js, a script that assigns one JSON object, score_table: per entry the model,
// method (LLM, LMM, tool-augmented or reasoning), source link, date, ALL (the overall accuracy, 0 to 100)
// and per-task scores. ALL is the score. The object is read as data (JSON after the assignment), never run.
// The human and random-chance baselines are dropped, and the medal emoji on the top three are removed.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';

const FEED = 'https://mathvista.github.io/data/results/model_scores.js';

interface Entry {
  Model?: string;
  Method?: string;
  Date?: string;
  ALL?: number | string;
}

const board: Leaderboard = {
  benchmark: 'mathvista',
  url: 'https://mathvista.github.io/#leaderboard',
  feed: `${FEED} (ALL, testmini)`,
  terms: 'Static data file on the MathVista GitHub Pages site; the MathVista repository is CC BY-SA 4.0.',
  aliases: {},
  async fetch() {
    const table = jsonAfter<Record<string, Entry>>(await fetchText(FEED), 'score_table =');
    const rows: LeaderboardRow[] = [];
    for (const e of Object.values(table)) {
      const model = e.Model?.replace(/[\u{1F947}-\u{1F949}]/gu, '').trim();
      if (!model || typeof e.ALL !== 'number' || /human|random|frequent guess/i.test(model)) continue;
      rows.push({ model, score: e.ALL, date: /^\d{4}-\d\d-\d\d$/.test(e.Date ?? '') ? e.Date : undefined });
    }
    if (!rows.length) throw new Error('no rows in score_table');
    return rows;
  },
};
export default board;
