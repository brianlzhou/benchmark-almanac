// SWT-Bench (ETH Zurich SRI Lab and LogicStar). swtbench.com is a static page with two leaderboard tables:
// SWT-Bench Lite (#leaderboard-table, shown by default) and Verified (#verified-leaderboard-table). Each row
// is tagged data-mode "unittest" (Unit Test Mode, checked by default) or "reproduction" (Script Mode), and
// its first cell names the agent with the model in <small>. The importer reads the default view, Lite in
// Unit Test Mode: S (success rate, 0 to 100) is the score, the agent is the harness and the date is kept.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';

const URL = 'https://swtbench.com/';

const board: Leaderboard = {
  benchmark: 'swt-bench',
  url: URL,
  feed: `${URL} (static HTML table #leaderboard-table, Lite, Unit Test Mode rows, S)`,
  terms: 'Static public page; the site content is CC BY-SA 4.0 and robots.txt is absent.',
  aliases: {},
  async fetch() {
    const html = await fetchText(URL);
    const table = html.match(/<table id="leaderboard-table"[\s\S]*?<\/table>/)?.[0];
    if (!table) throw new Error('SWT-Bench Lite table not found');
    const rows: LeaderboardRow[] = [];
    for (const tr of table.matchAll(/<tr data-mode="unittest">([\s\S]*?)<\/tr>/g)) {
      const cells = [...tr[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1]);
      const model = text(cells[0]?.match(/<small>([\s\S]*?)<\/small>/)?.[1] ?? '');
      const agent = text((cells[0] ?? '').replace(/<small>[\s\S]*?<\/small>|<sup>[\s\S]*?<\/sup>/g, '')).replace(/^[^\w(]+/u, '').trim();
      const score = num(text(cells[2] ?? ''));
      const date = text(cells[4] ?? '');
      if (!model || score === undefined) continue;
      rows.push({ model, score, harness: agent || undefined, date: /^\d{4}-\d\d-\d\d$/.test(date) ? date : undefined });
    }
    return rows;
  },
};
export default board;
