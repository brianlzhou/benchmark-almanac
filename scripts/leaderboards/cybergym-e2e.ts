// CyberGym E2E (find, prove and patch real vulnerabilities from source code only). cybergym.io/cybergym-e2e/
// renders /assets/data/cybergym-e2e.json: per agent and model, four cumulative stages S1 to S4 and a
// patch-only setting, in percent. The page sorts by S3, so S3 is the score. Rows marked task_set 615 ran an
// earlier, smaller task set (the page flags them with †) and are excluded.
// Multi-model systems remain unlisted, with their complete system identity and harness. Budget caps are settings, not measured costs.
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
  budget?: string;
  s1?: number; s2?: number; s4?: number; patch_only?: number;
}

const board: Leaderboard = {
  benchmark: 'cybergym-e2e',
  url: 'https://www.cybergym.io/cybergym-e2e/',
  feed: `${FEED} (current 920-task set, S3)`,
  terms: 'Static JSON on the CyberGym site, which states no terms and whose robots.txt is absent; the CyberGym repository is Apache-2.0.',
  aliases: {},
  fetch: () => fetchCyberGymE2ERows(),
};
export async function fetchCyberGymE2ERows(taskSet = 920): Promise<LeaderboardRow[]> {
    const { results } = await fetchJson<{ results: Row[] }>(FEED);
    const rows: LeaderboardRow[] = [];
    for (const r of results) {
      const model = r.model?.replace(/\\([()])/g, '$1').trim();
      if (r.hidden || r.task_set !== taskSet || !model || typeof r.s3 !== 'number') continue;
      rows.push({ model, harness: r.harness?.replace(/\\([()])/g, '$1').trim() || undefined, score: r.s3, date: r.date, setting: r.budget ?? "budget unspecified", metrics: {s1:r.s1!,s2:r.s2!,s4:r.s4!,patchOnly:r.patch_only!} });
    }
    return rows;
}
export default board;
