// CyberGym (level 1: reproduce the known vulnerability from its description and the code). cybergym.io/cybergym/
// renders /assets/data/cybergym.json: the page keeps level1 rows with trials === 1 that are not hidden,
// sorts them by score_10 (success rate, 0 to 1) and shows that as the Success Rate. Rows scheduled with a
// future visible_after are not shown yet, so they are skipped. Each row names an agent and a model; the
// agent is the harness. Multi-model systems keep their published system name as unlisted entries.
// Earlier variants listed as subRows inherit the parent's agent. The "dynamic" and "test-time mem."
// features (setups the page can filter out) become the setting. Many rows are agent systems submitted by
// their makers, and some scores come from lab model cards (the source column).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://www.cybergym.io/assets/data/cybergym.json';

interface Row {
  agent?: string;
  model?: string;
  score_10?: number;
  date?: string;
  trials?: number;
  hidden?: boolean;
  visible_after?: string;
  features?: string | string[];
  subRows?: Row[];
}

const unescape = (s?: string) => s?.replace(/\\([()])/g, '$1').trim();

const board: Leaderboard = {
  benchmark: 'cybergym',
  url: 'https://www.cybergym.io/cybergym/',
  feed: `${FEED} (level1, single trial)`,
  terms: 'Static JSON on the CyberGym site, which states no terms and whose robots.txt is absent; the CyberGym repository is Apache-2.0.',
  aliases: {
    'Claude Sonnet 3.7': 'claude-3-7-sonnet',
    'Gemini 2.5 Flash Preview': 'gemini-2-5-flash-apr-2025',
    // the only OpenHands LM 32B in the registry (v0.1)
    'OpenHands-LM-32B': 'openhands-lm-32b-v0-1',
  },
  async fetch() {
    const { level1 } = await fetchJson<{ level1: Row[] }>(FEED);
    const now = Date.now();
    const rows: LeaderboardRow[] = [];
    const add = (r: Row, agent?: string, features?: Row['features']) => {
      const model = unescape(r.model);
      if (!model || typeof r.score_10 !== 'number') return;
      const feats = (Array.isArray(features) ? features : features ? [features] : [])
        .map((f) => f.split(' (')[0].trim())
        .filter((f) => f === 'dynamic' || f === 'test-time mem.');
      rows.push({ model, harness: unescape(agent), score: r.score_10 * 100, setting: feats.join(', ') || undefined, date: r.date });
    };
    for (const r of level1) {
      if (r.trials !== 1 || r.hidden) continue;
      if (r.visible_after && Date.parse(r.visible_after) > now) continue;
      add(r, r.agent, r.features);
      for (const s of r.subRows ?? []) add(s, s.agent ?? r.agent, s.features ?? r.features);
    }
    return rows;
  },
};
export default board;
