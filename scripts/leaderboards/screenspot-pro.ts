// ScreenSpot-Pro (GUI grounding on professional software). The makers' grounding leaderboard at
// gui-agent.github.io/grounding-leaderboard/ loads results/screenspot_pro.json: per entry a description,
// link and accuracy (0 to 1) by application, by group and overall. The board ranks by results.overall.avg,
// which × 100 is the score. Many entries are grounding systems or zoom-in pipelines rather than plain
// models, and those stay unmatched unless the registry has them.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://gui-agent.github.io/grounding-leaderboard/results/screenspot_pro.json';

interface Entry {
  results?: { overall?: { avg?: number } };
}

const board: Leaderboard = {
  benchmark: 'screenspot-pro',
  url: 'https://gui-agent.github.io/grounding-leaderboard/',
  feed: `${FEED} (results.overall.avg)`,
  terms: 'Static JSON on the grounding leaderboard GitHub Pages site; the gui-agent/grounding-leaderboard repository is Apache-2.0.',
  aliases: {},
  async fetch() {
    const data = await fetchJson<Record<string, Entry>>(FEED);
    const rows: LeaderboardRow[] = [];
    for (const [name, e] of Object.entries(data)) {
      const avg = e.results?.overall?.avg;
      if (typeof avg !== 'number') continue;
      // "GPT5-high (resized)": the reasoning effort as a suffix
      const gpt5 = name.match(/^GPT5-(\w+) \((resized)\)$/);
      if (gpt5) rows.push({ model: 'GPT-5', setting: gpt5[1], harness: 'resized screenshots', score: avg * 100 });
      else rows.push({ model: name.trim(), score: avg * 100 });
    }
    if (!rows.length) throw new Error('no entries in screenspot_pro.json');
    return rows;
  },
};
export default board;
