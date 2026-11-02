// BIRD-SQL. bird-bench.github.io is a static page whose first table is the main leaderboard: per entry the
// submission date, the model or system (name, then affiliation), code link, size, whether oracle knowledge
// (the evidence hints) was given, and execution accuracy on Dev and on the hidden Test set. Test (%) is the
// ranking and the score; the Dev column mixes the original and the 2025-11-06 dev sets. Only rows run with
// oracle knowledge are read: that is the standard setting, and the same models appear again lower down
// without it. Most entries are text-to-SQL systems built on a model ("CHASE-SQL + Gemini"), which the
// resolver leaves unmatched; the plain-model baselines (GPT-5.5, Claude Opus 4.6, DeepSeek-R1, T5...) match.
// The date badge is the submission date.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables, text } from '../lib/html.ts';

const URL = 'https://bird-bench.github.io/';
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** "Sep 07, 2026" or "July 08, 2025" as YYYY-MM-DD; undefined for impossible dates such as "Jun 31". */
function badgeDate(s: string): string | undefined {
  const m = s.match(/^([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2}),\s*(\d{4})$/);
  const mon = m ? MONTHS.indexOf(m[1].toLowerCase()) : -1;
  if (!m || mon < 0) return undefined;
  const d = new Date(Date.UTC(Number(m[3]), mon, Number(m[2])));
  return d.getUTCDate() === Number(m[2]) ? d.toISOString().slice(0, 10) : undefined;
}

const board: Leaderboard = {
  benchmark: 'bird-sql',
  url: URL,
  feed: `${URL} (main leaderboard table, Test %)`,
  terms: 'Static GitHub Pages site of the BIRD project; there is no robots.txt and the site publishes no terms of use.',
  aliases: {
    'Claude 4.5 Sonnet': 'claude-sonnet-4-5',
  },
  async fetch() {
    const t = tables(await fetchText(URL)).find((rows) => {
      const head = rows[0]?.map((c) => c.text) ?? [];
      return head.includes('Oracle Knowledge') && head.includes('Test (%)');
    });
    if (!t) throw new Error('BIRD main leaderboard table not found');
    const head = t[0].map((c) => c.text);
    const [iModel, iOracle, iTest] = [head.indexOf('Model'), head.indexOf('Oracle Knowledge'), head.indexOf('Test (%)')];
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      // the model cell is "Name<br><span class="affiliation">Team</span>..."
      const model = text(r[iModel]?.html.split(/<br|<span/i)[0] ?? '');
      const score = num(r[iTest]?.text);
      if (!model || score === undefined || /human performance/i.test(model)) continue;
      if (!/✔/.test(r[iOracle]?.text ?? '')) continue;
      rows.push({ model, score, date: badgeDate(r[0]?.text ?? '') });
    }
    return rows;
  },
};
export default board;
