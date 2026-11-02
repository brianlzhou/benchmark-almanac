// AgentIF-OneDay (xbench AGI Tracking series). The board at xbench.org/agi/agentif reads /api/task-ifs from
// the xbench Strapi API (see xbench-scienceqa.ts) with the page's own query: per tested agent product the
// overall score (0 to 100, the ranking), mean latency and evaluation date. The board tests agent products
// (AutoClaw, Manus, Genspark, ChatGPT Agent, MiniMax Agent); every row is passed on and the resolver keeps
// the ones with a model record.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { XBENCH_API, XBENCH_TERMS, xbenchApi } from './xbench-scienceqa.ts';

const PATH = 'task-ifs?sort=overallScore:desc&pagination[limit]=100&populate=company';

interface Entry {
  product?: string;
  overallScore?: number;
  evaluationDate?: string;
}

const board: Leaderboard = {
  benchmark: 'agentif-oneday',
  url: 'https://xbench.org/agi/agentif',
  feed: XBENCH_API + PATH,
  terms: XBENCH_TERMS,
  async fetch() {
    const { data } = await xbenchApi<{ data: Entry[] }>(PATH);
    const rows: LeaderboardRow[] = [];
    for (const e of data) {
      const model = e.product?.trim();
      if (!model || typeof e.overallScore !== 'number') continue;
      rows.push({ model, score: e.overallScore, date: e.evaluationDate });
    }
    return rows;
  },
};
export default board;
