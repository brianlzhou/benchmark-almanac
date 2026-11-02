// QuALITY (long-document multiple-choice QA, NYU). nyu-mll.github.io/quality/ has one static HTML table:
// rank with the submission month, system name with its affiliation, description, links, then Accuracy and
// SAT-style score on the test set and its hard subset. Test-set Accuracy is the score. Most entries are
// retrieval systems built on a model ("RAPTOR (collapsed tree) + GPT-4"); for those the model after the last
// "+" is kept and the method becomes the harness. Unranked rows (dev set only) and the human row are
// skipped. The submission month is passed as the date (first of the month) so dated snapshots resolve.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables, text } from '../lib/html.ts';

const PAGE = 'https://nyu-mll.github.io/quality/';

const board: Leaderboard = {
  benchmark: 'quality',
  url: PAGE,
  feed: `${PAGE} (static HTML table, test-set Accuracy)`,
  terms: 'Static GitHub Pages site of the QuALITY authors (no robots.txt, so nothing is disallowed); it publishes no terms.',
  aliases: {
    // "Long-context GPT-3.5 (gpt-3.5-turbo-16k) as of January 2024": the 16k alias then served the 0613 snapshot
    'Long-context GPT-3.5 (gpt-3.5-turbo-16k) as of January 2024': 'gpt-3-5-turbo-jun-2023',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const t = tables(await fetchText(PAGE)).find((rows) => rows[0]?.some((c) => c.text === 'Model name') && rows[0]?.some((c) => c.text === 'Accuracy'));
    if (!t) throw new Error('QuALITY table not found');
    const rows: LeaderboardRow[] = [];
    for (const r of t) {
      const m = r[0]?.text.match(/^(\d+)\s+(\d{4})\/(\d{2})$/);
      if (!m || r.length < 6) continue; // header, description and unranked rows
      let name = text((r[1]?.html ?? '').split(/<br\s*\/?>/i)[0]).replace(/^(baseline model|question-only baseline):\s*/i, '');
      let harness: string | undefined;
      const plus = name.lastIndexOf('+');
      if (plus > 0) {
        harness = name.slice(0, plus).trim();
        name = name.slice(plus + 1).split(/,|\s+w\/\s+/)[0].trim();
      }
      const score = num(r[5]?.text);
      if (!name || score === undefined || /human/i.test(name)) continue;
      rows.push({ model: name, score, harness, date: `${m[2]}-${m[3]}-01` });
    }
    return rows;
  },
};
export default board;
