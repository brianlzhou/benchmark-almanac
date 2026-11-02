// PutnamBench. trishullab.github.io/PutnamBench/leaderboard.html loads results.json: per entry (keyed by
// name, sometimes padded with spaces to keep repeat entries apart) the date added and num-solved per proof
// language and mode. The page's main list is Lean with the answer placeholders filled ("lean-wsolution"),
// labelled "out of 672" on the page. The score is num-solved over that set size, as a percent; the size is
// read from the page label so it follows when the set grows again. Entries made when the Lean set was
// smaller (640 to 657 problems) are still divided by the current size, as the page compares them. Most
// entries are prover systems (Aleph Prover, Seed-Prover), which stay unmatched; plain models (GPT-4o,
// o4-mini, Gemini 2.5 Pro) and released prover models match. The date added is the submission date.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson, fetchText } from '../lib/util.ts';

const PAGE = 'https://trishullab.github.io/PutnamBench/leaderboard.html';
const FEED = 'https://trishullab.github.io/PutnamBench/results.json';

interface Entry {
  'date-added'?: string;
  'num-solved'?: Record<string, number>;
}

const board: Leaderboard = {
  benchmark: 'putnambench',
  url: PAGE,
  feed: `${FEED} (lean-wsolution solved, over the Lean set size on the page)`,
  terms: 'Static JSON on the PutnamBench GitHub Pages site (robots.txt allows all); the PutnamBench repository is MIT and Apache-2.0 licensed.',
  aliases: {
    'gemini-2.5-pro-exp-0325': 'gemini-2-5-pro-mar-2025',
  },
  async fetch() {
    const html = await fetchText(PAGE);
    const size = Number(html.match(/Lean with answer[^<]*\(out of (\d+)\)/)?.[1]);
    if (!size) throw new Error('Lean set size not found on the PutnamBench page');
    const data = await fetchJson<Record<string, Entry>>(FEED);
    const rows: LeaderboardRow[] = [];
    for (const [name, e] of Object.entries(data)) {
      const solved = e['num-solved']?.['lean-wsolution'];
      if (typeof solved !== 'number') continue;
      rows.push({
        model: name.trim(),
        score: Number(((100 * solved) / size).toFixed(2)),
        date: /^\d{4}-\d\d-\d\d$/.test(e['date-added'] ?? '') ? e['date-added'] : undefined,
      });
    }
    return rows;
  },
};
export default board;
