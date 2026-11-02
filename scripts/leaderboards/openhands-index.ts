// OpenHands Index. index.openhands.dev is a Gradio app; its config (GET /config) carries each leaderboard
// table as a dataframe value. The overall table (headers "Language Model", "SDK Version", "Average Score",
// "Average Cost", ...) ranks models run with the OpenHands Software Agent SDK by Average Score, the mean of
// the five category scores (Issue Resolution, Greenfield, Frontend, Testing, Information Gathering), which is
// the score here (0 to 100). Average Cost is US dollars per task and Date the run date. Every row uses the
// OpenHands agent, so that is the harness; the separate "Alternative Agents" table is not read.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { text, num } from '../lib/html.ts';

const SITE = 'https://index.openhands.dev';

interface Config {
  components: { props?: { value?: { headers?: string[]; data?: string[][] } } }[];
}

const board: Leaderboard = {
  benchmark: 'openhands-index',
  url: `${SITE}/`,
  feed: `${SITE}/config (overall dataframe, Average Score)`,
  terms: 'Public Gradio app; robots.txt allows every path and the site states no terms of its own.',
  aliases: {
    'DeepSeek-V3.2-Reasoner': 'deepseek-v3-2',
    'Minimax-2.7': 'minimax-m2-7',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const cfg = await fetchJson<Config>(`${SITE}/config`);
    const table = cfg.components
      .map((c) => c.props?.value)
      .find((v) => v?.headers?.[0] === 'Language Model' && v.headers.includes('Average Score'));
    if (!table?.headers || !table.data) throw new Error('overall table not found in the Gradio config');
    const h = table.headers;
    const [iScore, iCost, iDate] = [h.indexOf('Average Score'), h.indexOf('Average Cost'), h.indexOf('Date')];
    return table.data.map((r) => {
      const date = text(r[iDate] ?? '');
      return {
        model: text(r[0] ?? ''),
        score: num(text(r[iScore] ?? '')) ?? NaN,
        harness: 'OpenHands',
        date: /^\d{4}-\d\d-\d\d$/.test(date) ? date : undefined,
        cost: iCost >= 0 ? num(text(r[iCost] ?? '')) : undefined,
      };
    });
  },
};
export default board;
