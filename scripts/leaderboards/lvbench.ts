// LVBench (Zhipu AI and Tsinghua), hours-long video understanding. The Hugging Face Space leaderboard reads a
// submissions dataset that needs a login, so the importer reads the makers' project page instead,
// lvbench.github.io, whose leaderboard is a static HTML table: Model (maker in a <p> under the name), Frames,
// LLM Params, Date, Overall and the six task scores. Overall accuracy (0 to 100) is the score and the date
// (written like 2025-5-29) is the row date. A trailing "*" on a name marks a run the authors did themselves.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables, text } from '../lib/html.ts';

const URL = 'https://lvbench.github.io/';

const board: Leaderboard = {
  benchmark: 'lvbench',
  url: `${URL}#leaderboard`,
  feed: `${URL} (results table, Overall)`,
  terms: 'Static GitHub Pages project page with no stated terms; the LVBench repository is MIT-licensed, as is the Space.',
  aliases: {
    'GPT-4o-2024-11-20': 'gpt-4o-nov-2024',
    'GPT-4o(2024-05-13)': 'gpt-4o-may-2024',
    'Qwen2-VL-72B': 'qwen2-vl-72b-instruct',
  },
  async fetch() {
    const t = tables(await fetchText(URL)).find((rows) => rows[0]?.some((c) => /^Overall/.test(c.text)));
    if (!t) throw new Error('results table not found');
    const head = t[0].map((c) => c.text);
    if (head[1] !== 'Model' || head[4] !== 'Date' || !/^Overall/.test(head[5])) throw new Error(`unexpected columns: ${head.join(' | ')}`);
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      const model = text(r[1]?.html.replace(/<p\b[\s\S]*?<\/p>/gi, '') ?? '').replace(/\s*\*$/, '').trim();
      const score = num(r[5]?.text);
      if (!model || score === undefined) continue;
      const d = r[4].text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
      const date = d ? `${d[1]}-${d[2].padStart(2, '0')}-${d[3].padStart(2, '0')}` : undefined;
      rows.push({ model, score, date });
    }
    return rows;
  },
};
export default board;
