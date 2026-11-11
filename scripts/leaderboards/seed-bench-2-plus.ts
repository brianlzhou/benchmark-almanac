// SEED-Bench-2-Plus on OpenCompass's OpenVLM leaderboard. The public OpenVLM.json feed has one SEEDBench2_Plus
// object per evaluated model; Overall is the mean accuracy across Charts, Maps and Webs, in percent. The three
// category scores stay in metrics. This is the text-rich SEED-Bench-2-Plus set, not SEED-Bench-2.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { OPENVLM_FEED as FEED } from './openvlm-leaderboard.ts';

interface Result {
  SEEDBench2_Plus?: Record<string, number>;
}

const board: Leaderboard = {
  benchmark: 'seed-bench-2-plus',
  host: 'OpenCompass',
  url: 'https://huggingface.co/spaces/opencompass/open_vlm_leaderboard',
  feed: `${FEED} (results[*].SEEDBench2_Plus.Overall)`,
  terms: 'OpenCompass publishes this public evaluation feed; OpenCompass and the underlying model licenses and attribution terms apply.',
  async fetch() {
    const data = await fetchJson<{ results?: Record<string, Result> }>(FEED);
    const rows: LeaderboardRow[] = [];
    for (const [name, result] of Object.entries(data.results ?? {})) {
      const values = result.SEEDBench2_Plus;
      const overall = values?.Overall;
      if (typeof overall !== 'number') continue;
      const metrics: Record<string, number> = {};
      for (const key of ['chart', 'map', 'web']) {
        const value = values?.[key];
        if (typeof value === 'number') metrics[key] = value;
      }
      rows.push({ model: name.trim(), score: overall, metrics });
    }
    if (!rows.length) throw new Error('no SEEDBench2_Plus rows in OpenVLM.json');
    return rows;
  },
};

export default board;
