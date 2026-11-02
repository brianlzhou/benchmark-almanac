// PubMedQA. pubmedqa.github.io is a static page with one leaderboard table (reasoning-required setting):
// rank and date badge, model with affiliation and paper link, size, Accuracy (%) and Macro-F1 (%). Accuracy is
// the column the board ranks by, so it is the score. The model name is the first line of the model cell; a
// "(Medprompt)" suffix is the prompting harness, while other suffixes ("(3-shot)", "(large)") stay in the name
// so the resolver does not mistake a variant for a registry model. The date badge is when the result was
// published, passed as the run date. Most entries are 2019 to 2024 research systems not in the registry.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables, text } from '../lib/html.ts';

const PAGE = 'https://pubmedqa.github.io/';
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** "Nov 28, 2023" or "June, 2021" to YYYY-MM-DD (the first of the month when the day is missing). */
function isoDate(s: string): string | undefined {
  const m = s.match(/([A-Za-z]{3})[a-z]*\.?\s*(\d{1,2})?,?\s*(\d{4})/);
  const mon = m ? MONTHS.indexOf(m[1].toLowerCase()) : -1;
  if (!m || mon < 0) return undefined;
  return `${m[3]}-${String(mon + 1).padStart(2, '0')}-${String(m[2] ?? 1).padStart(2, '0')}`;
}

const board: Leaderboard = {
  benchmark: 'pubmedqa',
  url: PAGE,
  feed: `${PAGE} (static HTML table, Accuracy)`,
  terms: 'Static GitHub Pages site of the MIT-licensed pubmedqa/pubmedqa project; GitHub Pages serves no robots.txt rules for it.',
  async fetch() {
    const t = tables(await fetchText(PAGE)).find((rows) => rows[0]?.some((c) => /^accuracy/i.test(c.text)));
    if (!t) throw new Error('leaderboard table not found');
    const head = t[0].map((c) => c.text.toLowerCase());
    const iModel = head.indexOf('model');
    const iAcc = head.findIndex((h) => h.startsWith('accuracy'));
    if (iModel < 0 || iAcc < 0) throw new Error(`unexpected columns: ${head.join(', ')}`);
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      const first = text(r[iModel]?.html.split(/<br\s*\/?>/i)[0] ?? '');
      const score = num(r[iAcc]?.text);
      if (!first || score === undefined || /human performance/i.test(first)) continue;
      const date = isoDate(r[0]?.text ?? '');
      const medprompt = first.match(/^(.*?)\s*\(Medprompt\)$/i);
      rows.push({ model: medprompt ? medprompt[1] : first, score, harness: medprompt ? 'Medprompt' : undefined, date });
    }
    return rows;
  },
};
export default board;
