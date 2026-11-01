// CyberGym E2E (find, prove and patch real vulnerabilities from source code only). cybergym.io/cybergym-e2e/
// renders /assets/data/cybergym-e2e.json: per agent and model, four cumulative stages S1 to S4 and a
// patch-only setting, in percent. The page sorts by S3, so S3 is the score. Rows marked task_set 615 ran an
// earlier, smaller task set (the page flags them with †) and are skipped; only the 920-task set is read.
// "Multi-model (...)" systems have no single model to credit and are skipped. The harness is kept.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://www.cybergym.io/assets/data/cybergym-e2e.json';

interface Row {
  harness?: string;
  model?: string;
  task_set?: number;
  s3?: number | null;
  date?: string;
  hidden?: boolean;
}

const board: Leaderboard = {
  benchmark: 'cybergym-e2e',
  url: 'https://www.cybergym.io/cybergym-e2e/',
  feed: `${FEED} (task_set 920, S3)`,
  terms: 'Static JSON on the CyberGym site, which states no terms and whose robots.txt is absent; the CyberGym repository is Apache-2.0.',
  aliases: {},
  async fetch() {
    const { results } = await fetchJson<{ results: Row[] }>(FEED);
    const rows: LeaderboardRow[] = [];
    for (const r of results) {
      const model = r.model?.replace(/\\([()])/g, '$1').trim();
      if (r.hidden || r.task_set !== 920 || !model || /^Multi-model\b/i.test(model) || typeof r.s3 !== 'number') continue;
      rows.push({ model, harness: r.harness?.replace(/\\([()])/g, '$1').trim() || undefined, score: r.s3, date: r.date });
    }
    return rows;
  },
};
export default board;
