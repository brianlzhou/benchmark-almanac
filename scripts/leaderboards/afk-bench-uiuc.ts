// AFK-Bench (UIUC, AutoPILOT authors): 120 real-time visual browser games split equally across Hostile, Benign, and
// Turn-based subsets where agents perceive only screen frames and act on the live (or paused) game clock. Reads the
// structured results array in data.js linked from autopilot-harness.github.io.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://autopilot-harness.github.io/';

interface AfkEntry {
  clock: string;
  model: string;
  harness: string;
  effort: string;
  scores: [number, number][];
}

const board: Leaderboard = {
  benchmark: 'afk-bench-uiuc',
  url: PAGE,
  feed: `${PAGE}data.js`,
  terms: 'Published openly on GitHub Pages by the AutoPILOT authors with no robots.txt restrictions.',
  harnesses: 'system',
  notModels: /^(No-op|Random)$/i,
  parts: {
    hostile: { name: 'Hostile', group: 'Success rate' },
    benign: { name: 'Benign', group: 'Success rate' },
    turnBased: { name: 'Turn-based', group: 'Success rate' },
    hostileProgress: { name: 'Hostile', group: 'Mean progress', unit: 'score', better: 'higher' },
    benignProgress: { name: 'Benign', group: 'Mean progress', unit: 'score', better: 'higher' },
    turnBasedProgress: { name: 'Turn-based', group: 'Mean progress', unit: 'score', better: 'higher' },
  },
  stats: {
    meanProgress: { name: 'Mean progress', unit: 'score', better: 'higher', note: 'Mean normalized game progress from 0 to 1 across all 120 games.' },
  },
  async fetch() {
    const html = await fetchText(PAGE);
    const dataMatch = html.match(/src="(data\.js[^"]*)"/);
    const dataUrl = dataMatch ? new URL(dataMatch[1], PAGE).href : `${PAGE}data.js`;
    const js = await fetchText(dataUrl);
    const start = js.indexOf('const results = [');
    if (start < 0) throw new Error('AFK-Bench results array not found');
    const arrStart = js.indexOf('[', start);
    const arrEnd = js.indexOf('];', arrStart);
    if (arrEnd < 0) throw new Error('AFK-Bench results array terminator not found');
    const entries = JSON.parse(js.slice(arrStart, arrEnd + 1)) as AfkEntry[];
    const out: LeaderboardRow[] = [];
    for (const r of entries) {
      if (r.harness === 'Baseline') continue;
      if (!Array.isArray(r.scores) || r.scores.length !== 4) throw new Error(`Unexpected scores tuple for ${r.model}`);
      const [[hostile, hostileProgress], [benign, benignProgress], [turnBased, turnBasedProgress], [overall, meanProgress]] = r.scores;
      const effortClean = r.effort && r.effort !== '—' && r.effort !== '-' ? r.effort : undefined;
      const setting = effortClean ? `${r.clock}, ${effortClean}` : r.clock;
      out.push({
        model: r.model,
        harness: r.harness,
        setting,
        score: overall,
        metrics: {
          hostile,
          benign,
          turnBased,
          hostileProgress,
          benignProgress,
          turnBasedProgress,
          meanProgress,
        },
      });
    }
    if (out.length < 20) throw new Error(`AFK-Bench returned only ${out.length} rows`);
    return out;
  },
};
export default board;
