// CompileBench (Quesma) on compilebench.com, the board Quesma's benchmark index links to. The page is static
// HTML whose ranking is drawn by an inline script from a literal array, `const data = [...]`: per model the
// display name (with its reasoning budget, "claude-opus-4.1-thinking-16k"), the OpenRouter slug, tasks
// passed within three attempts (tasks_passed_rate, the page's default sort, "pass@3") and attempts passed
// (pass@1). The default sort, tasks_passed_rate (a fraction, shown here as 0 to 100), is the score. The
// array is read as JSON, never run. The display name is kept so the resolver can read the budget.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAt } from '../lib/html.ts';

const URL = 'https://www.compilebench.com/';
const MARK = 'const data = [{"model":';

interface Entry {
  model?: string;
  tasks_passed_rate?: number;
}

const board: Leaderboard = {
  benchmark: 'compilebench',
  url: URL,
  feed: `${URL} (inline ranking data, tasks_passed_rate)`,
  terms: 'Static public page; the site has no robots.txt restrictions and no terms, and the CompileBench repository is public.',
  aliases: {},
  async fetch() {
    const html = await fetchText(URL);
    const at = html.indexOf(MARK);
    if (at < 0) throw new Error('CompileBench ranking data not found');
    const rows: LeaderboardRow[] = [];
    for (const e of jsonAt<Entry[]>(html, at + MARK.indexOf('['))) {
      if (!e.model || typeof e.tasks_passed_rate !== 'number') continue;
      rows.push({ model: e.model, score: e.tasks_passed_rate * 100 });
    }
    if (!rows.length) throw new Error('no rows in the CompileBench ranking data');
    return rows;
  },
};
export default board;
