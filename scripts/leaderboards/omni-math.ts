// Omni-MATH (Peking University and Alibaba). omni-math.github.io is a static page whose first table is the
// leaderboard: model, publication date, Overall Acc, then accuracy by domain and difficulty. Overall Acc
// (GPT-4o judged, 0 to 100) is the score. A model cell may also name its base model, maker and method in
// small print after the name, so only the first line of the cell is kept. A second table scores a
// rule-based subset and is not read.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables, text } from '../lib/html.ts';

const URL = 'https://omni-math.github.io/';

const board: Leaderboard = {
  benchmark: 'omni-math',
  url: URL,
  feed: `${URL} (static HTML table, Overall Acc)`,
  terms: 'Static GitHub Pages site; robots.txt only blocks one named crawler, the Omni-MATH repository is Apache-2.0 and the page states no other terms.',
  aliases: {
    'MetaLlama-3.1-70B-instruct': 'llama-3-1-70b',
  },
  async fetch() {
    const t = tables(await fetchText(URL)).find((rows) => rows[0]?.some((c) => c.text === 'Overall Acc'));
    if (!t) throw new Error('Omni-MATH table not found');
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      // the cell's first block is the name. Base model, maker and method follow in later cells or blocks
      const first = r[0]?.html.split(/<br\s*\/?>|<\/(?:p|div|span)>/i).map(text).find(Boolean);
      // rows differ in how many cells the name takes, so the publication date anchors the row and
      // Overall Acc is the cell after it
      const at = r.findIndex((c) => /^\d{4}\/\d{1,2}\/\d{1,2}$/.test(c.text));
      if (!first || at < 0) continue;
      const score = num(r[at + 1]?.text);
      const d = r[at].text.split('/');
      if (score === undefined) continue;
      // "OpenAI o1-mini": the maker's name is not part of the model name
      rows.push({ model: first.replace(/^OpenAI\s+/, ''), score, date: `${d[0]}-${d[1].padStart(2, '0')}-${d[2].padStart(2, '0')}` });
    }
    return rows;
  },
};
export default board;
