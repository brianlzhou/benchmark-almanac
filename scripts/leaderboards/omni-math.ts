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
  parts: {
    algebra: { name: 'Algebra', group: 'Domain' },
    precalculus: { name: 'Precalculus', group: 'Domain' },
    calculus: { name: 'Calculus', group: 'Domain' },
    geometry: { name: 'Geometry', group: 'Domain' },
    discreteMath: { name: 'Discrete mathematics', group: 'Domain' },
    numberTheory: { name: 'Number theory', group: 'Domain' },
    appliedMath: { name: 'Applied mathematics', group: 'Domain' },
    diff1to3: { name: 'Difficulty 1 to 3', group: 'Difficulty' },
    diff3to5: { name: 'Difficulty 3 to 5', group: 'Difficulty' },
    diff5to8: { name: 'Difficulty 5 to 8', group: 'Difficulty' },
    diff8to10: { name: 'Difficulty 8 to 10', group: 'Difficulty' },
  },
  async fetch() {
    const html = (await fetchText(URL)).replace(/<!--[\s\S]*?-->/g, '');
    const t = tables(html).find((rows) => rows[0]?.some((c) => c.text === 'Overall Acc'));
    if (!t) throw new Error('Omni-MATH table not found');
    const head = t[0].map((c) => c.text);
    const iOverall = head.indexOf('Overall Acc');
    const colOffsets: [string, number][] = ([
      ['algebra', head.indexOf('Algebra')],
      ['precalculus', head.indexOf('Precalculus')],
      ['calculus', head.indexOf('Calculus')],
      ['geometry', head.indexOf('Geometry')],
      ['discreteMath', head.indexOf('Discrete Mathematics')],
      ['numberTheory', head.indexOf('Number Theory')],
      ['appliedMath', head.indexOf('Applied Mathematics')],
      ['diff1to3', head.indexOf('Difficulty: 1-3')],
      ['diff3to5', head.indexOf('Difficulty: 3-5')],
      ['diff5to8', head.indexOf('Difficulty: 5-8')],
      ['diff8to10', head.indexOf('Difficulty: 8-10')],
    ] as [string, number][]).filter(([, i]) => i > iOverall).map(([k, i]) => [k, i - iOverall]);
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
      const metrics: Record<string, number> = {};
      for (const [k, off] of colOffsets) {
        const v = num(r[at + 1 + off]?.text);
        if (v !== undefined) metrics[k] = v;
      }
      // "OpenAI o1-mini": the maker's name is not part of the model name
      rows.push({
        model: first.replace(/^OpenAI\s+/, ''),
        score,
        date: `${d[0]}-${d[1].padStart(2, '0')}-${d[2].padStart(2, '0')}`,
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }
    return rows;
  },
};
export default board;
